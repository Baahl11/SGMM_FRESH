'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react'
import { STRIPE_PRICES } from '@/lib/stripe/server'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

type Plan = {
  id: 'basico' | 'pro'
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  monthlyPriceId: string
  annualPriceId: string
  icon: any
  gradient: string
  features: string[]
  popular: boolean
}

const plans: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    description: 'Perfecto para consultorios pequeños',
    monthlyPrice: 599,
    annualPrice: 5990,
    monthlyPriceId: STRIPE_PRICES.BASICO_MONTHLY,
    annualPriceId: STRIPE_PRICES.BASICO_ANNUAL,
    icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    popular: false,
    features: [
      '1 doctor',
      '200 citas/mes',
      'Agenda básica',
      'Gestión de pacientes',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para clínicas en crecimiento',
    monthlyPrice: 999,
    annualPrice: 9990,
    monthlyPriceId: STRIPE_PRICES.PRO_MONTHLY,
    annualPriceId: STRIPE_PRICES.PRO_ANNUAL,
    icon: Zap,
    gradient: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      '10 doctores',
      'Citas ilimitadas',
      'Múltiples sucursales',
      'WhatsApp Business',
      'Inventario avanzado',
      'Reportes extendidos',
      'Soporte prioritario',
    ],
  },
]

function SelectTrialPlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setLoadingPlan(plan.id)
      setError(null)

      const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId

      // Llamar a la API para crear Trial Session
      const response = await fetch('/api/create-trial-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planTier: plan.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al crear sesión de prueba')
      }

      const { url } = await response.json()

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      console.error('Error selecting plan:', err)
      setError(err.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500 text-white">🎉 ¡Bienvenido a AgendaMedPro!</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selecciona tu Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Agrega tu tarjeta y comienza tu prueba de <span className="font-bold text-green-600">7 días gratis</span>
          </p>
          <p className="text-sm text-gray-500">
            No se te cobrará hasta el día 8. Cancela cuando quieras.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'annual'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual (2 meses gratis)
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12
            const isLoading = loadingPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular ? 'border-2 border-purple-500 shadow-xl' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                    Más Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.gradient} mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {currencyFormatter.format(price)}
                    </span>
                    <span className="text-gray-600">/mes</span>
                  </div>

                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      Ahorras {currencyFormatter.format(plan.monthlyPrice * 12 - plan.annualPrice)} al año
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  className={`w-full mb-6 bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    '🎉 Iniciar Prueba Gratis'
                  )}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">¿Tienes preguntas?</h3>
          <div className="space-y-4 text-left">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">¿Cuándo se me cobrará?</p>
              <p className="text-gray-600">
                Tu tarjeta será autorizada hoy, pero <strong>no se te cobrará hasta el día 8</strong>. 
                Los primeros 7 días son completamente gratis.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">¿Puedo cancelar en cualquier momento?</p>
              <p className="text-gray-600">
                Sí, puedes cancelar cuando quieras desde tu panel de control. 
                Si cancelas durante el trial, no se te cobrará nada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SelectTrialPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <SelectTrialPlanContent />
    </Suspense>
  )
}
