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
    '/team/accept',     // Aceptar invitaciones de equipo (puede requerir login después)
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
        .select('plan_tier, status, max_doctors, max_locations, trial_end, current_period_end')
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
      // 2.5) NUEVO: Verificar si el trial sin tarjeta ha expirado
      // -------------------------------------------------
      if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end)
        const now = new Date()
        
        // Si el trial expiró, verificar si tiene método de pago
        if (now > trialEnd) {
          // Verificar si tiene método de pago en Stripe
          const { data: stripeData } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

          if (stripeData?.stripe_customer_id) {
            // Verificar con Stripe si tiene método de pago
            try {
              const response = await fetch(`${request.nextUrl.origin}/api/check-payment-method`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: stripeData.stripe_customer_id })
              })
              
              const { hasPaymentMethod } = await response.json()
              
              if (!hasPaymentMethod) {
                // Trial expirado y sin método de pago → Bloquear acceso
                const addPaymentUrl = new URL('/select-trial-plan', request.url)
                addPaymentUrl.searchParams.set('reason', 'trial_expired')
                addPaymentUrl.searchParams.set('message', 'Tu periodo de prueba ha terminado. Agrega un método de pago para continuar.')
                return NextResponse.redirect(addPaymentUrl)
              }
            } catch (err) {
              console.warn('⚠️ Error verificando método de pago:', err)
            }
          }
        }
      }

      // -------------------------------------------------
      // 3) Subir metadata mínima para el resto de la app
      // -------------------------------------------------
      response.headers.set('x-subscription-tier', subscription.plan_tier || 'basico')
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
