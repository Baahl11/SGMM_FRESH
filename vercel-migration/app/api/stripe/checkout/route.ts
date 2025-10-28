import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener el usuario autenticado
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 2. Obtener el price_id del body
    const body = await request.json()
    const { priceId } = body as { priceId: string }

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId es requerido' },
        { status: 400 }
      )
    }

    // Validar que el priceId sea válido
    const validPriceIds = Object.values(STRIPE_PRICES)
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'priceId inválido' },
        { status: 400 }
      )
    }

    const subscriptionPriceIds = new Set([
      STRIPE_PRICES.BASICO_MONTHLY,
      STRIPE_PRICES.BASICO_ANNUAL,
      STRIPE_PRICES.PRO_MONTHLY,
      STRIPE_PRICES.PRO_ANNUAL,
      STRIPE_PRICES.ENTERPRISE_MONTHLY,
      STRIPE_PRICES.ENTERPRISE_ANNUAL,
    ])

    const isSubscription = subscriptionPriceIds.has(priceId)

    // 3. Verificar si el usuario ya tiene un Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    // 4. Si no tiene customer ID, crear uno nuevo
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // 5. Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${request.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                user_id: user.id,
              },
            },
          }
        : {}),
    })

    // 6. Retornar la URL del checkout
    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
