import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // ========================================
  // RUTAS PÚBLICAS: No requieren autenticación
  // ========================================
  const publicRoutes = [
    '/book/',           // Páginas públicas de booking por clinic slug
    '/api/public/',     // APIs públicas (availability, booking)
    '/auth/',           // Login/signup pages
  ]

  const isPublicRoute = publicRoutes.some(route => 
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

  // Si está intentando acceder a ruta protegida sin sesión -> Login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ========================================
  // PAYWALL: Verificación de suscripción
  // ========================================
  if (isProtectedRoute && user) {
    // Permitir acceso a /select-trial-plan y /trial-success sin verificar suscripción
    const onboardingPaths = ['/select-trial-plan', '/trial-success']
    const isOnboarding = onboardingPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )
    
    if (isOnboarding) {
      return response
    }

    try {
      // -------------------------------------------------
      // 1) Detectar si el usuario es admin (bypass total)
      // -------------------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('⚠️ middleware: error obteniendo perfil', profileError)
      }

      if (profile?.role === 'admin') {
        response.headers.set('x-subscription-tier', 'admin')
        response.headers.set('x-subscription-status', 'active')
        return response
      }

      // -------------------------------------------------
      // 2) Verificar suscripción activa/trialing en Stripe
      // -------------------------------------------------
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_tier, status, max_doctors, max_locations, trial_ends_at, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

      if (subscriptionError) {
        console.error('⚠️ middleware: error obteniendo suscripción', subscriptionError)
      }

      if (!subscription) {
        const selectPlanUrl = new URL('/select-trial-plan', request.url)
        selectPlanUrl.searchParams.set('reason', 'no_subscription')
        return NextResponse.redirect(selectPlanUrl)
      }

      // -------------------------------------------------
      // 3) Subir metadata mínima para el resto de la app
      // -------------------------------------------------
      response.headers.set('x-subscription-tier', subscription.plan_tier || 'basico')
      response.headers.set('x-subscription-status', subscription.status || 'inactive')
      if (subscription.trial_ends_at) {
        response.headers.set('x-subscription-trial-end', subscription.trial_ends_at)
      }
      if (subscription.current_period_end) {
        response.headers.set('x-subscription-current-period-end', subscription.current_period_end)
      }

    } catch (error) {
      console.error('❌ middleware: error verificando paywall', error)
      // En caso de error, dejar continuar para no bloquear a usuarios legítimos
      response.headers.set('x-subscription-tier', 'basico')
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
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
