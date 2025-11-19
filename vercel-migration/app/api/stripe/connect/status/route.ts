import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

/**
 * GET /api/stripe/connect/status
 * Obtiene el estado de la cuenta Connect del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar cuenta conectada
    const { data: connectedAccount, error: dbError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError || !connectedAccount) {
      return NextResponse.json({
        hasAccount: false,
        account: null,
      })
    }

    // Obtener detalles actualizados de Stripe
    const account = await stripe.accounts.retrieve(connectedAccount.stripe_account_id)

    // Actualizar base de datos con info más reciente
    await supabase
      .from('connected_accounts')
      .update({
        onboarding_completed: account.details_submitted || false,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted || false,
        requirements_pending: account.requirements?.currently_due || [],
      })
      .eq('id', connectedAccount.id)

    return NextResponse.json({
      hasAccount: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
      },
    })
  } catch (error: any) {
    console.error('Error fetching Connect status:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener estado' },
      { status: 500 }
    )
  }
}
