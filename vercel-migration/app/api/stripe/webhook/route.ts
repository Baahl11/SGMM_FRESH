import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, getPlanTierFromPriceId, PLAN_FEATURES } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
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
  const tierLimits = {
    basico: { max_doctors: 1, max_locations: 1 },
    pro: { max_doctors: 10, max_locations: 5 },
    enterprise: { max_doctors: 999, max_locations: 999 },
    lifetime: { max_doctors: 999, max_locations: 999 },
  }

  const limits = tierLimits[tier]

  // Actualizar o crear registro en la tabla subscriptions
  const subscriptionData: any = {
    user_id: userId,
    plan_tier: tier === 'lifetime' ? 'enterprise' : tier,
    status: subscriptionStatus,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSubscription?.id || null,
    stripe_price_id: priceId,
    max_doctors: limits.max_doctors,
    max_locations: limits.max_locations,
    trial_start: trialStart?.toISOString() || null,
    trial_end: trialEnd?.toISOString() || null,
    current_period_start: stripeSubscription 
      ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString() 
      : null,
    current_period_end: stripeSubscription 
      ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString() 
      : null,
    updated_at: new Date().toISOString(),
  }

  // Usar upsert para crear o actualizar
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })

  if (subError) {
    console.error('❌ Error upserting subscription:', subError)
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
    updateUserData.subscription_start_date = new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
    updateUserData.subscription_end_date = new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
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
  
  // Actualizar tabla users (legacy)
  const updateData: any = {
    subscription_status: subscription.status,
    updated_at: new Date().toISOString(),
  }
  
  if ((subscription as any).current_period_start) {
    updateData.subscription_start_date = new Date((subscription as any).current_period_start * 1000).toISOString()
  }
  if ((subscription as any).current_period_end) {
    updateData.subscription_end_date = new Date((subscription as any).current_period_end * 1000).toISOString()
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
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }

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
  
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error marking subscription as canceled:', error)
  } else {
    console.log(`Subscription canceled for user ${userId}`)
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
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
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id)

  if (subError) {
    console.error('❌ Error updating subscription after payment:', subError)
  } else {
    console.log(`✅ Payment succeeded for user ${userId} - Subscription marked as active`)
  }
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
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


