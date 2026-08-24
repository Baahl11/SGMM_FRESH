import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import {
  getDemoIntegrationPolicy,
  logDemoAuditEvent,
  resolveDemoModeConfig,
} from '@/lib/demo-mode'
import { normalizeMarketingAttribution } from '@/lib/marketing/attribution'
import { persistFunnelEvent } from '@/lib/analytics/funnel-server'
import { persistMarketingAttribution } from '@/lib/marketing/attribution-server'

function resolveAppBaseUrl(request: NextRequest) {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    request.nextUrl.origin,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    const cleaned = candidate.trim().replace(/^['"]|['"]$/g, '')
    if (!cleaned) continue

    const withProtocol = /^https?:\/\//i.test(cleaned)
      ? cleaned
      : `https://${cleaned}`

    try {
      const parsed = new URL(withProtocol)
      const normalizedPath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')
      return `${parsed.origin}${normalizedPath}`
    } catch {
      // Try next candidate.
    }
  }

  return request.nextUrl.origin
}

/**
 * POST /api/create-trial-session
 * 
 * Creates a Stripe Checkout Session with 14-day trial
 * User MUST be authenticated + email verified + add card to start trial
 * After 14 days, automatically charges the selected plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const appBaseUrl = resolveAppBaseUrl(request)

    // Verificar autenticación obligatoria para activar trial.
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para activar tu trial' },
        { status: 401 }
      )
    }

    // Email verification is no longer a hard block for trial creation.
    // Users who haven't verified yet can still start the Stripe trial and
    // enter their card. They will be reminded to verify their email later.
    // Blocking unverified users here caused an infinite redirect loop where
    // new signups could never reach the checkout page.
    if (!user.email_confirmed_at) {
      console.warn('[create-trial-session] Unverified email creating trial', {
        userId: user.id,
        email: user.email,
      })
    }

    const body = await request.json()
    const { priceId, planTier } = body
    const marketingContext = normalizeMarketingAttribution(body?.marketingContext)

    if (!priceId || !planTier) {
      return NextResponse.json(
        { error: 'priceId y planTier son requeridos' },
        { status: 400 }
      )
    }

    const demoConfig = await resolveDemoModeConfig(supabase, user.id)
    const stripePolicy = getDemoIntegrationPolicy(demoConfig, 'stripe')

    if (stripePolicy.shouldSimulate) {
      const simulatedSessionId = `demo_cs_trial_${Date.now()}`
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      const { error: subscriptionUpsertError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan_tier: planTier,
            status: 'trialing',
            stripe_customer_id: `demo_cus_${Date.now()}`,
            stripe_subscription_id: `demo_sub_${Date.now()}`,
            trial_end: trialEnd,
            current_period_end: trialEnd,
          },
          { onConflict: 'user_id' }
        )

      if (subscriptionUpsertError) {
        console.warn('[DemoMode] No se pudo upsert trial simulado:', subscriptionUpsertError)
      }

      await logDemoAuditEvent(supabase, user.id, {
        eventType: 'stripe_trial_session_simulated',
        integration: 'stripe',
        resourceType: 'checkout_session',
        resourceId: simulatedSessionId,
        status: 'simulated',
        payload: {
          plan_tier: planTier,
          price_id: priceId,
          trial_end: trialEnd,
        },
      })

      return NextResponse.json({
        url: `${appBaseUrl}/trial-success?session_id=${simulatedSessionId}&demo=1`,
        sessionId: simulatedSessionId,
        demo_mode: true,
      })
    }

    // Verificar estado de suscripción.
    // Permitimos continuar si existe trial legacy sin stripe_subscription_id
    // para forzar captura de tarjeta y migrarlo al flujo real de Stripe.
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (existingSub) {
      const hasStripeSubscription =
        typeof existingSub.stripe_subscription_id === 'string' &&
        existingSub.stripe_subscription_id.startsWith('sub_')

      // Si ya tiene subscripción Stripe real, no crear otra sesión de trial
      if (existingSub.status === 'active' || hasStripeSubscription) {
        return NextResponse.json(
          { error: 'Ya tienes una suscripción activa' },
          { status: 400 }
        )
      }

      // Trial legacy (sin sub_): continuar para capturar tarjeta en Stripe
    }

    // Crear Checkout Session con TRIAL de 14 días
    // Usuario autenticado: usa o crea customer asociado.
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'], // Acepta todas las tarjetas (crédito y débito)
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Seguridad 3D cuando sea necesario
        },
      },
      billing_address_collection: 'auto', // Recopilar dirección de facturación cuando sea necesario
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // 🎯 14 días de prueba gratis
        metadata: {
          plan_tier: planTier,
          user_id: user.id,
        },
      },
      metadata: {
        plan_tier: planTier,
        user_id: user.id,
      },
      success_url: `${appBaseUrl}/trial-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/select-trial-plan?canceled=true`,
      allow_promotion_codes: true,
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single()

    if (userData?.stripe_customer_id) {
      sessionConfig.customer = userData.stripe_customer_id
    } else {
      // Crear nuevo customer en Stripe
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        name: userData?.name || user.email?.split('@')[0],
        metadata: {
          supabase_user_id: user.id,
        },
      })
      sessionConfig.customer = customer.id

      // Guardar customer_id en la base de datos
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    try {
      await persistMarketingAttribution({
        userId: user.id,
        context: marketingContext,
        event: 'checkout_started',
        stripeCheckoutSessionId: session.id,
      })
      await persistFunnelEvent({
        eventName: 'checkout_started',
        path: '/api/create-trial-session',
        userId: user.id,
        context: marketingContext,
        metadata: {
          plan: planTier,
          stripe_checkout_session_id: session.id,
        },
      })
    } catch (attributionError) {
      console.error('[create-trial-session] Failed to mark checkout attribution', {
        userId: user.id,
        sessionId: session.id,
        errorMessage: (attributionError as Error).message,
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating trial session:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión de prueba' },
      { status: 500 }
    )
  }
}
