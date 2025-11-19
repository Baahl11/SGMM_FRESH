import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

/**
 * POST /api/stripe/connect/onboard
 * 
 * Crea o recupera una cuenta de Stripe Connect para el médico
 * y genera el link de onboarding
 * 
 * Response:
 * {
 *   account_id: string
 *   onboarding_url: string
 *   onboarding_completed: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar si ya tiene una Connected Account
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let stripeAccountId: string

    if (existingAccount?.stripe_account_id) {
      // Ya tiene cuenta, verificar estado
      stripeAccountId = existingAccount.stripe_account_id
      console.log('📌 Existing Stripe Connect account:', stripeAccountId)

      // Actualizar info de la cuenta desde Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId)
      
      await supabase
        .from('connected_accounts')
        .update({
          onboarding_completed: account.details_submitted || false,
          charges_enabled: account.charges_enabled || false,
          payouts_enabled: account.payouts_enabled || false,
          details_submitted: account.details_submitted || false,
          requirements: account.requirements || {},
        })
        .eq('stripe_account_id', stripeAccountId)

    } else {
      // Crear nueva Connected Account
      console.log('🆕 Creating new Stripe Connect account...')

      // Obtener email y perfil del usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, name')
        .eq('user_id', user.id)
        .single()

      const account = await stripe.accounts.create({
        type: 'express', // Express account (más fácil onboarding)
        country: 'MX',
        email: profile?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual', // Por defecto individual, puede cambiar después
        metadata: {
          user_id: user.id,
          platform: 'agendamedpro',
        },
      })

      stripeAccountId = account.id
      console.log('✅ Stripe Connect account created:', stripeAccountId)

      // Guardar en BD
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          stripe_account_id: stripeAccountId,
          account_type: 'express',
          email: profile?.email || user.email,
          country: 'MX',
          business_type: 'individual',
          onboarding_completed: false,
          charges_enabled: false,
          payouts_enabled: false,
        })

      console.log('💾 Connected account saved to database')
    }

    // Generar Account Link para onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings/payments?success=true`,
      type: 'account_onboarding',
    })

    console.log('🔗 Onboarding link generated:', accountLink.url)

    return NextResponse.json({
      account_id: stripeAccountId,
      onboarding_url: accountLink.url,
      onboarding_completed: existingAccount?.onboarding_completed || false,
    })

  } catch (error: any) {
    console.error('❌ Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Connect account' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/connect/onboard
 * 
 * Obtiene el estado actual de la cuenta Connect del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: account } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({
        has_account: false,
        onboarding_completed: false,
        charges_enabled: false,
        payouts_enabled: false,
      })
    }

    // Actualizar info desde Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id)

    await supabase
      .from('connected_accounts')
      .update({
        onboarding_completed: stripeAccount.details_submitted || false,
        charges_enabled: stripeAccount.charges_enabled || false,
        payouts_enabled: stripeAccount.payouts_enabled || false,
        details_submitted: stripeAccount.details_submitted || false,
        requirements: stripeAccount.requirements || {},
      })
      .eq('stripe_account_id', account.stripe_account_id)

    return NextResponse.json({
      has_account: true,
      account_id: account.stripe_account_id,
      onboarding_completed: stripeAccount.details_submitted || false,
      charges_enabled: stripeAccount.charges_enabled || false,
      payouts_enabled: stripeAccount.payouts_enabled || false,
      requirements: stripeAccount.requirements,
    })

  } catch (error: any) {
    console.error('❌ Error fetching Connect account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Connect account' },
      { status: 500 }
    )
  }
}
