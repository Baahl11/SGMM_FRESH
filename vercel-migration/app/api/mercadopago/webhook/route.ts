import { NextRequest, NextResponse } from 'next/server'
import { paymentClient, getPlanTierFromMPPlanId, PLAN_LIMITS } from '@/lib/mercadopago/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, action } = body

    console.log('[Mercado Pago Webhook] Received:', { type, action, data })

    // Mercado Pago envía notificaciones de tipo "payment"
    if (type === 'payment') {
      const paymentId = data.id

      // Obtener detalles completos del pago
      const payment = await paymentClient.get({ id: paymentId })

      console.log('[MP Webhook] Payment details:', {
        id: payment.id,
        status: payment.status,
        metadata: payment.metadata,
      })

      // Extraer información
      const userId = payment.metadata?.user_id
      const planTier = payment.metadata?.plan_tier || 'basico'
      const billingCycle = payment.metadata?.billing_cycle || 'monthly'

      if (!userId) {
        console.error('[MP Webhook] No user_id in payment metadata')
        return NextResponse.json({ received: true })
      }

      // Usar service_role client para bypass RLS
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS]

      // Determinar status
      let subscriptionStatus = 'active'
      if (payment.status === 'pending') subscriptionStatus = 'pending'
      if (payment.status === 'cancelled' || payment.status === 'rejected') subscriptionStatus = 'canceled'

      // Actualizar o crear suscripción
      const subscriptionData: any = {
        user_id: userId,
        plan_tier: planTier === 'lifetime' ? 'enterprise' : planTier,
        status: subscriptionStatus,
        payment_provider: 'mercadopago',
        mercadopago_payment_id: payment.id?.toString(),
        mercadopago_payer_id: payment.payer?.id?.toString(),
        max_doctors: limits.max_doctors,
        max_locations: limits.max_locations,
        updated_at: new Date().toISOString(),
      }

      // Si es pago aprobado
      if (payment.status === 'approved') {
        subscriptionData.status = 'active'
        subscriptionData.current_period_start = new Date().toISOString()

        // Calcular período
        if (planTier === 'lifetime') {
          subscriptionData.current_period_end = new Date('2125-01-01').toISOString()
        } else if (billingCycle === 'annual') {
          const endDate = new Date()
          endDate.setFullYear(endDate.getFullYear() + 1)
          subscriptionData.current_period_end = endDate.toISOString()
        } else {
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 1)
          subscriptionData.current_period_end = endDate.toISOString()
        }
      }

      // Upsert suscripción
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        })

      if (subError) {
        console.error('[MP Webhook] Error upserting subscription:', subError)
      } else {
        console.log(`[MP Webhook] ✅ Subscription updated for user ${userId}: ${planTier}`)
      }

      // Actualizar tabla users (legacy)
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: planTier,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (userError) {
        console.error('[MP Webhook] Error updating user:', userError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MP Webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
