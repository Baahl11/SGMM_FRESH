'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CreditCard } from 'lucide-react'

type SupportedPlan = 'pro' | 'enterprise'
type BillingCycle = 'monthly' | 'annual'

const cleanStripeId = (id: string | undefined): string => {
  if (!id) return ''
  return id
    .replace(/^["']|["']$/g, '')
    .replace(/\r\n|\n|\r/g, '')
    .replace(/\r\n|\n|\r/g, '')
    .trim()
}

const STRIPE_PRICES = {
  pro: {
    monthly: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY),
    annual: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL),
  },
  enterprise: {
    monthly: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY),
    annual: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL),
  },
} as const

const rememberTrialSelection = (plan: string | null, billing: string | null) => {
  if (!plan && !billing) {
    return
  }

  try {
    const payload = encodeURIComponent(
      JSON.stringify({ plan: plan ?? null, billing: billing ?? null, recordedAt: Date.now() })
    )
    document.cookie = `trial_selection=${payload}; path=/; max-age=600; SameSite=Lax`
  } catch (error) {
    console.warn('[Auth Signin] Unable to persist plan selection cookie', {
      errorMessage: (error as Error).message,
    })
  }
}

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isSessionSwitchLoading, setIsSessionSwitchLoading] = useState(false)
  const [hasAutoStartedCheckout, setHasAutoStartedCheckout] = useState(false)
  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Obtener parámetros del plan seleccionado
  const planParam = searchParams.get('plan')
  const billingParam = searchParams.get('billing')
  const shouldAutoStartCheckout = searchParams.get('autostart') === '1'
  const normalizedPlan: SupportedPlan | null =
    planParam === 'pro' || planParam === 'enterprise' ? planParam : null
  const normalizedBilling: BillingCycle = billingParam === 'annual' ? 'annual' : 'monthly'

  const planDisplayName = normalizedPlan === 'enterprise' ? 'Enterprise' : 'Pro'
  const billingDisplayName = normalizedBilling === 'annual' ? 'anual' : 'mensual'

  const signupParams = new URLSearchParams()
  if (planParam) signupParams.set('plan', planParam)
  if (billingParam) signupParams.set('billing', billingParam)
  const createAccountHref = signupParams.toString()
    ? `/auth/signup?${signupParams.toString()}`
    : '/auth/signup'

  const startCheckoutFromPlan = async (plan: SupportedPlan, billing: BillingCycle) => {
    try {
      setIsCheckoutLoading(true)
      setMessage('Preparando checkout seguro...')
      rememberTrialSelection(plan, billing)

      const priceId = STRIPE_PRICES[plan][billing]
      if (!priceId) {
        setMessage('No encontramos la configuración del plan seleccionado. Intenta de nuevo.')
        return false
      }

      const response = await fetch('/api/create-trial-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planTier: plan,
        }),
      })

      if (!response.ok) {
        const data = await response.json()

        if (response.status === 403 && data?.code === 'email_not_verified') {
          const verifyParams = new URLSearchParams({
            next: `/select-trial-plan?plan=${plan}&billing=${billing}`,
            plan,
            billing,
          })

          if (data?.email || email) {
            verifyParams.set('email', data?.email || email)
          }

          router.push(`/auth/verify-email-required?${verifyParams.toString()}`)
          return false
        }

        throw new Error(data.error || 'No se pudo crear la sesión de checkout')
      }

      const { url } = await response.json()
      if (!url) {
        throw new Error('No se recibió URL de checkout')
      }

      window.location.href = url
      return true
    } catch (error) {
      console.error('Checkout start error:', error)
      setMessage((error as Error).message || 'No se pudo abrir el checkout. Intenta nuevamente.')
      return false
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  useEffect(() => {
    // Si hay sesión, mantener la pantalla de login para permitir cambio de cuenta.
    // Solo autoiniciar checkout cuando viene explícitamente con autostart=1.
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setActiveSessionEmail(null)
        return
      }

      setActiveSessionEmail(user.email ?? null)

      if (normalizedPlan && shouldAutoStartCheckout && !hasAutoStartedCheckout) {
        setHasAutoStartedCheckout(true)
        const started = await startCheckoutFromPlan(normalizedPlan, normalizedBilling)
        if (!started) {
          setMessage('No pudimos abrir el checkout. Selecciona tu plan nuevamente para activar el trial.')
          router.push(`/select-trial-plan?plan=${normalizedPlan}&billing=${normalizedBilling}`)
        }
      }
    }
    checkUser()
  }, [router, normalizedPlan, normalizedBilling, hasAutoStartedCheckout, shouldAutoStartCheckout])

  useEffect(() => {
    rememberTrialSelection(planParam, billingParam)
  }, [planParam, billingParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setMessage('Ingresa email y contraseña para continuar.')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else if (data.user) {
        if (normalizedPlan) {
          const started = await startCheckoutFromPlan(normalizedPlan, normalizedBilling)
          if (!started) {
            setMessage('Sesión iniciada, pero falta activar el trial en checkout. Redirigiendo a selección de plan...')
            setTimeout(() => {
              router.push(`/select-trial-plan?plan=${normalizedPlan}&billing=${normalizedBilling}`)
            }, 800)
          }
        } else {
          setMessage('¡Login exitoso! Redirigiendo...')
          setTimeout(() => router.push('/dashboard'), 1000)
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Construir URL de callback con parámetros del plan
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
      if (normalizedPlan) {
        callbackUrl.searchParams.set('plan', normalizedPlan)
        callbackUrl.searchParams.set('billing', normalizedBilling)
        callbackUrl.searchParams.set('autostart', '1')
      }

      rememberTrialSelection(planParam, billingParam)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        setMessage('Error al iniciar sesión con Google')
        setIsLoading(false)
      }
      // Si no hay error, el navegador redirigirá a Google
    } catch (error) {
      console.error('Google OAuth error:', error)
      setMessage('Error inesperado. Inténtalo de nuevo.')
      setIsLoading(false)
    }
  }

  const handleSignOutCurrentSession = async () => {
    setMessage('')
    setIsSessionSwitchLoading(true)
    try {
      await supabase.auth.signOut()
      setActiveSessionEmail(null)
      setHasAutoStartedCheckout(false)
      setMessage('Sesión actual cerrada. Ahora puedes iniciar con otra cuenta.')
    } catch (error) {
      console.error('Sign out error:', error)
      setMessage('No se pudo cerrar la sesión actual. Intenta nuevamente.')
    } finally {
      setIsSessionSwitchLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030614] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.25),_transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          <Badge className="mb-6 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            Ingreso seguro
          </Badge>
          <div className="flex items-center gap-3 text-emerald-200/80">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-[0.4em] uppercase">AgendaMedPro Access</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Inicia sesión y continúa tu activación
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Mantén tu plan seleccionado y completa el checkout para iniciar tu trial de 14 días.
          </p>

          {normalizedPlan && (
            <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-emerald-100">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                <CreditCard className="h-4 w-4" />
                Selección activa
              </div>
              <p className="mt-2 text-base">
                Plan <span className="font-bold">{planDisplayName}</span> con facturación <span className="font-bold">{billingDisplayName}</span>.
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 w-full max-w-md lg:mt-0">
          <div className="glass-panel p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">AgendaMedPro</h2>
              <p className="text-white/70 text-sm">Sistema de Gestión Médica Integral</p>
            </div>

            {activeSessionEmail && (
              <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100">
                <p className="text-sm">
                  Hay una sesión activa con <span className="font-semibold">{activeSessionEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={handleSignOutCurrentSession}
                  disabled={isSessionSwitchLoading || isLoading || isCheckoutLoading}
                  className="mt-3 w-full rounded-lg border border-amber-200/40 bg-amber-200/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/30 disabled:opacity-60"
                >
                  {isSessionSwitchLoading ? 'Cerrando sesión actual...' : 'Cerrar sesión actual para cambiar de cuenta'}
                </button>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore="true">
            <div className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="signin_email_manual"
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="signin_password_manual"
                  type="password"
                  autoComplete="off"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </div>
            </div>

            {/* Botón de Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isCheckoutLoading}
              className="w-full bg-white hover:bg-white/90 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">O continúa con email</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isCheckoutLoading}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading || isCheckoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{isCheckoutLoading ? 'Abriendo checkout...' : 'Iniciando sesión...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Iniciar Sesión con Email</span>
                </>
              )}
            </button>

            {message && (
              <div className={`p-4 rounded-xl backdrop-blur-sm ${
                message.includes('Error') 
                  ? 'bg-red-500/20 border border-red-500/30 text-red-100' 
                  : 'bg-green-500/20 border border-green-500/30 text-green-100'
              }`}>
                <p className="text-sm text-center">{message}</p>
              </div>
            )}
          </form>

          <div className="text-center mt-6 space-y-3">
            {/* Forgot password */}
            <a
              href="/auth/forgot-password"
              className="block text-sm text-white/60 hover:text-white transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </a>
            {/* Link para crear cuenta nueva */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-2">
                ¿No tienes cuenta todavía?
              </p>
              <Link
                href={createAccountHref}
                className="inline-block bg-white text-purple-600 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Crear Cuenta Gratis
              </Link>
            </div>

            <Link
              href="/"
              className="block text-sm text-white/80 hover:text-white transition-colors"
            >
              ← Volver al inicio
            </Link>
            <p className="text-xs text-white/60">
              ¿Problemas para acceder? Contacta a soporte@agendamedpro.com
            </p>
          </div>
        </div>

          <p className="mt-6 text-center text-xs text-white/50">
            Al continuar aceptas los términos y condiciones. © {new Date().getFullYear()} AgendaMedPro.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#030614] text-white">
        <div>Cargando...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}