import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { sendTrialWelcomeEmail } from '@/lib/email/trial-welcome'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'
import { PLAN_FEATURES } from '@/lib/stripe/config'

/**
 * POST /api/stripe/sync-session
 *
 * Fallback endpoint called from /trial-success to ensure the subscription is
 * persisted in the DB even when the Stripe webhook hasn't fired yet.
 *
 * This is safe to call multiple times (upsert/idempotent).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const sessionId: string | undefined = body?.session_id

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 })
    }

    // Demo sessions never hit Stripe
    if (sessionId.startsWith('demo_')) {
      return NextResponse.json({ synced: true, demo: true })
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Retrieve the Checkout Session from Stripe
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      })
    } catch (err: any) {
      console.error('[sync-session] Failed to retrieve Stripe session', err?.message)
      return NextResponse.json(
        { error: 'No se pudo recuperar la sesión de Stripe', details: err?.message },
        { status: 422 }
      )
    }

    // Security: the session's user_id metadata must match the authenticated user
    const sessionUserId = session.metadata?.user_id
    if (sessionUserId && sessionUserId !== user.id) {
      console.warn('[sync-session] user_id mismatch', { sessionUserId, authUserId: user.id })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.payment_status === 'unpaid' && session.status !== 'complete') {
      return NextResponse.json({
        synced: false,
        reason: 'checkout_not_complete',
        status: session.status,
      })
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer)?.id

    const subscription = session.subscription as Stripe.Subscription | null

    if (!subscription) {
      // One-time payment mode — nothing to sync
      return NextResponse.json({ synced: true, mode: session.mode })
    }

    const userId = sessionUserId ?? user.id
    const priceId = subscription.items.data[0]?.price?.id ?? ''

    // Determine plan tier
    type Tier = 'basico' | 'pro' | 'enterprise'
    let tier: Tier = 'basico'
    if (
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL
    ) {
      tier = 'pro'
    } else if (
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ||
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL
    ) {
      tier = 'enterprise'
    }

    const subStatus: string =
      subscription.trial_end && subscription.trial_end * 1000 > Date.now()
        ? 'trialing'
        : subscription.status

    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null
    const trialStart = subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null
    const periodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null
    const periodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000).toISOString()
      : null

    const subscriptionPayload = {
      user_id: userId,
      plan_tier: tier,
      max_doctors: PLAN_FEATURES[tier].max_doctors,
      max_locations: PLAN_FEATURES[tier].max_locations,
      features: [...PLAN_FEATURES[tier].features],
      status: subStatus,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      trial_start: trialStart,
      trial_end: trialEnd,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    }

    const { data: existingByStripeSub, error: existingByStripeSubError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (existingByStripeSubError) {
      console.error('[sync-session] Failed to check existing subscription by stripe_subscription_id', existingByStripeSubError)
      return NextResponse.json(
        { error: 'Error al verificar suscripción existente', details: existingByStripeSubError.message },
        { status: 500 }
      )
    }

    let writeError: any = null

    if (existingByStripeSub?.id) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionPayload)
        .eq('id', existingByStripeSub.id)
      writeError = error
    } else {
      const { data: existingByUser, error: existingByUserError } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingByUserError) {
        console.error('[sync-session] Failed to check existing subscription by user_id', existingByUserError)
        return NextResponse.json(
          { error: 'Error al verificar suscripción del usuario', details: existingByUserError.message },
          { status: 500 }
        )
      }

      if (existingByUser?.id) {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(subscriptionPayload)
          .eq('id', existingByUser.id)
        writeError = error
      } else {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptionPayload)
        writeError = error
      }
    }

    if (writeError) {
      console.error('[sync-session] Failed to persist subscription', writeError)
      return NextResponse.json(
        { error: 'Error al guardar suscripción', details: writeError.message },
        { status: 500 }
      )
    }

    // Also keep legacy users table in sync
    await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: subStatus,
        stripe_customer_id: customerId ?? null,
        stripe_subscription_id: subscription.id,
        subscription_start_date: periodStart,
        subscription_end_date: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Send transactional welcome email once the trial is truly active.
    if (subStatus === 'trialing' && user.email) {
      await sendTrialWelcomeEmail({
        userId,
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name,
        planTier: tier,
        priceId,
        trialStart,
        trialEnd,
        billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
        amountCents: subscription.items.data[0]?.price?.unit_amount ?? null,
        currency: subscription.items.data[0]?.price?.currency ?? 'mxn',
      })
    }

    if (subStatus === 'trialing') {
      try {
        await persistMarketingAttribution({
          userId,
          event: 'trial_started',
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: subscription.id,
        })
        await persistFunnelEvent({
          eventName: 'trial_started',
          path: '/api/stripe/sync-session',
          userId,
          metadata: {
            plan: tier,
            stripe_checkout_session_id: session.id,
            stripe_subscription_id: subscription.id,
          },
        })
      } catch (attributionError) {
        console.error('[sync-session] Failed to mark trial attribution', {
          userId,
          sessionId: session.id,
          errorMessage: (attributionError as Error).message,
        })
      }
    }

    console.log(`[sync-session] Synced subscription for user ${userId}: ${tier} (${subStatus})`)

    return NextResponse.json({
      synced: true,
      tier,
      status: subStatus,
      trial_end: trialEnd,
    })
  } catch (error: any) {
    console.error('[sync-session] Unexpected error', error)
    return NextResponse.json(
      { error: 'Error interno al sincronizar suscripción' },
      { status: 500 }
    )
  }
}
