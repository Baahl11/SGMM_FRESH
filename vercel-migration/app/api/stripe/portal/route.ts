import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so users can manage their subscription
 * (upgrade, downgrade, cancel, update payment method).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get customer ID from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No se encontró una suscripción activa' },
        { status: 404 }
      )
    }

    const origin = request.headers.get('origin') ?? 'https://agendamedpro.com'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/dashboard/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[Stripe Portal] Error creating portal session:', error)
    return NextResponse.json(
      { error: 'No se pudo abrir el portal de facturación' },
      { status: 500 }
    )
  }
}
