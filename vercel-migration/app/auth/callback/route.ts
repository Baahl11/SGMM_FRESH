import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

type SupportedPlan = 'pro' | 'enterprise'
type BillingCycle = 'monthly' | 'annual'

function normalizePlan(plan: string | null | undefined): SupportedPlan {
  if (plan === 'enterprise') {
    return 'enterprise'
  }
  return 'pro'
}

function normalizeBilling(billing: string | null | undefined): BillingCycle {
  if (billing === 'annual' || billing === 'yearly' || billing === 'anual') {
    return 'annual'
  }
  return 'monthly'
}

function ensureSafePath(path: string | null | undefined) {
  if (!path) {
    return '/dashboard'
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return '/dashboard'
  }

  return path.startsWith('/') ? path : `/${path}`
}

function redirectToAuthError(
  origin: string,
  options: {
    plan: SupportedPlan
    billing: BillingCycle
    reason?: string | null
    detail?: string | null
  }
) {
  const redirectUrl = new URL('/auth/auth-code-error', origin)
  redirectUrl.searchParams.set('plan', options.plan)
  redirectUrl.searchParams.set('billing', options.billing)

  if (options.reason) {
    redirectUrl.searchParams.set('reason', options.reason)
  }

  if (options.detail) {
    redirectUrl.searchParams.set('detail', options.detail.slice(0, 240))
  }

  return NextResponse.redirect(redirectUrl.toString())
}

function buildCheckoutPath(plan: SupportedPlan, billing: BillingCycle) {
  const params = new URLSearchParams({
    plan,
    billing,
  })
  return `/select-trial-plan?${params.toString()}`
}

function redirectToVerifyEmailRequired(
  origin: string,
  options: {
    email: string
    nextPath: string
    plan: SupportedPlan
    billing: BillingCycle
  }
) {
  const verifyUrl = new URL('/auth/verify-email-required', origin)
  verifyUrl.searchParams.set('email', options.email)
  verifyUrl.searchParams.set('next', ensureSafePath(options.nextPath))
  verifyUrl.searchParams.set('plan', options.plan)
  verifyUrl.searchParams.set('billing', options.billing)
  return NextResponse.redirect(verifyUrl.toString())
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const planParam = requestUrl.searchParams.get('plan')
  const billingParam = requestUrl.searchParams.get('billing')
  const oauthError = requestUrl.searchParams.get('error')
  const oauthErrorDescription = requestUrl.searchParams.get('error_description')

  const cookieStore = await cookies()
  const trialSelectionCookie = cookieStore.get('trial_selection')?.value
  let cookiePlan: string | null = null
  let cookieBilling: string | null = null

  if (trialSelectionCookie) {
    try {
      const decoded = decodeURIComponent(trialSelectionCookie)
      const parsed = JSON.parse(decoded) as { plan?: string; billing?: string }
      cookiePlan = parsed.plan ?? null
      cookieBilling = parsed.billing ?? null
    } catch (error) {
      console.warn('[Auth Callback] Unable to parse trial selection cookie', {
        errorMessage: (error as Error).message,
      })
    }
  }

  const plan = normalizePlan(planParam ?? cookiePlan)
  const billing = normalizeBilling(billingParam ?? cookieBilling)
  const planConfig = {
    planTier: plan,
    billing,
  }
  const hasCheckoutIntent = Boolean(planParam || billingParam || cookiePlan || cookieBilling)

  if (!code) {
    console.warn('[Auth Callback] Missing authorization code', {
      plan,
      billing,
      oauthError,
      oauthErrorDescription,
    })

    return redirectToAuthError(origin, {
      plan,
      billing,
      reason: oauthError ?? 'missing_authorization_code',
      detail: oauthErrorDescription,
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn('[Auth Callback] Unable to set auth cookie', { errorMessage: (error as Error).message })
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn('[Auth Callback] Unable to clear auth cookie', { errorMessage: (error as Error).message })
          }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('[Auth Callback] exchangeCodeForSession', {
    hasUser: Boolean(data?.user),
    error: error?.message,
    plan: planConfig.planTier,
    billing: planConfig.billing,
  })

  if (error || !data?.user) {
    console.error('[Auth Callback] Failed to exchange code for session', error)
    return redirectToAuthError(origin, {
      plan,
      billing,
      reason: 'exchange_code_for_session_failed',
      detail: error?.message,
    })
  }

  const user = data.user
  const userId = user.id
  const userEmail = user.email

  if (!userEmail) {
    console.error('[Auth Callback] OAuth provider did not return an email address', { userId })
    return redirectToAuthError(origin, {
      plan,
      billing,
      reason: 'oauth_email_missing',
      detail: 'OAuth provider did not return an email address',
    })
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    userEmail.split('@')[0] ||
    'Usuario'

  const nextPath = hasCheckoutIntent
    ? buildCheckoutPath(planConfig.planTier, planConfig.billing)
    : ensureSafePath(nextParam)

  if (!user.email_confirmed_at) {
    console.warn('[Auth Callback] Unverified email blocked from onboarding flow', {
      userId,
      userEmail,
      nextPath,
    })

    return redirectToVerifyEmailRequired(origin, {
      email: userEmail,
      nextPath,
      plan,
      billing,
    })
  }

  const isFirstLogin = false
  try {
    const { data: existingUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (fetchUserError && fetchUserError.code !== 'PGRST116') {
      console.error('[Auth Callback] Error fetching user profile', fetchUserError)
    }

    if (!existingUser) {
      const timestamp = new Date().toISOString()
      const { error: insertUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          name: userName,
          role: 'medico',
          created_at: timestamp,
          updated_at: timestamp,
        })

      if (insertUserError && insertUserError.code !== '23505') {
        console.error('[Auth Callback] Error inserting user profile', insertUserError)
      }
    }

    // Check if this user was invited as a team member and update status to active
    try {
      const { data: teamMember, error: teamMemberError } = await supabaseAdmin
        .from('team_members')
        .select('id, owner_user_id')
        .eq('member_email', userEmail)
        .eq('status', 'pending')
        .maybeSingle()

      if (teamMember && !teamMemberError) {
        // Update team member status to active
        const { error: updateError } = await supabaseAdmin
          .from('team_members')
          .update({
            member_user_id: userId,
            status: 'active',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', teamMember.id)

        if (updateError) {
          console.error('[Auth Callback] Error updating team member status', updateError)
        } else {
          console.log('[Auth Callback] Team member status updated to active', {
            teamMemberId: teamMember.id,
            userId,
            email: userEmail
          })
        }
      }
    } catch (teamMemberError) {
      console.error('[Auth Callback] Error checking/updating team member', teamMemberError)
    }
  } catch (profileError) {
    console.error('[Auth Callback] Unexpected error ensuring user profile', profileError)
  }

  let subscriptionExists = false

  try {
    const { data: existingSubscription, error: subscriptionFetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, trial_end, stripe_subscription_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (subscriptionFetchError && subscriptionFetchError.code !== 'PGRST116') {
      console.error('[Auth Callback] Error fetching subscription', subscriptionFetchError)
    }

    if (existingSubscription) {
      subscriptionExists = true

    }
  } catch (subscriptionLookupError) {
    console.error('[Auth Callback] Unexpected error checking subscription', subscriptionLookupError)
  }

  if (!subscriptionExists) {
    const checkoutRedirect = new URL('/select-trial-plan', origin)
    checkoutRedirect.searchParams.set('plan', planConfig.planTier)
    checkoutRedirect.searchParams.set('billing', planConfig.billing)

    const response = NextResponse.redirect(checkoutRedirect.toString())

    if (trialSelectionCookie) {
      response.cookies.set({
        name: 'trial_selection',
        value: '',
        maxAge: 0,
        path: '/',
      })
    }

    return response
  }

  const redirectPath = nextPath

  console.log('[Auth Callback] Redirecting user', {
    userId,
    redirectPath,
    planSource: planParam ? 'query' : cookiePlan ? 'cookie' : 'default',
  })

  const response = NextResponse.redirect(`${origin}${redirectPath}`)

  if (trialSelectionCookie) {
    response.cookies.set({
      name: 'trial_selection',
      value: '',
      maxAge: 0,
      path: '/',
    })
  }

  return response
}
