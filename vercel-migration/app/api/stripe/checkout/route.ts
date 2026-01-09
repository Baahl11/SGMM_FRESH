import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Obtener el price_id del body
    const body = await request.json()
    const { priceId, email, referralSource, sellerId } = body as { 
      priceId: string; 
      email?: string;
      referralSource?: string; // 'internal' | 'distributor' | custom codes
      sellerId?: string; // ID del vendedor (ej: 'vendedor-juan')
    }

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

    // Determinar equipo de ventas basado en referral source
    const salesTeam = referralSource === 'distributor' || referralSource === 'dist' 
      ? 'distributor' 
      : 'internal'
    
    // 🔥 Configuración de comisiones: TÚ te quedas con este porcentaje
    const APPLICATION_FEE_CONFIG = {
      internal: 0,      // Tu equipo: 100% para ti (sin usar Connect)
      distributor: 70,  // Distribuidora: 70% para TI, 30% para ellos
    }

    const applicationFeePercent = APPLICATION_FEE_CONFIG[salesTeam as keyof typeof APPLICATION_FEE_CONFIG] || 0

    // Solo usar Stripe Connect si es venta de distribuidora
    let stripeAccountId: string | null = null
    let sessionOptions: any = {}

    if (salesTeam === 'distributor') {
      // Obtener cuenta Connect de la distribuidora
      const { data: connectedAccount } = await supabaseAdmin
        .from('connected_accounts')
        .select('stripe_account_id, onboarding_completed, charges_enabled')
        .eq('sales_team', 'distributor')
        .eq('onboarding_completed', true)
        .eq('charges_enabled', true)
        .single()

      if (!connectedAccount?.stripe_account_id) {
        console.error('[Checkout] Distribuidora no configurada para recibir pagos')
        return NextResponse.json(
          { error: 'La distribuidora no está configurada para recibir pagos en este momento' },
          { status: 500 }
        )
      }

      stripeAccountId = connectedAccount.stripe_account_id
      sessionOptions.stripeAccount = stripeAccountId
    }

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
        const customerConfig: any = {
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
            sales_team: salesTeam,
          },
        }

        // Si es distribuidora, crear customer en su cuenta Connect
        const customer = await stripe.customers.create(
          customerConfig,
          salesTeam === 'distributor' ? sessionOptions : undefined
        )
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
      metadata: { 
        user_id: user?.id || 'guest',
        sales_team: salesTeam,
        referral_source: referralSource || 'direct',
        your_commission_percent: String(applicationFeePercent),
        distributor_percent: String(100 - applicationFeePercent),
        seller_id: sellerId || '', // ← Agregar seller_id
      },
    }

    // Si tiene customer ID, agregarlo
    if (customerId) {
      sessionConfig.customer = customerId
    } else if (email) {
      // Si no hay usuario pero sí email (Lifetime sin registro)
      sessionConfig.customer_email = email
    }

    // 🔥 Application Fee para distribuidora
    if (salesTeam === 'distributor' && applicationFeePercent > 0) {
      if (isSubscription) {
        // Para suscripciones: application_fee_percent
        sessionConfig.subscription_data = {
          application_fee_percent: applicationFeePercent, // TÚ te quedas con 70%
          trial_period_days: 30, // ← MES 1 GRATIS (30 días)
          metadata: { 
            user_id: user?.id || 'guest',
            sales_team: salesTeam,
            seller_id: sellerId || '',
          },
        }
      } else {
        // Para pagos únicos: calcular application_fee_amount
        const priceDetails = await stripe.prices.retrieve(priceId)
        const amount = priceDetails.unit_amount || 0
        const applicationFeeAmount = Math.round(amount * (applicationFeePercent / 100))
        
        sessionConfig.payment_intent_data = {
          application_fee_amount: applicationFeeAmount, // TÚ te quedas con 70%
        }
      }
    } else {
      // Equipo interno (sin Connect ni application fee)
      if (isSubscription) {
        sessionConfig.subscription_data = {
          trial_period_days: 7, // ← Trial de 7 días para equipo interno
          metadata: { 
            user_id: user?.id || 'guest',
            sales_team: salesTeam,
            seller_id: sellerId || '',
          },
        }
      }
    }

    // Crear sesión (con o sin Connect según el equipo)
    const session = await stripe.checkout.sessions.create(
      sessionConfig,
      salesTeam === 'distributor' ? sessionOptions : undefined
    )

    console.log(`💰 Checkout session created`, {
      sessionId: session.id,
      salesTeam,
      stripeAccount: stripeAccountId || 'platform',
      yourCommission: `${applicationFeePercent}%`,
      distributorCommission: `${100 - applicationFeePercent}%`,
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
