'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Obtener parámetros del plan seleccionado
  const planParam = searchParams.get('plan')
  const billingParam = searchParams.get('billing')

  useEffect(() => {
    // Check if user is already signed in with Supabase
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router])

  useEffect(() => {
    rememberTrialSelection(planParam, billingParam)
  }, [planParam, billingParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setMessage('¡Login exitoso! Redirigiendo...')
        setTimeout(() => router.push('/dashboard'), 1000)
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
      let callbackUrl = `${window.location.origin}/auth/callback`
      if (planParam || billingParam) {
        const params = new URLSearchParams()
        if (planParam) params.append('plan', planParam)
        if (billingParam) params.append('billing', billingParam)
        callbackUrl += `?${params.toString()}`
      }

      rememberTrialSelection(planParam, billingParam)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              AgendaMedPro
            </h2>
            <p className="text-white/80 text-sm mb-6">
              Sistema de Gestión Médica Integral
            </p>
          </div>
        
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botón de Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
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
              disabled={isLoading}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
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
              <a 
                href="/select-trial-plan"
                className="inline-block bg-white text-purple-600 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Crear Cuenta Gratis
              </a>
            </div>

            <a 
              href="/"
              className="block text-sm text-white/80 hover:text-white transition-colors"
            >
              ← Volver al inicio
            </a>
            <p className="text-xs text-white/60">
              ¿Problemas para acceder? Contacta a soporte@agendamedpro.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}