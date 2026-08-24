import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

type SupportedPlan = 'pro' | 'enterprise'
type BillingCycle = 'monthly' | 'annual'

const isValidEmail = (value: string) => /.+@.+\..+/.test(value)

const toSafeInternalPath = (value: string | null | undefined) => {
  if (!value) return '/select-trial-plan'
  if (value.startsWith('http://') || value.startsWith('https://')) return '/select-trial-plan'
  return value.startsWith('/') ? value : `/${value}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const plan = body.plan === 'pro' || body.plan === 'enterprise' ? body.plan : null
    const billing = body.billing === 'annual' || body.billing === 'monthly' ? body.billing : null
    const next = typeof body.next === 'string' ? toSafeInternalPath(body.next) : '/select-trial-plan'

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido para reenviar verificacion' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const callbackUrl = new URL('/auth/callback', baseUrl)
    callbackUrl.searchParams.set('next', next)

    if (plan) {
      callbackUrl.searchParams.set('plan', plan as SupportedPlan)
    }

    if (billing) {
      callbackUrl.searchParams.set('billing', billing as BillingCycle)
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'No fue posible reenviar verificacion' },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, message: 'Correo de verificacion reenviado' })
  } catch (error) {
    console.error('[Resend Verification] Unexpected error', error)
    return NextResponse.json(
      { error: 'Error interno al reenviar verificacion' },
      { status: 500 }
    )
  }
}
