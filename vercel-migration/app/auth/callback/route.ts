import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import emailService from '@/lib/email-service'
import { PLAN_FEATURES } from '@/lib/stripe/config'

type SupportedPlan = 'basico' | 'pro'
type BillingCycle = 'monthly' | 'annual'

const FALLBACK_PRICE_IDS = {
  basico: {
    monthly: 'price_basico_monthly_placeholder',
    annual: 'price_basico_annual_placeholder',
  },
  pro: {
    monthly: 'price_pro_monthly_placeholder',
    annual: 'price_pro_annual_placeholder',
  },
} as const

function normalizePlan(plan: string | null | undefined): SupportedPlan {
  if (plan === 'pro') {
    return 'pro'
  }
  return 'basico'
}

function normalizeBilling(billing: string | null | undefined): BillingCycle {
  if (billing === 'annual' || billing === 'yearly' || billing === 'anual') {
    return 'annual'
  }
  return 'monthly'
}

function resolvePlanConfig(plan: SupportedPlan, billing: BillingCycle) {
  const stripePriceId =
    plan === 'pro'
      ? billing === 'annual'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
      : billing === 'annual'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY

  const featuresConfig = PLAN_FEATURES[plan]

  return {
    planTier: plan,
    billing,
    stripePriceId: stripePriceId ?? FALLBACK_PRICE_IDS[plan][billing],
    maxDoctors: featuresConfig.max_doctors,
    maxLocations: featuresConfig.max_locations,
    features: [...featuresConfig.features],
  }
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const planParam = requestUrl.searchParams.get('plan')
  const billingParam = requestUrl.searchParams.get('billing')

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
  const planConfig = resolvePlanConfig(plan, billing)

  if (!code) {
    console.warn('[Auth Callback] Missing authorization code', { plan, billing })
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
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
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const user = data.user
  const userId = user.id
  const userEmail = user.email

  if (!userEmail) {
    console.error('[Auth Callback] OAuth provider did not return an email address', { userId })
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    userEmail.split('@')[0] ||
    'Usuario'

  let isFirstLogin = false

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
      } else {
        isFirstLogin = true
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
  let subscriptionTrialEnd: string | null = null

  try {
    const { data: existingSubscription, error: subscriptionFetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, trial_end')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (subscriptionFetchError && subscriptionFetchError.code !== 'PGRST116') {
      console.error('[Auth Callback] Error fetching subscription', subscriptionFetchError)
    }

    if (existingSubscription) {
      subscriptionExists = true
      subscriptionTrialEnd = existingSubscription.trial_end
    }
  } catch (subscriptionLookupError) {
    console.error('[Auth Callback] Unexpected error checking subscription', subscriptionLookupError)
  }

  if (!subscriptionExists) {
    const trialStart = new Date()
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialEnd.getDate() + 7)

    try {
      const { error: createSubscriptionError, data: createdSubscription } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_price_id: planConfig.stripePriceId,
          plan_tier: planConfig.planTier,
          max_doctors: planConfig.maxDoctors,
          max_locations: planConfig.maxLocations,
          features: planConfig.features,
          status: 'trialing',
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
          current_period_start: trialStart.toISOString(),
          current_period_end: trialEnd.toISOString(),
        })
        .select('id, trial_end')
        .single()

      if (createSubscriptionError && createSubscriptionError.code !== '23505') {
        console.error('[Auth Callback] Error creating subscription', createSubscriptionError)
      } else {
        subscriptionExists = true
        subscriptionTrialEnd = createdSubscription?.trial_end ?? trialEnd.toISOString()
        isFirstLogin = true

        const welcomeTrialEnd = subscriptionTrialEnd ?? trialEnd.toISOString()

        void emailService
          .sendTrialWelcomeEmail(
            userEmail,
            userName,
            planConfig.planTier === 'pro' ? 'Profesional' : 'Básico',
            welcomeTrialEnd
          )
          .catch(err => {
            console.error('[Auth Callback] Error sending welcome email', err)
          })
      }
    } catch (subscriptionCreateError) {
      console.error('[Auth Callback] Unexpected error ensuring subscription', subscriptionCreateError)
    }
  }

  if (!subscriptionExists) {
    console.warn('[Auth Callback] User has no subscription after callback', { userId })
    return NextResponse.redirect(`${origin}/select-trial-plan`)
  }

  const redirectPath = isFirstLogin ? '/welcome' : ensureSafePath(nextParam)

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
