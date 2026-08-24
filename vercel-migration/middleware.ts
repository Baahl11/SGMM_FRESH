import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isStripeBackedSubscription, isTrialExpired } from '@/lib/subscription/access'

// Auditoría fable 2026-06-11 (D3): emails/UUID de owner hardcodeados retirados.
// El bypass de owner se controla por entorno: ADMIN_OWNER_EMAILS y ADMIN_OWNER_IDS
// (listas separadas por coma). Sin variables configuradas NO hay bypass.
function parseList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
}
const OWNER_FALLBACK_EMAILS = parseList(process.env.ADMIN_OWNER_EMAILS ?? process.env.OWNER_EMAILS)
const OWNER_FALLBACK_IDS = parseList(process.env.ADMIN_OWNER_IDS)
let usersLookupDisabledDueToRls = false

function parseOwnerEmails(raw: string | undefined) {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function isFallbackOwner(userId: string, email?: string) {
  const normalizedEmail = email?.toLowerCase()
  return OWNER_FALLBACK_IDS.includes(userId.toLowerCase()) ||
    (normalizedEmail ? OWNER_FALLBACK_EMAILS.includes(normalizedEmail) : false)
}

function isUsersPolicyRecursionError(error: { code?: string; message?: string } | null) {
  if (!error?.message) return false
  const message = error.message.toLowerCase()
  return error.code === '42P17' && message.includes('infinite recursion') && message.includes('users')
}

function subscriptionRequiredResponse(
  request: NextRequest,
  reason: 'no_subscription' | 'trial_expired',
  message: string,
  plan = 'pro'
) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: message, code: reason, paymentRequired: true },
      { status: 402 }
    )
  }

  const url = new URL('/select-trial-plan', request.url)
  url.searchParams.set('reason', reason)
  url.searchParams.set('message', message)
  url.searchParams.set('plan', plan)
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANTE: Refreshar la sesión si está cerca de expirar
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')
  const isSubscriptionExemptApi = isApiRoute && (
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.includes('/public') ||
    pathname.includes('/webhook') ||
    pathname === '/api/analytics/funnel' ||
    pathname === '/api/marketing/attribution' ||
    pathname === '/api/trials/activate' ||
    pathname === '/api/create-trial-session' ||
    pathname === '/api/create-subscription-session' ||
    pathname === '/api/stripe/sync-session' ||
    pathname === '/api/check-payment-method'
  )

  // ========================================
  // RUTAS PÚBLICAS: No requieren autenticación
  // ========================================
  const publicRoutes = [
    '/book/',           // Páginas públicas de booking por clinic slug
    '/api/public/',     // APIs públicas (availability, booking)
    '/auth/',           // Login/signup pages
    '/team/accept',     // Aceptar invitaciones de equipo (puede requerir login después)
  ]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  const onboardingRoutes = ['/select-trial-plan', '/trial-success', '/subscription-success']
  const isOnboardingRoute = onboardingRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta pública, permitir acceso sin auth
  if (isPublicRoute) {
    return response
  }

  // Rutas protegidas - requieren login
  const protectedRoutes = [
    '/dashboard',
    '/agenda',
    '/patients',      // Inglés (ruta actual)
    '/pacientes',     // Español (por si acaso)
    '/treatments',
    '/tratamientos',
    '/inventory',
    '/inventario',
    '/billing',
    '/facturacion',
    '/reports',
    '/reportes',
    '/settings',
    '/configuracion',
    '/records'
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const requiresSubscriptionAccess = isProtectedRoute ||
    (isApiRoute && Boolean(user) && !isSubscriptionExemptApi)

  // Si está intentando acceder a ruta protegida sin sesión -> Login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block unverified users from PROTECTED routes only.
  // Onboarding routes (/select-trial-plan, /trial-success) are intentionally
  // allowed for unverified users so they can start the Stripe trial immediately
  // and verify their email at their own pace. This prevents the infinite
  // redirect loop: dashboard → no-sub → select-trial-plan → email-not-verified → loop.
  if (isProtectedRoute && user && !user.email_confirmed_at) {
    const verifyUrl = new URL('/auth/verify-email-required', request.url)
    if (user.email) {
      verifyUrl.searchParams.set('email', user.email)
    }

    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
    verifyUrl.searchParams.set('next', nextPath)

    const plan = request.nextUrl.searchParams.get('plan')
    const billing = request.nextUrl.searchParams.get('billing')
    if (plan === 'pro' || plan === 'enterprise') {
      verifyUrl.searchParams.set('plan', plan)
    }
    if (billing === 'monthly' || billing === 'annual') {
      verifyUrl.searchParams.set('billing', billing)
    }

    return NextResponse.redirect(verifyUrl)
  }

  // ========================================
  // PAYWALL: Verificación de suscripción
  // ========================================
  if (requiresSubscriptionAccess && user) {
    try {
      const ownerEmails = parseOwnerEmails(
        process.env.ADMIN_OWNER_EMAILS ?? process.env.OWNER_EMAILS
      )
      const isOwnerEmail = user.email
        ? ownerEmails.includes(user.email.toLowerCase())
        : false
      const isOwnerFallback = isFallbackOwner(user.id, user.email)

      // -------------------------------------------------
      // 1) Detectar si el usuario es admin/owner (bypass total)
      // -------------------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      let appUser: { id: string; role?: string | null; email?: string | null } | null = null
      let appUserError: any = null

      if (!usersLookupDisabledDueToRls) {
        const idLookup = await supabase
          .from('users')
          .select('id, role, email')
          .eq('id', user.id)
          .maybeSingle()

        appUser = idLookup.data ?? null
        appUserError = idLookup.error

        if (isUsersPolicyRecursionError(appUserError)) {
          usersLookupDisabledDueToRls = true
        }
      }

      let appUserByEmail: { id: string; role?: string | null; email?: string | null } | null = null
      let appUserByEmailError: any = null

      if (!usersLookupDisabledDueToRls && !appUser?.role && user.email) {
        const emailLookup = await supabase
          .from('users')
          .select('id, role, email')
          .ilike('email', user.email)
          .limit(1)

        appUserByEmail = emailLookup.data?.[0] ?? null
        appUserByEmailError = emailLookup.error

        if (isUsersPolicyRecursionError(appUserByEmailError)) {
          usersLookupDisabledDueToRls = true
        }
      }

      if (profileError) {
        console.error('⚠️ middleware: error obteniendo perfil', profileError)
      }

      if (appUserError && !isUsersPolicyRecursionError(appUserError)) {
        console.error('⚠️ middleware: error obteniendo usuario app', appUserError)
      }

      if (appUserByEmailError && !isUsersPolicyRecursionError(appUserByEmailError)) {
        console.error('⚠️ middleware: error obteniendo usuario app por email', appUserByEmailError)
      }

      const resolvedUserId = appUser?.id ?? appUserByEmail?.id ?? user.id
      const resolvedRole = appUser?.role ?? appUserByEmail?.role

      const isAdmin =
        profile?.role === 'admin' ||
        resolvedRole === 'admin' ||
        isOwnerEmail ||
        isOwnerFallback

      if (isAdmin) {
        response.headers.set('x-subscription-tier', 'admin')
        response.headers.set('x-subscription-status', 'active')
        return response
      }

      // -------------------------------------------------
      // 1.5) Demo mode: bypass paywall for active demo account
      // -------------------------------------------------
      const demoUserIds = Array.from(new Set([user.id, resolvedUserId]))
      const { data: demoConfigs, error: demoConfigError } = await supabase
        .from('demo_mode_config')
        .select('user_id, is_demo_account, demo_expires_at')
        .in('user_id', demoUserIds)
        .eq('is_demo_account', true)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (demoConfigError) {
        console.error('⚠️ middleware: error obteniendo demo mode', demoConfigError)
      }

      const demoConfig = demoConfigs?.[0] ?? null
      const isDemoActive = Boolean(
        demoConfig?.is_demo_account &&
        (!demoConfig.demo_expires_at || new Date(demoConfig.demo_expires_at) > new Date())
      )

      if (isDemoActive) {
        response.headers.set('x-demo-mode', 'true')
        response.headers.set('x-subscription-tier', 'demo')
        response.headers.set('x-subscription-status', 'active')
        return response
      }

      // -------------------------------------------------
      // 2) Verificar suscripción activa/trialing
      // Evitar maybeSingle para no romper por duplicados históricos.
      // -------------------------------------------------
      const subscriptionUserIds = Array.from(new Set([user.id, resolvedUserId]))

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_tier, status, max_doctors, max_locations, trial_end, current_period_end, stripe_subscription_id, stripe_customer_id, user_id')
        .in('user_id', subscriptionUserIds)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)

      const subscription = subscriptions?.[0] ?? null

      if (subscriptionError) {
        console.error('⚠️ middleware: error obteniendo suscripción', subscriptionError)
      }

      if (!subscription) {
        return subscriptionRequiredResponse(
          request,
          'no_subscription',
          'Selecciona Pro o Enterprise para iniciar tus 14 dias gratis.'
        )
      }

      // -------------------------------------------------
      // 2.5) NUEVO: Verificar si el trial sin tarjeta ha expirado
      // -------------------------------------------------
      if (isTrialExpired(subscription)) {
        if (!isStripeBackedSubscription(subscription)) {
          return subscriptionRequiredResponse(
            request,
            'trial_expired',
            'Tu periodo de prueba termino. Elige un plan y agrega tu tarjeta para recuperar el acceso.',
            subscription.plan_tier || 'pro'
          )
        }

        // Preserve the existing Stripe safety check while the webhook moves
        // a paid trial from trialing to active.
        if (subscription.stripe_customer_id) {
          try {
            const paymentResponse = await fetch(`${request.nextUrl.origin}/api/check-payment-method`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
            })
            const { hasPaymentMethod } = await paymentResponse.json()
            if (!hasPaymentMethod) {
              return subscriptionRequiredResponse(
                request,
                'trial_expired',
                'Tu periodo de prueba termino. Agrega un metodo de pago para continuar.',
                subscription.plan_tier || 'pro'
              )
            }
          } catch (error) {
            console.warn('⚠️ Error verificando metodo de pago:', error)
          }
        }
      }

      // -------------------------------------------------
      // 3) Subir metadata mínima para el resto de la app
      // -------------------------------------------------
      response.headers.set('x-subscription-tier', subscription.plan_tier || 'pro')
      response.headers.set('x-subscription-status', subscription.status || 'inactive')
      if (subscription.trial_end) {
        response.headers.set('x-subscription-trial-end', subscription.trial_end)
      }
      if (subscription.current_period_end) {
        response.headers.set('x-subscription-current-period-end', subscription.current_period_end)
      }

    } catch (error) {
      console.error('❌ middleware: error verificando paywall', error)
      // En caso de error, dejar continuar para no bloquear a usuarios legítimos
      response.headers.set('x-subscription-tier', 'pro')
      response.headers.set('x-subscription-status', 'unknown')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
