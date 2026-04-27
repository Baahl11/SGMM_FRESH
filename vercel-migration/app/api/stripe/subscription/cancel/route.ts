import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/stripe/subscription/cancel
 * Cancels current subscription and unlinks Stripe payment references in DB.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptionError) {
      console.error('[Stripe Cancel] Error fetching subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'No se pudo obtener la suscripcion actual' },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No se encontro una suscripcion para esta cuenta' },
        { status: 404 }
      )
    }

    const stripeSubscriptionId =
      typeof subscription.stripe_subscription_id === 'string'
        ? subscription.stripe_subscription_id.trim()
        : ''

    const stripeCustomerId =
      typeof subscription.stripe_customer_id === 'string'
        ? subscription.stripe_customer_id.trim()
        : ''

    let canceledAtIso = new Date().toISOString()

    if (stripeSubscriptionId.startsWith('sub_')) {
      try {
        const canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId)
        if (canceledSubscription.canceled_at) {
          canceledAtIso = new Date(canceledSubscription.canceled_at * 1000).toISOString()
        }
      } catch (cancelError: any) {
        const resourceMissing = cancelError?.code === 'resource_missing'
        if (!resourceMissing) {
          console.error('[Stripe Cancel] Error canceling subscription:', cancelError)
          return NextResponse.json(
            { error: 'No se pudo cancelar la suscripcion en Stripe' },
            { status: 502 }
          )
        }
      }
    }

    let detachedPaymentMethods = 0

    if (stripeCustomerId.startsWith('cus_')) {
      try {
        let startingAfter: string | undefined

        while (true) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          })

          if (paymentMethods.data.length === 0) {
            break
          }

          for (const paymentMethod of paymentMethods.data) {
            await stripe.paymentMethods.detach(paymentMethod.id)
            detachedPaymentMethods += 1
          }

          if (!paymentMethods.has_more) {
            break
          }

          startingAfter = paymentMethods.data[paymentMethods.data.length - 1]?.id
          if (!startingAfter) {
            break
          }
        }
      } catch (detachError) {
        console.warn('[Stripe Cancel] Unable to detach payment methods:', detachError)
      }
    }

    const nowIso = new Date().toISOString()

    const { error: dbSubscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: canceledAtIso,
        updated_at: nowIso,
      })
      .eq('user_id', user.id)

    if (dbSubscriptionError) {
      console.error('[Stripe Cancel] Error updating subscriptions table:', dbSubscriptionError)
      return NextResponse.json(
        { error: 'La suscripcion se cancelo, pero no pudimos sincronizar la base de datos' },
        { status: 500 }
      )
    }

    const { error: dbUserError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'cancelled',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_end_date: canceledAtIso,
        updated_at: nowIso,
      })
      .eq('id', user.id)

    if (dbUserError) {
      console.error('[Stripe Cancel] Error updating users table:', dbUserError)
      return NextResponse.json(
        { error: 'La suscripcion se cancelo, pero no pudimos sincronizar el perfil de usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      canceledAt: canceledAtIso,
      detachedPaymentMethods,
    })
  } catch (error) {
    console.error('[Stripe Cancel] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado al cancelar la suscripcion' },
      { status: 500 }
    )
  }
}
