import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/create-trial-session
 * 
 * Creates a Stripe Checkout Session with 7-day trial
 * User MUST add card to start trial
 * After 7 days, automatically charges the selected plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación (OPCIONAL para usuarios anónimos)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { priceId, planTier } = body

    if (!priceId || !planTier) {
      return NextResponse.json(
        { error: 'priceId y planTier son requeridos' },
        { status: 400 }
      )
    }

    // Si el usuario está autenticado, verificar estado de suscripción.
    // Permitimos continuar si existe un trial legacy sin stripe_subscription_id
    // para forzar captura de tarjeta y migrarlo al flujo real de Stripe.
    if (user) {
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
    }

    // Crear Checkout Session con TRIAL de 7 días
    // Para usuarios anónimos: Stripe maneja la creación de customer y el email
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
        trial_period_days: 7, // 🎯 7 días de prueba gratis
        metadata: {
          plan_tier: planTier,
          ...(user && { user_id: user.id }),
        },
      },
      metadata: {
        plan_tier: planTier,
        ...(user && { user_id: user.id }),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/trial-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/select-trial-plan?canceled=true`,
      allow_promotion_codes: true,
    }

    // Si el usuario está autenticado, usar su customer_id existente o crear uno
    if (user) {
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
    } else {
      // Usuario anónimo: Stripe pedirá email en el checkout
      // En modo subscription, Stripe crea el customer automáticamente
      // No se usa customer_creation (solo para mode: 'payment')
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating trial session:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión de prueba' },
      { status: 500 }
    )
  }
}
