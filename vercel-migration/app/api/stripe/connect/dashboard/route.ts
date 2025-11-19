import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

/**
 * POST /api/stripe/connect/dashboard
 * 
 * Genera un link al Stripe Express Dashboard del médico
 * donde puede ver sus pagos, configurar cuenta bancaria, etc.
 * 
 * Response:
 * {
 *   dashboard_url: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar cuenta Connect del usuario
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('stripe_account_id, onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'No connected account found. Please complete onboarding first.' },
        { status: 404 }
      )
    }

    if (!account.onboarding_completed) {
      return NextResponse.json(
        { error: 'Onboarding not completed. Please finish setup first.' },
        { status: 400 }
      )
    }

    // Crear login link para Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(
      account.stripe_account_id
    )

    console.log('🔗 Dashboard link generated for:', account.stripe_account_id)

    return NextResponse.json({
      dashboard_url: loginLink.url,
    })

  } catch (error: any) {
    console.error('❌ Error creating dashboard link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create dashboard link' },
      { status: 500 }
    )
  }
}
