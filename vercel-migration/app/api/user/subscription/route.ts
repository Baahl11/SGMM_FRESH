import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_FEATURES } from '@/lib/stripe/config'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener suscripción del usuario
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      // Si no hay suscripción, retornar plan básico por defecto
      return NextResponse.json({
        plan_tier: 'basico',
        max_locations: PLAN_FEATURES.basico.max_locations,
        max_doctors: PLAN_FEATURES.basico.max_doctors,
        status: 'active'
      })
    }

    // Retornar datos de suscripción con límites del plan
    const planTier = subscription.plan_tier || 'basico'
    const planFeatures = PLAN_FEATURES[planTier as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.basico

    return NextResponse.json({
      id: subscription.id,
      plan_tier: planTier,
      max_locations: subscription.max_locations || planFeatures.max_locations,
      max_doctors: subscription.max_doctors || planFeatures.max_doctors,
      status: subscription.status,
      trial_ends_at: subscription.trial_ends_at,
      created_at: subscription.created_at
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Error al obtener suscripción' },
      { status: 500 }
    )
  }
}
