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
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceId, planTier } = body

    if (!priceId || !planTier) {
      return NextResponse.json(
        { error: 'priceId y planTier son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya tiene una suscripción activa
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

    // Buscar o crear Stripe Customer
    let customerId: string

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single()

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id
    } else {
      // Crear nuevo customer en Stripe
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        name: userData?.name || user.email?.split('@')[0],
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Guardar customer_id en la base de datos
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Crear Checkout Session con TRIAL de 7 días
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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
          user_id: user.id,
          plan_tier: planTier,
        },
      },
      metadata: {
        user_id: user.id,
        plan_tier: planTier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/trial-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating trial session:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión de prueba' },
      { status: 500 }
    )
  }
}
