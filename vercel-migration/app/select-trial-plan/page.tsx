'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GlassPanel } from '@/components/ui/glass-panel'
import { trackFunnelEvent } from '@/lib/analytics/funnel-client'
import {
  readStoredMarketingAttribution,
  syncSignupAttribution,
} from '@/lib/marketing/attribution'

// Helper to clean Stripe IDs (remove quotes, newlines, whitespace)
const cleanStripeId = (id: string | undefined): string => {
  if (!id) return ''
  return id
    .replace(/^["']|["']$/g, '')
    .replace(/\\r\\n|\\n|\\r/g, '')
    .replace(/\r\n|\n|\r/g, '')
    .trim()
}

// Stripe Price IDs from environment variables (cleaned)
const STRIPE_PRICES = {
  PRO_MONTHLY: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY),
  PRO_ANNUAL: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL),
  ENTERPRISE_MONTHLY: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY),
  ENTERPRISE_ANNUAL: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL),
}

const NO_CARD_TRIAL_ENABLED = process.env.NEXT_PUBLIC_NO_CARD_TRIAL_ENABLED === 'true'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

type Plan = {
  id: 'pro' | 'enterprise'
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  monthlyPriceId: string
  annualPriceId: string
  icon: LucideIcon
  gradient: string
  features: string[]
  popular: boolean
  outcome: string
}

const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para clinicas en crecimiento con equipo y demanda constante.',
    monthlyPrice: 1499,
    annualPrice: 14990,
    monthlyPriceId: STRIPE_PRICES.PRO_MONTHLY,
    annualPriceId: STRIPE_PRICES.PRO_ANNUAL,
    icon: Zap,
    gradient: 'from-emerald-400 to-sky-500',
    popular: true,
    outcome: 'Escalas operacion multi-doctor con reportes y automatizacion.',
    features: [
      '10 doctores',
      'Citas ilimitadas',
      'Multiples sucursales',
      'WhatsApp Business (BYOK)',
      'Inventario avanzado',
      'Reportes extendidos',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grupos medicos con operaciones multi-sede y alta demanda.',
    monthlyPrice: 2999,
    annualPrice: 29990,
    monthlyPriceId: STRIPE_PRICES.ENTERPRISE_MONTHLY,
    annualPriceId: STRIPE_PRICES.ENTERPRISE_ANNUAL,
    icon: Crown,
    gradient: 'from-orange-400 to-rose-500',
    popular: false,
    outcome: 'Escalas sin limites con soporte dedicado y control total de tu red clinica.',
    features: [
      'Doctores ilimitados',
      'Consultorios ilimitados',
      'Todo lo incluido en Pro',
      'API e integraciones personalizadas',
      'Capacitacion para equipos',
      'Soporte prioritario 24/7',
    ],
  },
]

const proofMetrics = [
  { value: '-78%', label: 'Menos no-shows con anticipos y recordatorios' },
  { value: '18 h/sem', label: 'Tiempo administrativo recuperado por equipo' },
  { value: '+32%', label: 'Ingreso extra por huecos ocupados con lista de espera' },
]

const faqItems = [
  {
    question: 'Cuanto dura la prueba gratis?',
    answer: 'El trial dura 14 dias completos desde que eliges Pro o Enterprise.',
  },
  {
    question: 'Necesito tarjeta para empezar?',
    answer: 'No. Solo agregas tu tarjeta si decides continuar cuando terminen los 14 dias.',
  },
  {
    question: 'Que necesito para iniciar?',
    answer: 'Una cuenta verificada y elegir el plan Pro o Enterprise que quieres probar.',
  },
]

const rememberTrialSelection = (planId: Plan['id'], cycle: 'monthly' | 'annual') => {
  try {
    const payload = encodeURIComponent(JSON.stringify({ plan: planId, billing: cycle, recordedAt: Date.now() }))
    document.cookie = `trial_selection=${payload}; path=/; max-age=600; SameSite=Lax`
  } catch (error) {
    console.warn('[Select Trial Plan] Unable to persist plan choice', {
      errorMessage: (error as Error).message,
    })
  }
}

function SelectTrialPlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reason = searchParams.get('reason')
  const message = searchParams.get('message')
  const selectedPlanParam = searchParams.get('plan')
  const selectedBillingParam = searchParams.get('billing')
  const autostart = searchParams.get('autostart') === '1'
  const canceled = searchParams.get('canceled') === 'true'
  const isTrialExpired = reason === 'trial_expired'
  const isPaymentSetupRequired = reason === 'payment_setup_required'

  const normalizedPlan = selectedPlanParam === 'pro' || selectedPlanParam === 'enterprise' ? selectedPlanParam : null
  const normalizedBilling: 'monthly' | 'annual' = selectedBillingParam === 'annual' ? 'annual' : 'monthly'

  useEffect(() => {
    trackFunnelEvent('select_trial_plan_view', {
      autostart,
      selected_plan: normalizedPlan,
      selected_billing: normalizedBilling,
    })
  }, [])

  useEffect(() => {
    if (selectedBillingParam === 'annual' || selectedBillingParam === 'monthly') {
      setBillingCycle(selectedBillingParam)
    }
  }, [selectedBillingParam])

  const handleSelectPlan = async (plan: Plan, cycleOverride?: 'monthly' | 'annual') => {
    try {
      setLoadingPlan(plan.id)
      setError(null)
      const selectedCycle = cycleOverride ?? billingCycle
      rememberTrialSelection(plan.id, selectedCycle)
      trackFunnelEvent('plan_select_clicked', {
        plan: plan.id,
        billing: selectedCycle,
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/auth/signin?plan=${plan.id}&billing=${selectedCycle}`)
        return
      }

      const marketingContext = readStoredMarketingAttribution()

      // Best effort: attribution must never block account activation.
      void syncSignupAttribution(marketingContext)

      const startsNoCardTrial = NO_CARD_TRIAL_ENABLED && !isTrialExpired
      const endpoint = startsNoCardTrial
        ? '/api/trials/activate'
        : isTrialExpired
          ? '/api/create-subscription-session'
          : '/api/create-trial-session'
      const priceId = selectedCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planTier: plan.id,
          billingCycle: selectedCycle,
          marketingContext,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data?.code === 'email_not_verified') {
          const verifyParams = new URLSearchParams({
            email: data?.email || user.email || '',
            next: `/select-trial-plan?plan=${plan.id}&billing=${selectedCycle}`,
            plan: plan.id,
            billing: selectedCycle,
          })
          router.push(`/auth/verify-email-required?${verifyParams.toString()}`)
          return
        }

        throw new Error(data?.error || 'No se pudo continuar con la activacion')
      }

      if (data.activated) {
        trackFunnelEvent('trial_started', {
          plan: plan.id,
          billing: selectedCycle,
          card_required: false,
        })
        router.push(data.redirectTo || '/welcome')
        return
      }

      if (data.url) {
        trackFunnelEvent('checkout_started', {
          plan: plan.id,
          billing: selectedCycle,
        })
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error selecting plan:', err)
      setError((err as Error).message)
    } finally {
      setLoadingPlan(null)
    }
  }

  useEffect(() => {
    if (NO_CARD_TRIAL_ENABLED || !autostart || hasAutoStarted || autoStartPending || !normalizedPlan) {
      return
    }

    const plan = plans.find(candidate => candidate.id === normalizedPlan)
    if (!plan) {
      return
    }

    setHasAutoStarted(true)
    setAutoStartPending(true)
    setBillingCycle(normalizedBilling)

    void handleSelectPlan(plan, normalizedBilling).finally(() => {
      setAutoStartPending(false)
    })
  }, [autostart, autoStartPending, hasAutoStarted, normalizedBilling, normalizedPlan])

  const selectedPlanForCta = plans.find(plan => plan.id === normalizedPlan) ?? plans[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030614] px-4 pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.20),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_62%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center">
          <Badge className="mb-4 border border-emerald-300/40 bg-emerald-400/15 px-5 py-2 text-sm text-emerald-100">
            <ShieldCheck className="mr-2 h-4 w-4" /> 14 dias gratis sin tarjeta
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            {isTrialExpired ? 'Continua con AgendaMedPro' : 'Elige el plan que quieres probar'}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/75">
            {isTrialExpired
              ? message || 'Tu periodo de prueba termino. Selecciona un plan para seguir operando sin interrupciones.'
              : 'Prueba Pro o Enterprise durante 14 dias completos. No necesitas agregar tarjeta para empezar.'}
          </p>
          {!isTrialExpired && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-white/65">
              <span>Sin contrato</span>
              <span className="text-white/35">•</span>
              <span>Sin tarjeta</span>
              <span className="text-white/35">•</span>
              <span>Tus datos permanecen seguros al terminar</span>
            </div>
          )}
        </div>

        {(canceled || isPaymentSetupRequired) && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-300/35 bg-amber-300/10 px-5 py-4 text-amber-100">
            {isPaymentSetupRequired
              ? message || 'Tu trial termino. Agrega tu tarjeta solo para continuar.'
              : 'El checkout fue cancelado. Puedes volver a intentarlo cuando quieras.'}
          </div>
        )}

        {autoStartPending && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-sky-300/30 bg-sky-400/10 px-5 py-4 text-sky-100">
            Estamos iniciando tu checkout automaticamente...
          </div>
        )}

        {isTrialExpired && (
          <GlassPanel className="mx-auto mt-8 max-w-4xl border-orange-300/30 bg-orange-400/10 p-6 text-orange-100">
            <h3 className="text-xl font-semibold">Tu trial termino</h3>
            <p className="mt-2 text-sm text-orange-100/90">
              Conserva tu configuracion actual activando un plan ahora. Si tienes codigo promocional, puedes usarlo en checkout.
            </p>
          </GlassPanel>
        )}

        {!isTrialExpired && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {proofMetrics.map(metric => (
              <GlassPanel key={metric.label} className="border-white/10 bg-white/[0.04] p-5 text-center">
                <p className="text-3xl font-semibold text-emerald-200">{metric.value}</p>
                <p className="mt-2 text-sm text-white/70">{metric.label}</p>
              </GlassPanel>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-emerald-300 to-sky-300 text-slate-900 shadow-[0_12px_35px_rgba(56,189,248,0.25)]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-emerald-300 to-sky-300 text-slate-900 shadow-[0_12px_35px_rgba(56,189,248,0.25)]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Anual (2 meses gratis)
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-300/35 bg-red-400/15 px-5 py-4 text-red-100">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {plans.map(plan => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12
            const annualSavings = plan.monthlyPrice * 12 - plan.annualPrice
            const isLoading = loadingPlan === plan.id

            return (
              <GlassPanel
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular
                    ? 'border-emerald-300/50 bg-gradient-to-br from-emerald-400/18 via-sky-400/12 to-transparent shadow-[0_25px_85px_rgba(16,185,129,0.18)]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border border-emerald-200/40 bg-emerald-300/20 text-emerald-100">
                    Mas elegido
                  </Badge>
                )}

                <div className="mb-6 text-center">
                  <div className={`mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-r ${plan.gradient} p-3`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-white/65">{plan.description}</p>
                  <div className="mt-5 flex items-end justify-center gap-2">
                    <span className="text-4xl font-semibold text-white">{currencyFormatter.format(price)}</span>
                    <span className="pb-1 text-white/60">/mes</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="mt-2 text-sm font-semibold text-emerald-200">
                      Ahorras {currencyFormatter.format(annualSavings)} por ano
                    </p>
                  )}
                  <p className="mt-3 text-sm text-emerald-200/90">{plan.outcome}</p>
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  className={`mb-6 w-full bg-gradient-to-r ${plan.gradient} text-white hover:opacity-95`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {isTrialExpired ? 'Continuar y pagar' : 'Iniciar 14 dias gratis'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            )
          })}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <GlassPanel className="border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/55">Incluido en todos los planes</p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" /> Seguridad y cifrado de nivel profesional</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" /> Soporte en espanol durante onboarding</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" /> Trial real de 14 dias con funcionalidades completas</li>
            </ul>
          </GlassPanel>
          <GlassPanel className="border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/55">Preguntas frecuentes</p>
            <div className="mt-4 space-y-4">
              {faqItems.map(item => (
                <div key={item.question}>
                  <p className="font-semibold text-white">{item.question}</p>
                  <p className="mt-1 text-sm text-white/70">{item.answer}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="mt-14 border-emerald-300/30 bg-gradient-to-r from-emerald-400/14 via-sky-400/10 to-transparent p-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Paso final</p>
          <h3 className="mt-3 text-3xl font-semibold">Empieza hoy con tus propios datos</h3>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Activa tu trial, conecta tu operacion y valida resultados con tu flujo real de pacientes.
          </p>
          <Button
            onClick={() => {
              if (!loadingPlan) {
                void handleSelectPlan(selectedPlanForCta)
              }
            }}
            disabled={!!loadingPlan}
            size="lg"
            className="mt-6 bg-gradient-to-r from-emerald-300 to-sky-300 font-semibold text-slate-900 hover:opacity-95"
          >
            {isTrialExpired ? 'Recuperar acceso' : 'Iniciar trial sin tarjeta'}
          </Button>
        </GlassPanel>
      </div>
    </div>
  )
}

export default function SelectTrialPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030614] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
        </div>
      }
    >
      <SelectTrialPlanContent />
    </Suspense>
  )
}
