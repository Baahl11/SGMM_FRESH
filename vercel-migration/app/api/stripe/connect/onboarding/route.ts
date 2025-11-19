import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

/**
 * POST /api/stripe/connect/onboarding
 * Crea una cuenta de Stripe Connect y retorna el link de onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si ya tiene cuenta conectada
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let accountId = existingAccount?.stripe_account_id

    // Si no existe, crear nueva cuenta Connect
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MX',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id,
          platform: 'agendamedpro',
        },
      })

      accountId = account.id

      // Guardar en base de datos
      await supabase.from('connected_accounts').insert({
        user_id: user.id,
        stripe_account_id: accountId,
        account_type: 'express',
        onboarding_completed: false,
        charges_enabled: false,
        payouts_enabled: false,
      })
    }

    // Crear link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error('Error creating Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear cuenta Connect' },
      { status: 500 }
    )
  }
}
