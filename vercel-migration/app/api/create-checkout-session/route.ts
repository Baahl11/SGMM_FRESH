import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import {
  getDemoIntegrationPolicy,
  logDemoAuditEvent,
  resolveDemoModeConfig,
} from '@/lib/demo-mode'

// Usar service role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { priceId, planTier } = await request.json()
    const normalizedPlanTier = planTier === 'enterprise' ? 'enterprise' : 'pro'

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Obtener usuario autenticado desde cookies
    const cookieStore = request.cookies
    const supabaseAuthToken = cookieStore.get('sb-access-token')?.value || 
                              cookieStore.get('supabase-auth-token')?.value

    if (!supabaseAuthToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Obtener user_id desde Supabase usando el token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      supabaseAuthToken
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const demoConfig = await resolveDemoModeConfig(supabaseAdmin, user.id)
    const stripePolicy = getDemoIntegrationPolicy(demoConfig, 'stripe')

    if (stripePolicy.shouldSimulate) {
      const simulatedSessionId = `demo_cs_checkout_${Date.now()}`
      const effectivePlanTier =
        (planTier === 'pro' || planTier === 'enterprise' ? planTier : null) ||
        (priceId === STRIPE_PRICES.ENTERPRISE_MONTHLY ||
        priceId === STRIPE_PRICES.ENTERPRISE_ANNUAL ||
        priceId === STRIPE_PRICES.LIFETIME
          ? 'enterprise'
          : 'pro')

      const { error: demoSubscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan_tier: effectivePlanTier,
            status: 'active',
            stripe_price_id: priceId,
            stripe_customer_id: `demo_cus_${Date.now()}`,
            stripe_subscription_id: `demo_sub_${Date.now()}`,
          },
          { onConflict: 'user_id' }
        )

      if (demoSubscriptionError) {
        console.warn('[DemoMode] No se pudo actualizar suscripción simulada:', demoSubscriptionError)
      }

      await logDemoAuditEvent(supabaseAdmin, user.id, {
        eventType: 'stripe_checkout_session_simulated',
        integration: 'stripe',
        resourceType: 'checkout_session',
        resourceId: simulatedSessionId,
        status: 'simulated',
        payload: {
          price_id: priceId,
          plan_tier: effectivePlanTier,
        },
      })

      const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      return NextResponse.json({
        sessionId: simulatedSessionId,
        url: `${appBaseUrl}/dashboard?checkout=success&demo=1&session_id=${simulatedSessionId}`,
        demo_mode: true,
      })
    }

    // Verificar si el usuario ya tiene un customer_id en Stripe
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    // Si no tiene customer_id, crear uno nuevo
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Guardar customer_id en la base de datos
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          plan_tier: normalizedPlanTier,
          status: 'incomplete',
          max_doctors: 2,
          max_locations: 1,
          features: [],
        })
    }

    // Determinar si es suscripción o pago único (Lifetime)
    const isLifetime = priceId === STRIPE_PRICES.LIFETIME
    const mode = isLifetime ? 'payment' : 'subscription'

    // Crear Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'], // Acepta todas las tarjetas (crédito y débito)
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Seguridad 3D cuando sea necesario
          installments: {
            enabled: true, // 🇲🇽 Habilita meses sin intereses para México
          },
        },
      },
      billing_address_collection: 'auto', // Recopilar dirección de facturación cuando sea necesario
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan_tier: normalizedPlanTier,
      },
      subscription_data: !isLifetime ? {
        metadata: {
          user_id: user.id,
          plan_tier: normalizedPlanTier,
        },
      } : undefined,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
