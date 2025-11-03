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

    // Si el usuario está autenticado, verificar si ya tiene suscripción
    if (user) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single()

      if (existingSub) {
        return NextResponse.json(
          { error: 'Ya tienes una suscripción activa' },
          { status: 400 }
        )
      }
    }

    // Crear Checkout Session con TRIAL de 7 días
    // Para usuarios anónimos: Stripe maneja la creación de customer y el email
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
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
