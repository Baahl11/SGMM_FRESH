import { NextRequest, NextResponse } from 'next/server'
import { preferenceClient, PLAN_PRICES } from '@/lib/mercadopago/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener datos del request
    const body = await request.json()
    const { planTier, billingCycle } = body as {
      planTier: 'basico' | 'pro' | 'enterprise' | 'lifetime'
      billingCycle: 'monthly' | 'annual' | 'once'
    }

    if (!planTier) {
      return NextResponse.json({ error: 'planTier es requerido' }, { status: 400 })
    }

    // 3. Determinar el precio
    let amount: number
    let title: string
    let frequency = 1
    let frequency_type: 'months' | 'days' = 'months'
    let auto_recurring: any = undefined

    if (planTier === 'lifetime') {
      amount = PLAN_PRICES.lifetime
      title = 'AgendaMedPro - Licencia de por Vida'
    } else {
      const cycle = billingCycle === 'annual' ? 'annual' : 'monthly'
      amount = PLAN_PRICES[planTier][cycle]
      title = `AgendaMedPro - Plan ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} (${
        cycle === 'monthly' ? 'Mensual' : 'Anual'
      })`

      // Configurar suscripción recurrente
      auto_recurring = {
        frequency,
        frequency_type: cycle === 'monthly' ? 'months' : 'months',
        transaction_amount: amount,
        currency_id: 'MXN',
        free_trial: {
          frequency: 7,
          frequency_type: 'days',
        },
      }

      if (cycle === 'annual') {
        frequency = 12
        auto_recurring.frequency = 12
      }
    }

    // 4. Crear preferencia de pago en Mercado Pago
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: `plan_${planTier}_${billingCycle}`,
            title,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: amount,
          },
        ],
        payer: {
          email: user.email || undefined,
        },
        back_urls: {
          success: `${request.headers.get('origin')}/dashboard?mp_status=approved`,
          failure: `${request.headers.get('origin')}/pricing?mp_status=failure`,
          pending: `${request.headers.get('origin')}/dashboard?mp_status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${request.headers.get('origin')}/api/mercadopago/webhook`,
        metadata: {
          user_id: user.id,
          plan_tier: planTier,
          billing_cycle: billingCycle,
        },
        ...(auto_recurring ? { auto_recurring } : {}),
      },
    })

    // 5. Retornar la URL de checkout
    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      id: preference.id,
    })
  } catch (error) {
    console.error('Error creating Mercado Pago checkout:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
