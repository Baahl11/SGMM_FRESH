import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ❌ DEPRECATED: Este endpoint crea suscripciones huérfanas (sin Stripe)
  // ✅ USAR: /api/create-trial-session en su lugar
  return NextResponse.json(
    { 
      error: 'Este endpoint está desactivado. Usa /api/create-trial-session para crear trials con Stripe.',
      deprecated: true,
      alternative: '/api/create-trial-session'
    },
    { status: 410 } // 410 Gone
  )
  
  /* CÓDIGO ORIGINAL DESACTIVADO PARA PREVENIR SUSCRIPCIONES HUÉRFANAS
  try {
    const { planTier, billingCycle } = await request.json()

    // Validate input
    if (!planTier || !billingCycle) {
      return NextResponse.json(
        { error: 'Plan tier and billing cycle are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    const subscriptionData = {
      user_id: user.id,
      status: 'trialing',
      plan: planTier,
      billing_cycle: billingCycle,
      trial_end_date: trialEndDate.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndDate.toISOString(),
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        return NextResponse.json(
          { error: 'Error al actualizar subscripción' },
          { status: 500 }
        )
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)

      if (insertError) {
        console.error('Error creating subscription:', insertError)
        return NextResponse.json(
          { error: 'Error al crear subscripción' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trial activado exitosamente',
      trial_end_date: trialEndDate.toISOString(),
    })
  } catch (error: any) {
    console.error('Error activating trial:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
  */
}
