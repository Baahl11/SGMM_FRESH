'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { trackSignupCompleted } from '@/lib/analytics/funnel-events'
import { trackFunnelEvent } from '@/lib/analytics/funnel-client'
import {
  captureMarketingAttribution,
  readStoredMarketingAttribution,
  syncSignupAttribution,
} from '@/lib/marketing/attribution'

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
    console.warn('[Signup] Unable to persist trial selection cookie', {
      errorMessage: (error as Error).message,
    })
  }
}

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledEmail = searchParams.get('email') || ''
  const redirectUrl = searchParams.get('redirect') || ''
  const planFromUrl = searchParams.get('plan') || ''
  const billingFromUrl = searchParams.get('billing') || ''
  const [calculatorMonthlyLoss, setCalculatorMonthlyLoss] = useState<number | null>(null)
  
  const [email, setEmail] = useState(prefilledEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  // Update email when prefilled value changes
  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail)
    }
  }, [prefilledEmail])

  useEffect(() => {
    captureMarketingAttribution(searchParams)
    const stored = readStoredMarketingAttribution()
    setCalculatorMonthlyLoss(stored?.calculator.monthlyLoss ?? null)
    trackFunnelEvent('signup_view', {
      has_plan: Boolean(planFromUrl),
      has_calculator_result: Boolean(stored?.calculator.monthlyLoss),
    })
  }, [searchParams])

  const resendVerificationEmail = async (targetEmail: string) => {
    const payload: Record<string, string> = {
      email: targetEmail,
      next: planFromUrl && billingFromUrl
        ? `/select-trial-plan?plan=${planFromUrl}&billing=${billingFromUrl}`
        : '/select-trial-plan',
    }

    if (planFromUrl) payload.plan = planFromUrl
    if (billingFromUrl) payload.billing = billingFromUrl

    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    // Validaciones básicas antes de golpear Supabase
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)

      if (planFromUrl) callbackUrl.searchParams.set('plan', planFromUrl)
      if (billingFromUrl) callbackUrl.searchParams.set('billing', billingFromUrl)

      rememberTrialSelection(planFromUrl || null, billingFromUrl || null)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            name: email.split('@')[0],
          },
        },
      })

      console.log('Signup response:', { data, error })

      if (error) {
        toast.error('Error al crear cuenta', {
          description: error.message,
        })
        return
      }

      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          try {
            await resendVerificationEmail(email)
          } catch (resendError) {
            console.warn('[Signup] No se pudo reenviar verificación para cuenta existente', {
              errorMessage: (resendError as Error).message,
            })
          }

          toast.error('Este email ya está registrado', {
            description: 'Inicia sesión o verifica tu correo. Ya reenviamos el enlace de verificación.',
          })
          setTimeout(() => {
            if (planFromUrl && billingFromUrl) {
              router.push(`/auth/signin?plan=${planFromUrl}&billing=${billingFromUrl}`)
              return
            }
            router.push('/auth/signin')
          }, 2000)
          return
        }

        toast.success('¡Cuenta creada exitosamente!', {
          description: 'Te guiaremos al siguiente paso.',
        })
        trackSignupCompleted('email')
        trackFunnelEvent('signup_success', { method: 'email' })
        if (data.session) {
          void syncSignupAttribution()
        }

        setTimeout(() => {
          if (!data.session) {
            const verifyParams = new URLSearchParams()
            verifyParams.set('email', email)

            if (planFromUrl && billingFromUrl) {
              verifyParams.set('next', `/select-trial-plan?plan=${planFromUrl}&billing=${billingFromUrl}`)
              verifyParams.set('plan', planFromUrl)
              verifyParams.set('billing', billingFromUrl)
            } else {
              verifyParams.set('next', '/select-trial-plan')
            }

            router.push(`/auth/verify-email-required?${verifyParams.toString()}`)
            return
          }

          // If there's a redirect URL (from team invitation), go there
          if (redirectUrl) {
            router.push(redirectUrl)
          } else if (planFromUrl && billingFromUrl) {
            // Preserve the previous choice, but require an explicit activation click.
            router.push(`/select-trial-plan?plan=${planFromUrl}&billing=${billingFromUrl}`)
          } else {
            // Si no, mostrar selector de plan
            router.push('/select-trial-plan')
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Error inesperado', {
        description: 'Por favor intenta nuevamente',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true)
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)

      if (planFromUrl) callbackUrl.searchParams.set('plan', planFromUrl)
      if (billingFromUrl) callbackUrl.searchParams.set('billing', billingFromUrl)

      rememberTrialSelection(planFromUrl || null, billingFromUrl || null)

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        toast.error('Error al continuar con Google', {
          description: error.message,
        })
        return
      }
    } catch (error: any) {
      console.error('Google signup error:', error)
      toast.error('Error inesperado', {
        description: 'Por favor intenta nuevamente',
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-6">
      {calculatorMonthlyLoss !== null && calculatorMonthlyLoss > 0 && (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
          Estás activando AgendaMedPro para atacar una pérdida estimada de{' '}
          <strong>
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              maximumFractionDigits: 0,
            }).format(calculatorMonthlyLoss)}
          </strong>{' '}
          al mes.
        </div>
      )}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={loading || googleLoading}
          className="w-full bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 border-slate-200"
        >
          {googleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando con Google...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </>
          )}
        </Button>
        <Separator className="bg-slate-200" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || googleLoading}
          readOnly={!!prefilledEmail}
          autoComplete="email"
          className={prefilledEmail ? 'bg-teal-50 border-teal-300 text-gray-900 font-medium cursor-not-allowed' : ''}
        />
        {prefilledEmail && (
          <p className="text-xs text-teal-700 font-medium flex items-center gap-1">
            <span className="text-teal-600">✓</span> Email de invitación. Crea tu cuenta con este correo.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || googleLoading}
          autoComplete="new-password"
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading || googleLoading}
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta y continuar al trial'
        )}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        No necesitas tarjeta. Después de verificar tu correo eliges Pro o Enterprise y comienzan tus 14 días.
      </p>
    </form>
  )
}
