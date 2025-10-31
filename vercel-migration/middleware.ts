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

  // Si está en páginas de auth pero ya tiene sesión -> Dashboard
  if (request.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ========================================
  // PAYWALL: Verificación de suscripción
  // ========================================
  if (isProtectedRoute && user) {
    try {
      // Obtener suscripción del usuario
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_tier, status, max_doctors, max_locations')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single()

      // Si no tiene suscripción activa, redirigir a pricing
      if (!subscription) {
        // Permitir acceso a /settings para que pueda configurar su plan
        if (!request.nextUrl.pathname.startsWith('/settings')) {
          const pricingUrl = new URL('/pricing', request.url)
          pricingUrl.searchParams.set('reason', 'no_subscription')
          return NextResponse.redirect(pricingUrl)
        }
      }

      // Rutas que requieren Plan Pro (no Plan Básico)
      const proOnlyRoutes = [
        '/settings/schedules',     // Horarios recurrentes
        '/settings/exceptions',    // Excepciones
        '/settings/messaging',     // Mensajería avanzada
        '/reports/advanced',       // Reportes avanzados
      ]

      const isProOnlyRoute = proOnlyRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
      )

      // Si es ruta Pro-only y usuario tiene plan Básico -> upgrade modal
      if (isProOnlyRoute && subscription?.plan_tier === 'basico') {
        const upgradeUrl = new URL('/pricing', request.url)
        upgradeUrl.searchParams.set('reason', 'feature_requires_pro')
        upgradeUrl.searchParams.set('feature', request.nextUrl.pathname)
        return NextResponse.redirect(upgradeUrl)
      }

      // Agregar headers con info de suscripción para que componentes puedan usarla
      response.headers.set('x-subscription-tier', subscription?.plan_tier || 'basico')
      response.headers.set('x-subscription-status', subscription?.status || 'inactive')

    } catch (error) {
      console.error('Error checking subscription:', error)
      // En caso de error, permitir continuar (no bloquear al usuario)
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
