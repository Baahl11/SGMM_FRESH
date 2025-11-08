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

function normalizePlan(plan: string | null): SupportedPlan {
  if (plan === 'pro') {
    return 'pro'
  }
  return 'basico'
}

function normalizeBilling(billing: string | null): BillingCycle {
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

  const plan = normalizePlan(planParam)
  const billing = normalizeBilling(billingParam)
  const planConfig = resolvePlanConfig(plan, billing)

  if (!code) {
    console.warn('[Auth Callback] Missing authorization code', { plan, billing })
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

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

  console.log('[Auth Callback] Redirecting user', { userId, redirectPath })
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
