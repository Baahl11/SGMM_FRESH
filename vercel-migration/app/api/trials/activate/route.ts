import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { trialEndDate } from '@/lib/config/trial'
import {
  noCardTrialEnabled,
  normalizeBillingCycle,
  normalizeSelfServicePlan,
  selfServicePlanPayload,
} from '@/lib/subscription/self-service'
import { normalizeMarketingAttribution } from '@/lib/marketing/attribution'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import { sendTrialWelcomeEmail } from '@/lib/email/trial-welcome'

export async function POST(request: NextRequest) {
  if (!noCardTrialEnabled()) {
    return NextResponse.json({ error: 'El trial sin tarjeta no esta habilitado' }, { status: 409 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesion' }, { status: 401 })
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Verifica tu correo antes de iniciar el trial', code: 'email_not_verified', email: user.email },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const planTier = normalizeSelfServicePlan(body?.planTier)
  const billingCycle = normalizeBillingCycle(body?.billingCycle)
  const marketingContext = normalizeMarketingAttribution(body?.marketingContext)

  if (!planTier || !billingCycle) {
    return NextResponse.json({ error: 'Plan o ciclo de facturacion invalido' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: existing, error: existingError } = await admin
    .from('subscriptions')
    .select('id, status, plan_tier, trial_end, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: 'No se pudo validar la suscripcion' }, { status: 500 })
  }

  if (existing) {
    const activeInternalTrial =
      existing.status === 'trialing' &&
      !existing.stripe_subscription_id &&
      existing.trial_end &&
      new Date(existing.trial_end).getTime() > Date.now()

    if (activeInternalTrial) {
      return NextResponse.json({ activated: true, alreadyActive: true, planTier: existing.plan_tier })
    }

    return NextResponse.json(
      { error: 'Esta cuenta ya utilizo su periodo de prueba', code: 'trial_already_used' },
      { status: 409 }
    )
  }

  const trialStart = new Date()
  const trialEnd = trialEndDate(trialStart)
  const planPayload = selfServicePlanPayload(planTier)

  const { data: subscription, error: insertError } = await admin
    .from('subscriptions')
    .insert({
      user_id: user.id,
      ...planPayload,
      status: 'trialing',
      stripe_price_id: `internal_trial_${planTier}_${billingCycle}`,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      trial_origin: 'self_service_no_card',
      billing_cycle: billingCycle,
    })
    .select('id, plan_tier, trial_start, trial_end')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Esta cuenta ya utilizo su periodo de prueba', code: 'trial_already_used' },
        { status: 409 }
      )
    }
    console.error('[trials/activate] Failed to create trial', insertError)
    return NextResponse.json({ error: 'No se pudo activar el trial' }, { status: 500 })
  }

  await admin
    .from('users')
    .update({
      subscription_tier: planTier,
      subscription_status: 'trialing',
      subscription_start_date: trialStart.toISOString(),
      subscription_end_date: trialEnd.toISOString(),
      updated_at: trialStart.toISOString(),
    })
    .eq('id', user.id)

  try {
    await persistMarketingAttribution({
      userId: user.id,
      context: marketingContext,
      event: 'trial_started',
      client: admin,
    })
    await persistFunnelEvent({
      eventName: 'trial_started',
      path: '/api/trials/activate',
      userId: user.id,
      context: marketingContext,
      metadata: { plan: planTier, billing: billingCycle, card_required: false },
      client: admin,
    })
  } catch (error) {
    console.error('[trials/activate] Attribution failed', { errorMessage: (error as Error).message })
  }

  if (user.email) {
    void sendTrialWelcomeEmail({
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name,
      planTier,
      priceId: `internal_trial_${planTier}_${billingCycle}`,
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      billingCycle,
      amountCents: null,
      currency: 'mxn',
    }).catch((error) => {
      console.error('[trials/activate] Welcome email failed', { errorMessage: (error as Error).message })
    })
  }

  return NextResponse.json({
    activated: true,
    subscriptionId: subscription.id,
    planTier: subscription.plan_tier,
    trialStart: subscription.trial_start,
    trialEnd: subscription.trial_end,
    redirectTo: '/welcome',
  })
}

