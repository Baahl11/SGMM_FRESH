import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Obtener el price_id del body
    const body = await request.json()
    const { priceId, email } = body as { priceId: string; email?: string }

    // 2. Verificar si es Lifetime (no requiere auth)
    const isLifetime = priceId === STRIPE_PRICES.LIFETIME
    
    // 3. Si NO es Lifetime, verificar autenticación
    let user = null
    if (!isLifetime) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        )
      }
      user = authUser
    }

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

    // 4. Obtener o crear customer ID
    let customerId = null
    
    if (user) {
      // Usuario autenticado - buscar customer existente
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

      customerId = existingSubscription?.stripe_customer_id

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = customer.id
      }
    }

    // 5. Crear Checkout Session
    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${request.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
      metadata: user ? { user_id: user.id } : { guest_purchase: 'true' },
    }

    // Si tiene customer ID, agregarlo
    if (customerId) {
      sessionConfig.customer = customerId
    } else if (email) {
      // Si no hay usuario pero sí email (Lifetime sin registro)
      sessionConfig.customer_email = email
    }

    // Metadata para suscripciones
    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: user ? { user_id: user.id } : { guest_purchase: 'true' },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

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
