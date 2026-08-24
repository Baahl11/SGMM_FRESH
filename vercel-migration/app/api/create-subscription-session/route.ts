import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { normalizeMarketingAttribution } from '@/lib/marketing/attribution'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import {
  normalizeBillingCycle,
  normalizeSelfServicePlan,
} from '@/lib/subscription/self-service'

function appBaseUrl(request: NextRequest) {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return new URL(normalized).origin
}

function cleanStripeId(value: string) {
  return value.replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesion' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const planTier = normalizeSelfServicePlan(body?.planTier)
  const billingCycle = normalizeBillingCycle(body?.billingCycle)
  const marketingContext = normalizeMarketingAttribution(body?.marketingContext)
  if (!planTier || !billingCycle) {
    return NextResponse.json({ error: 'Plan o ciclo de facturacion invalido' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: currentSubscription, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id, status, trial_end, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subscriptionError || !currentSubscription) {
    return NextResponse.json({ error: 'No encontramos un trial para convertir' }, { status: 409 })
  }
  if (currentSubscription.status === 'active' || currentSubscription.stripe_subscription_id?.startsWith('sub_')) {
    return NextResponse.json({ error: 'Ya tienes una suscripcion activa' }, { status: 409 })
  }
  if (!currentSubscription.trial_end || new Date(currentSubscription.trial_end).getTime() > Date.now()) {
    return NextResponse.json({ error: 'Tu trial aun se encuentra activo' }, { status: 409 })
  }

  const priceMap = {
    pro: {
      monthly: STRIPE_PRICES.PRO_MONTHLY,
      annual: STRIPE_PRICES.PRO_ANNUAL,
    },
    enterprise: {
      monthly: STRIPE_PRICES.ENTERPRISE_MONTHLY,
      annual: STRIPE_PRICES.ENTERPRISE_ANNUAL,
    },
  }
  const priceId = cleanStripeId(priceMap[planTier][billingCycle])
  if (!priceId || priceId.includes('placeholder')) {
    return NextResponse.json({ error: 'El precio seleccionado no esta configurado' }, { status: 500 })
  }

  const { data: appUser } = await admin
    .from('users')
    .select('stripe_customer_id, email, name')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = currentSubscription.stripe_customer_id || appUser?.stripe_customer_id || null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: appUser?.email || user.email,
      name: appUser?.name || user.user_metadata?.name || user.email?.split('@')[0],
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id)
    await admin.from('subscriptions').update({ stripe_customer_id: customer.id }).eq('id', currentSubscription.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { plan_tier: planTier, user_id: user.id, conversion: 'post_internal_trial' },
    },
    metadata: {
      plan_tier: planTier,
      user_id: user.id,
      conversion: 'post_internal_trial',
    },
    success_url: `${appBaseUrl(request)}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl(request)}/select-trial-plan?reason=trial_expired&canceled=true`,
    allow_promotion_codes: true,
  })

  try {
    await persistMarketingAttribution({
      userId: user.id,
      context: marketingContext,
      event: 'checkout_started',
      stripeCheckoutSessionId: session.id,
      client: admin,
    })
    await persistFunnelEvent({
      eventName: 'checkout_started',
      path: '/api/create-subscription-session',
      userId: user.id,
      context: marketingContext,
      metadata: { plan: planTier, billing: billingCycle, immediate_charge: true },
      client: admin,
    })
  } catch (error) {
    console.error('[create-subscription-session] Attribution failed', {
      errorMessage: (error as Error).message,
    })
  }

  return NextResponse.json({ url: session.url, sessionId: session.id })
}

