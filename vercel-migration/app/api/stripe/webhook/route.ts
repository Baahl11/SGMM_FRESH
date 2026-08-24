import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, getPlanTierFromPriceId, PLAN_FEATURES } from '@/lib/stripe/server'
import { getAddonConfig, type AddonType } from '@/lib/stripe/addons'
import { createClient } from '@/lib/supabase/server'
import { sendTrialWelcomeEmail } from '@/lib/email/trial-welcome'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'
import {
  getStripeInvoiceSubscriptionId,
  getStripeSubscriptionPeriod,
  stripeTimestampToIso,
} from '@/lib/stripe/billing-period'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not defined')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Procesar el evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        // Verificar si es un depósito o una suscripción
        if (session.metadata?.deposit_type === 'booking_deposit') {
          await handleDepositCheckoutCompleted(session)
        } else if (session.metadata?.purchase_type === 'addon') {
          await handleAddonCheckoutCompleted(session)
        } else {
          await handleCheckoutCompleted(session)
        }
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        await handleSubscriptionItemsUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      // Stripe Connect events
      case 'application_fee.created':
        await handleApplicationFeeCreated(event.data.object as Stripe.ApplicationFee)
        break

      // Add-on events handled above in customer.subscription.updated

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed
 * Crear o actualizar la suscripción del usuario
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const customerId = session.customer as string
  const mode = session.mode // 'payment' or 'subscription'

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  console.log(`✅ Checkout completed for user ${userId}, mode: ${mode}`)

  // Usar service_role client para bypass RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Determinar el tier basado en el price_id
  let tier: 'basico' | 'pro' | 'enterprise' | 'lifetime' = 'basico'
  let priceId = ''
  
  if (mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    priceId = subscription.items.data[0]?.price?.id || ''
  } else if (session.line_items?.data && session.line_items.data.length > 0) {
    priceId = session.line_items.data[0].price?.id || ''
  }

  // Determinar tier basado en el priceId
  if (priceId) {
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 
        priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL) {
      tier = 'pro'
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || 
               priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL) {
      tier = 'enterprise'
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME) {
      tier = 'lifetime'
    }
  }

  console.log(`💰 Determined tier: ${tier} from priceId: ${priceId}`)

  // Si es subscription, obtener detalles completos
  let stripeSubscription: Stripe.Subscription | null = null
  let subscriptionStatus = 'active'
  let trialStart: Date | null = null
  let trialEnd: Date | null = null

  if (mode === 'subscription' && session.subscription) {
    stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string)
    subscriptionStatus = stripeSubscription.status
    
    // Verificar si está en trial
    if (stripeSubscription.trial_start && stripeSubscription.trial_end) {
      trialStart = new Date(stripeSubscription.trial_start * 1000)
      trialEnd = new Date(stripeSubscription.trial_end * 1000)
      subscriptionStatus = 'trialing'
      console.log(`🎉 Trial active: ${trialStart.toISOString()} to ${trialEnd.toISOString()}`)
    }
  }

  // Determinar features y límites según el tier
  const normalizedTier = tier === 'lifetime' ? 'enterprise' : tier
  const planConfig = PLAN_FEATURES[normalizedTier]
  const stripePeriod = stripeSubscription
    ? getStripeSubscriptionPeriod(stripeSubscription as any)
    : { start: null, end: null }

  // 🔥 Extraer metadata de ventas (sales team y application fee)
  const salesTeam = session.metadata?.sales_team || 'internal'
  const referralSource = session.metadata?.referral_source || 'direct'
  const applicationFeePercent = parseFloat(session.metadata?.your_commission_percent || '0')
  const sellerId = session.metadata?.seller_id || null // ← Capturar seller_id
  
  // Calcular el monto de la comisión si aplica
  let platformFeeAmount = 0
  if (session.amount_total && applicationFeePercent > 0) {
    platformFeeAmount = (session.amount_total / 100) * (applicationFeePercent / 100)
  }

  // Actualizar o crear registro en la tabla subscriptions
  const subscriptionData: any = {
    user_id: userId,
    plan_tier: normalizedTier,
    status: subscriptionStatus,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSubscription?.id || null,
    stripe_price_id: priceId,
    max_doctors: planConfig.max_doctors,
    max_locations: planConfig.max_locations,
    features: [...planConfig.features],
    trial_start: trialStart?.toISOString() || null,
    trial_end: trialEnd?.toISOString() || null,
    current_period_start: stripeTimestampToIso(stripePeriod.start),
    current_period_end: stripeTimestampToIso(stripePeriod.end),
    sales_team: salesTeam,                           // ← NUEVO
    referral_source: referralSource,                 // ← NUEVO
    application_fee_percent: applicationFeePercent,  // ← NUEVO
    platform_fee_amount: platformFeeAmount,          // ← NUEVO
    seller_id: sellerId,                             // ← NUEVO
    updated_at: new Date().toISOString(),
  }

  const stripeSubscriptionId = stripeSubscription?.id || null
  let subscriptionWriteError: any = null

  if (stripeSubscriptionId) {
    const { data: existingByStripeSub, error: existingByStripeSubError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (existingByStripeSubError) {
      console.error('❌ Error checking existing subscription by stripe_subscription_id:', existingByStripeSubError)
      subscriptionWriteError = existingByStripeSubError
    } else if (existingByStripeSub?.id) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingByStripeSub.id)
      subscriptionWriteError = error
    }
  }

  if (!subscriptionWriteError) {
    const { data: existingByUser, error: existingByUserError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingByUserError) {
      subscriptionWriteError = existingByUserError
    } else if (existingByUser?.id) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingByUser.id)
      subscriptionWriteError = error
    } else {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
      subscriptionWriteError = error
    }
  }

  if (subscriptionWriteError) {
    console.error('❌ Error persisting subscription:', subscriptionWriteError)
  } else {
    console.log(`✅ Subscription updated for user ${userId}: ${tier} (${subscriptionStatus})`)
  }

  // También actualizar tabla users (legacy, para compatibilidad)
  const updateUserData: any = {
    subscription_tier: tier,
    subscription_status: subscriptionStatus,
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  }

  if (stripeSubscription) {
    updateUserData.stripe_subscription_id = stripeSubscription.id
    updateUserData.subscription_start_date = stripeTimestampToIso(stripePeriod.start)
    updateUserData.subscription_end_date = stripeTimestampToIso(stripePeriod.end)
  } else if (mode === 'payment') {
    // Lifetime - pago único
    updateUserData.subscription_start_date = new Date().toISOString()
    updateUserData.subscription_end_date = null
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(updateUserData)
    .eq('id', userId)

  if (error) {
    console.error('❌ Error updating user:', error)
  } else {
    console.log(`✅ User ${userId} upgraded to ${tier}`)
  }

  // Transactional confirmation email for newly activated trial/subscription.
  // Idempotency is handled by subscriptions.onboarding_emails_sent.
  try {
    const { data: appUser } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle()

    const recipientEmail = appUser?.email || session.customer_details?.email || undefined
    if (recipientEmail && subscriptionStatus === 'trialing') {
      await sendTrialWelcomeEmail({
        userId,
        email: recipientEmail,
        name: appUser?.name,
        planTier: tier,
        priceId,
        trialStart: trialStart?.toISOString() ?? null,
        trialEnd: trialEnd?.toISOString() ?? null,
        billingCycle: stripeSubscription?.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
        amountCents: stripeSubscription?.items?.data?.[0]?.price?.unit_amount ?? null,
        currency: stripeSubscription?.items?.data?.[0]?.price?.currency ?? 'mxn',
      })
    }
  } catch (welcomeError) {
    console.error('[Stripe Webhook] Failed to send welcome trial email', welcomeError)
  }

  if (subscriptionStatus === 'trialing') {
    try {
      await persistMarketingAttribution({
        userId,
        event: 'trial_started',
        stripeCheckoutSessionId: session.id,
        stripeSubscriptionId: stripeSubscription?.id ?? null,
      })
      await persistFunnelEvent({
        eventName: 'trial_started',
        path: '/api/stripe/webhook',
        userId,
        metadata: {
          plan: tier,
          stripe_checkout_session_id: session.id,
          stripe_subscription_id: stripeSubscription?.id ?? null,
        },
      })
    } catch (attributionError) {
      console.error('[Stripe Webhook] Failed to mark trial attribution', {
        userId,
        sessionId: session.id,
        errorMessage: (attributionError as Error).message,
      })
    }
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('🔍 Subscription updated:', subscription.id)
  
  let userId = subscription.metadata?.user_id
  
  if (!userId) {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  }
  
  if (!userId) {
    console.error('❌ No user_id found in subscription or customer metadata')
    return
  }

  // Usar service_role client
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const subscriptionPeriod = getStripeSubscriptionPeriod(subscription as any)
  const periodStartIso = stripeTimestampToIso(subscriptionPeriod.start)
  const periodEndIso = stripeTimestampToIso(subscriptionPeriod.end)
  
  // Actualizar tabla users (legacy)
  const updateData: any = {
    subscription_status: subscription.status,
    updated_at: new Date().toISOString(),
  }
  
  if (periodStartIso) {
    updateData.subscription_start_date = periodStartIso
  }
  if (periodEndIso) {
    updateData.subscription_end_date = periodEndIso
  }
  if ((subscription as any).canceled_at) {
    updateData.subscription_status = 'cancelled'
  }
  
  const { error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('❌ Error updating users table:', error)
  }

  // 🔥 CRÍTICO: Actualizar tabla subscriptions también
  const priceId = subscription.items.data[0]?.price.id
  const subscriptionUpdateData: any = {
    status: subscription.status,
    stripe_price_id: priceId,
    updated_at: new Date().toISOString(),
  }

  if (periodStartIso) subscriptionUpdateData.current_period_start = periodStartIso
  if (periodEndIso) subscriptionUpdateData.current_period_end = periodEndIso

  // Si la suscripción pasó de trialing a active, actualizar
  if (subscription.status === 'active' && (subscription as any).trial_end) {
    subscriptionUpdateData.trial_end = new Date((subscription as any).trial_end * 1000).toISOString()
  }

  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update(subscriptionUpdateData)
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id)

  if (subError) {
    console.error('❌ Error updating subscriptions table:', subError)
  } else {
    console.log(`✅ Subscription updated for user ${userId} - Status: ${subscription.status}`)
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  let userId = subscription.metadata?.user_id
  
  if (!userId) {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  }
  
  if (!userId) {
    console.error('No user_id found in subscription or customer metadata')
    return
  }

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const nowIso = new Date().toISOString()
  
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: nowIso,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      updated_at: nowIso,
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error marking users table subscription as canceled:', userError)
  } else {
    console.log(`Users table updated after cancellation for user ${userId}`)
  }

  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_customer_id: null,
      current_period_end: nowIso,
      updated_at: nowIso,
    })
    .eq('user_id', userId)

  if (subscriptionError) {
    console.error('Error marking subscriptions table as canceled:', subscriptionError)
  } else {
    console.log(`Subscriptions table updated after cancellation for user ${userId}`)
  }

  // 🎯 NUEVO: Cancelar comisiones pendientes de vendedor (si cliente cancela en mes 2)
  const sellerId = subscription.metadata?.seller_id
  if (sellerId) {
    // Buscar comisiones pendientes de pago para este vendedor
    const { data: pendingCommissions } = await supabaseAdmin
      .from('seller_commissions')
      .select('id, month_number, commission_amount, commission_stage')
      .eq('user_id', userId)
      .eq('seller_id', sellerId)
      .eq('paid_to_seller', false)
      .eq('cancelled', false)

    if (pendingCommissions && pendingCommissions.length > 0) {
      // Marcar comisiones como canceladas
      const commissionIds = pendingCommissions.map(c => c.id)
      
      await supabaseAdmin
        .from('seller_commissions')
        .update({
          cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cliente canceló suscripción antes de completar mes 2',
        })
        .in('id', commissionIds)

      console.log(`⚠️ Comisiones canceladas para vendedor ${sellerId} - Cliente canceló en mes ${pendingCommissions[0].month_number}`)
    }
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getStripeInvoiceSubscriptionId(invoice as any)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  let userId = subscription.metadata?.user_id
  
  if (!userId) {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  }
  
  if (!userId) return

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Actualizar tabla users (legacy)
  await supabaseAdmin
    .from('users')
    .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
    .eq('id', userId)

  // 🔥 CRÍTICO: Actualizar tabla subscriptions - marcar como active después del pago
  const { data: subscriptionData, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id)
    .select()
    .single()

  if (subError) {
    console.error('❌ Error updating subscription after payment:', subError)
    return
  }

  console.log(`✅ Payment succeeded for user ${userId} - Subscription marked as active`)

  // 🎯 NUEVO: Rastrear comisiones de vendedores
  const sellerId = subscription.metadata?.seller_id || subscriptionData?.seller_id
  const salesTeam = subscription.metadata?.sales_team || subscriptionData?.sales_team || 'internal'

  if (sellerId && salesTeam === 'distributor') {
    // Calcular número de mes de la suscripción
    const createdAt = new Date(subscription.created * 1000)
    const now = new Date()
    const monthsDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)) + 1
    
    const grossAmount = invoice.total / 100 // Convertir de centavos a pesos
    let commissionStage: string
    let commissionAmount = 0
    let commissionPercent = 0

    if (monthsDiff === 1) {
      // Mes 1: Trial (no debe cobrar, pero registramos)
      commissionStage = 'trial'
      commissionAmount = 0
      commissionPercent = 0
    } else if (monthsDiff === 2) {
      // Mes 2: 100% al vendedor
      commissionStage = 'seller_month'
      commissionAmount = grossAmount
      commissionPercent = 100
    } else {
      // Mes 3+: División normal (vendedor ya no recibe)
      commissionStage = 'normal'
      commissionAmount = 0
      commissionPercent = 0
    }

    // Crear registro de comisión
    const { error: commissionError } = await supabaseAdmin
      .from('seller_commissions')
      .insert({
        subscription_id: subscriptionData.id,
        seller_id: sellerId,
        user_id: userId,
        month_number: monthsDiff,
        billing_date: new Date().toISOString(),
        period_start: stripeTimestampToIso(getStripeSubscriptionPeriod(subscription as any).start),
        period_end: stripeTimestampToIso(getStripeSubscriptionPeriod(subscription as any).end),
        commission_stage: commissionStage,
        gross_amount: grossAmount,
        commission_amount: commissionAmount,
        commission_percent: commissionPercent,
        stripe_invoice_id: invoice.id,
        paid_to_seller: false,
      })

    if (commissionError) {
      console.error('❌ Error creating seller commission:', commissionError)
    } else {
      console.log(`✅ Seller commission created: ${sellerId} - Month ${monthsDiff} - Stage: ${commissionStage} - Amount: $${commissionAmount}`)
    }
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getStripeInvoiceSubscriptionId(invoice as any)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  let userId = subscription.metadata?.user_id
  
  if (!userId) {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    userId = (customer as Stripe.Customer).metadata?.supabase_user_id
  }
  
  if (!userId) return

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Actualizar tabla users (legacy)
  await supabaseAdmin
    .from('users')
    .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
    .eq('id', userId)

  // 🔥 CRÍTICO: Actualizar tabla subscriptions - marcar como moroso
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update({ 
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id)

  if (subError) {
    console.error('❌ Error updating subscription after payment failure:', subError)
  } else {
    console.log(`⚠️ Payment failed for user ${userId} - Subscription marked as past_due`)
  }
}

// ============================================
// BOOKING DEPOSITS HANDLERS
// ============================================

/**
 * Handle checkout.session.completed for deposits
 */
async function handleDepositCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💰 Deposit checkout completed:', session.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('booking_deposits')
    .update({ payment_status: 'processing' })
    .eq('checkout_session_id', session.id)

  if (error) {
    console.error('❌ Error updating deposit:', error)
  } else {
    console.log('✅ Deposit marked as processing')
  }
}

/**
 * Handle payment_intent.succeeded for deposits
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Verificar si es un depósito
  if (paymentIntent.metadata?.deposit_type !== 'booking_deposit') {
    return // No es un depósito, ignorar
  }

  console.log('✅ Deposit payment succeeded:', paymentIntent.id)
  console.log('📋 Payment Intent metadata:', paymentIntent.metadata)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener detalles del método de pago
  const paymentMethod = paymentIntent.payment_method
    ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
    : null

  // 🔍 Buscar el depósito - primero por payment_intent_id, luego por booking_id
  let deposit = null
  
  // Intento 1: Buscar por payment_intent_id
  const { data: depositByPI } = await supabaseAdmin
    .from('booking_deposits')
    .select('*')
    .eq('payment_intent_id', paymentIntent.id)
    .single()
  
  if (depositByPI) {
    deposit = depositByPI
    console.log('✅ Found deposit by payment_intent_id')
  } else {
    console.log('⚠️ Deposit not found by payment_intent_id, trying booking_id...')
    
    // Intento 2: Buscar por booking_id en metadata + status processing
    const bookingId = paymentIntent.metadata?.booking_id
    if (bookingId) {
      const { data: depositByBooking } = await supabaseAdmin
        .from('booking_deposits')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('payment_status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (depositByBooking) {
        deposit = depositByBooking
        console.log('✅ Found deposit by booking_id:', bookingId)
      }
    }
  }

  if (!deposit) {
    console.error('❌ Deposit not found for payment intent:', paymentIntent.id)
    console.error('❌ Tried payment_intent_id and booking_id:', paymentIntent.metadata?.booking_id)
    return
  }

  console.log('📝 Updating deposit:', deposit.id)

  // Actualizar el depósito
  const { error: updateError } = await supabaseAdmin
    .from('booking_deposits')
    .update({
      payment_intent_id: paymentIntent.id, // ⚠️ Guardar el payment_intent_id ahora
      payment_status: 'succeeded',
      paid_at: new Date().toISOString(),
      payment_method_type: paymentMethod?.type || null,
      last4: paymentMethod?.type === 'card' ? paymentMethod.card?.last4 : null,
      card_brand: paymentMethod?.type === 'card' ? paymentMethod.card?.brand : null,
    })
    .eq('id', deposit.id)

  if (updateError) {
    console.error('❌ Error updating deposit:', updateError)
    return
  }

  console.log('✅ Deposit updated successfully')

  // Actualizar la reserva a confirmada
  await supabaseAdmin
    .from('public_bookings')
    .update({
      deposit_status: 'paid',
      status: 'confirmed',
    })
    .eq('id', deposit.booking_id)

  console.log('✅ Booking confirmed:', deposit.booking_id)

  // Enviar notificación de confirmación
  try {
    const { data: booking } = await supabaseAdmin
      .from('public_bookings')
      .select('*')
      .eq('id', deposit.booking_id)
      .single()

    if (booking) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          event_type: 'booking_confirmed',
          send_email: true,
          send_whatsapp: true,
        }),
      })
      console.log('✅ Confirmation notification sent')
    }
  } catch (notifError) {
    console.error('Error sending notification:', notifError)
  }

  console.log('✅ Deposit completed and booking confirmed')
}

/**
 * Handle payment_intent.payment_failed for deposits
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata?.deposit_type !== 'booking_deposit') {
    return
  }

  console.log('❌ Deposit payment failed:', paymentIntent.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: deposit } = await supabaseAdmin
    .from('booking_deposits')
    .update({
      payment_status: 'failed',
      metadata: {
        error: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    })
    .eq('payment_intent_id', paymentIntent.id)
    .select()
    .single()

  if (deposit) {
    await supabaseAdmin
      .from('public_bookings')
      .update({ deposit_status: 'failed' })
      .eq('id', deposit.booking_id)

    console.log('❌ Deposit marked as failed')
  }
}

/**
 * Handle payment_intent.canceled for deposits
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata?.deposit_type !== 'booking_deposit') {
    return
  }

  console.log('🚫 Deposit payment canceled:', paymentIntent.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: deposit } = await supabaseAdmin
    .from('booking_deposits')
    .update({ payment_status: 'cancelled' })
    .eq('payment_intent_id', paymentIntent.id)
    .select()
    .single()

  if (deposit) {
    await supabaseAdmin
      .from('public_bookings')
      .update({ deposit_status: 'failed' })
      .eq('id', deposit.booking_id)

    console.log('🚫 Deposit marked as cancelled')
  }
}

/**
 * Handle checkout completions for add-on purchases
 * Crea o actualiza los add-ons después de que el usuario paga en Stripe Checkout
 */
async function handleAddonCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    if (session.metadata?.purchase_type !== 'addon') {
      return
    }

    const addonType = session.metadata.addon_type as AddonType | undefined
    const userId = session.metadata.user_id
    const subscriptionId = session.metadata.subscription_id
    const metadataSubscriptionId = session.metadata.stripe_subscription_id || null
    const checkoutSubscriptionId = (session.subscription as string | null) || metadataSubscriptionId
    const quantity = parseInt(session.metadata.quantity || '0', 10)

    if (!addonType || !userId || !subscriptionId || !checkoutSubscriptionId || !quantity || quantity < 1) {
      console.error('❌ Missing metadata for add-on checkout session', session.id)
      return
    }

    const addonConfig = getAddonConfig(addonType)
    if (!addonConfig) {
      console.error('❌ Invalid add-on type in checkout session:', addonType)
      return
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id')
      .eq('id', subscriptionId)
      .single()

    if (!subscription) {
      console.error('❌ Subscription not found for add-on checkout:', subscriptionId)
      return
    }

    if (subscription.user_id !== userId) {
      console.warn('⚠️ User mismatch on add-on checkout session, using subscription owner', {
        session: session.id,
        metadataUser: userId,
        subscriptionUser: subscription.user_id,
      })
    }

    let { data: existingAddon } = await supabaseAdmin
      .from('subscription_addons')
      .select('*')
      .eq('user_id', subscription.user_id)
      .eq('subscription_id', subscriptionId)
      .eq('addon_type', addonType)
      .eq('status', 'active')
      .maybeSingle()

    if (!subscription.stripe_subscription_id || subscription.stripe_subscription_id !== checkoutSubscriptionId) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          stripe_subscription_id: checkoutSubscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
    }

    const previousQuantity = existingAddon?.quantity ?? 0
    const newQuantity = previousQuantity + quantity

    if (newQuantity > addonConfig.maxQuantity) {
      console.warn(`⚠️ Add-on quantity limit exceeded for user ${subscription.user_id}`)
      return
    }

    let stripeSubscriptionItemId = existingAddon?.stripe_subscription_item_id || null

    if (checkoutSubscriptionId.startsWith('sub_')) {
      if (stripeSubscriptionItemId?.startsWith('si_')) {
        await stripe.subscriptionItems.update(stripeSubscriptionItemId, {
          quantity: newQuantity,
          proration_behavior: 'none',
        })
      } else {
        const subscriptionItem = await stripe.subscriptionItems.create({
          subscription: checkoutSubscriptionId,
          price: addonConfig.priceId,
          quantity: newQuantity,
          proration_behavior: 'none',
        })
        stripeSubscriptionItemId = subscriptionItem.id
      }
    } else {
      console.warn('⚠️ Invalid Stripe subscription id for add-on checkout:', checkoutSubscriptionId)
    }

    if (!existingAddon) {
      const { data: legacyAddon } = await supabaseAdmin
        .from('subscription_addons')
        .select('*')
        .eq('user_id', subscription.user_id)
        .eq('addon_type', addonType)
        .eq('status', 'active')
        .is('stripe_subscription_item_id', null)
        .maybeSingle()

      if (legacyAddon) {
        existingAddon = legacyAddon
      }
    }

    if (existingAddon) {
      await supabaseAdmin
        .from('subscription_addons')
        .update({
          quantity: newQuantity,
          stripe_subscription_item_id: stripeSubscriptionItemId,
          stripe_price_id: addonConfig.priceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAddon.id)
    } else {
      await supabaseAdmin
        .from('subscription_addons')
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscriptionId,
          addon_type: addonType,
          stripe_subscription_item_id: stripeSubscriptionItemId,
          stripe_price_id: addonConfig.priceId,
          quantity: newQuantity,
          unit_price: addonConfig.price,
          status: 'active',
        })
    }

    console.log(
      `✅ Add-on checkout completado para usuario ${subscription.user_id}: ${addonType} (+${quantity})`
    )
  } catch (error) {
    console.error('❌ Error handling add-on checkout session:', error)
  }
}

/**
 * Handle subscription items update (add-ons)
 * Syncs add-on subscription items from Stripe to database
 */
async function handleSubscriptionItemsUpdate(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription items update:', subscription.id)

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the subscription from database to find user_id
  const { data: dbSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!dbSubscription) {
    console.log('⚠️ Subscription not found in database:', subscription.id)
    return
  }

  // Get addon price IDs from env
  const addonPriceIds = {
    extra_location: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_LOCATION,
    extra_doctor: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_EXTRA_DOCTOR,
  }

  // Process each subscription item
  for (const item of subscription.items.data) {
    const priceId = item.price.id
    let addonType: string | null = null

    // Determine addon type from price ID
    if (priceId === addonPriceIds.extra_location) {
      addonType = 'extra_location'
    } else if (priceId === addonPriceIds.extra_doctor) {
      addonType = 'extra_doctor'
    }

    // Skip if not an add-on
    if (!addonType) continue

    // Check if add-on already exists
    const { data: existingAddon } = await supabaseAdmin
      .from('subscription_addons')
      .select('*')
      .eq('stripe_subscription_item_id', item.id)
      .maybeSingle()

    const unitPrice = item.price.unit_amount ? item.price.unit_amount / 100 : 0

    if (existingAddon) {
      // Update existing add-on
      await supabaseAdmin
        .from('subscription_addons')
        .update({
          quantity: item.quantity || 1,
          status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAddon.id)

      console.log(`✅ Updated add-on: ${addonType} (${item.quantity})`)
    } else {
      // Create new add-on
      await supabaseAdmin
        .from('subscription_addons')
        .insert({
          user_id: dbSubscription.user_id,
          subscription_id: dbSubscription.id,
          addon_type: addonType,
          stripe_subscription_item_id: item.id,
          stripe_price_id: priceId,
          quantity: item.quantity || 1,
          unit_price: unitPrice,
          status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'canceled',
        })

      console.log(`✅ Created add-on: ${addonType} (${item.quantity})`)
    }
  }
}

/**
 * Handle application_fee.created - Tracking de comisiones de plataforma
 * Se dispara cuando se cobra una comisión por Stripe Connect
 */
async function handleApplicationFeeCreated(fee: Stripe.ApplicationFee) {
  console.log('💰 Application fee created:', fee.id, '-', fee.amount / 100, 'MXN')

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar el depósito relacionado usando el charge ID
  const { data: deposit } = await supabaseAdmin
    .from('booking_deposits')
    .select('*')
    .eq('payment_intent_id', fee.charge)
    .single()

  if (!deposit) {
    console.error('❌ Deposit not found for application fee:', fee.id)
    return
  }

  const totalAmount = deposit.amount
  const feeAmount = fee.amount / 100 // Convertir de centavos a MXN
  const netAmount = totalAmount - feeAmount
  const feePercentage = (feeAmount / totalAmount) * 100

  console.log(`💸 Fee breakdown: Total $${totalAmount} - Fee $${feeAmount} = Net $${netAmount}`)

  // Registrar la comisión en platform_fees
  const { error } = await supabaseAdmin
    .from('platform_fees')
    .insert({
      booking_deposit_id: deposit.id,
      clinic_user_id: deposit.clinic_user_id,
      connected_account_id: deposit.connected_account_id,
      total_amount: totalAmount,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      net_amount: netAmount,
      stripe_application_fee_id: fee.id,
      payment_intent_id: deposit.payment_intent_id,
      status: 'collected',
      collected_at: new Date().toISOString(),
    })

  if (error) {
    console.error('❌ Error creating platform fee record:', error)
  } else {
    console.log(`✅ Platform fee tracked: $${feeAmount.toFixed(2)} MXN (${feePercentage.toFixed(2)}%)`)
  }
}


