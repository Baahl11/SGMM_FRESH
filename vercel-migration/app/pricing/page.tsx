'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { STRIPE_PRICES } from '@/lib/stripe/server'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

type Plan = {
  id: 'basico' | 'pro' | 'enterprise'
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
      '20 items de inventario',
      '10 tipos de tratamientos',
      'Agenda con 4 vistas',
      'Gestión de pacientes',
      'Horarios automáticos',
      'Reportes básicos',
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
      'Hasta 10 doctores',
      'Citas ilimitadas',
      'Inventario ilimitado',
      'Tratamientos ilimitados',
      'Todo del plan Básico',
      'Bundles y paquetes',
      'Reportes avanzados',
      'Control de gastos fijos',
      'WhatsApp Business (BYOK)',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grupos médicos grandes',
    monthlyPrice: 2999,
    annualPrice: 29990,
    monthlyPriceId: STRIPE_PRICES.ENTERPRISE_MONTHLY,
    annualPriceId: STRIPE_PRICES.ENTERPRISE_ANNUAL,
    icon: Crown,
    gradient: 'from-orange-500 to-red-500',
    popular: false,
    features: [
      'Doctores ilimitados',
      'Consultorios ilimitados',
      'Todo del plan Pro',
      'Multi-ubicación',
      'API personalizada',
      'Integraciones custom',
      'Capacitación presencial',
      'Gerente de cuenta dedicado',
      'SLA 99.9% uptime',
      'Soporte 24/7',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Obtener parámetros de URL para mostrar mensajes
  const reason = searchParams.get('reason')
  const feature = searchParams.get('feature')
  const checkout = searchParams.get('checkout')

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setLoadingPlan(plan.id)
      setError(null)

      const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId

      // Llamar a la API para crear Checkout Session
      const response = await fetch('/api/create-checkout-session', {
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
        throw new Error(data.error || 'Error al crear sesión de pago')
      }

      const { url } = await response.json()

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No se recibió URL de checkout')
      }
    } catch (err: any) {
      console.error('Error selecting plan:', err)
      setError(err.message || 'Error al procesar el pago')
      setLoadingPlan(null)
    }
  }

  const lifetimeSavings = (999 * 12 * 5) - 19990 // 5 años de Plan Pro vs Lifetime

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Elige el plan perfecto para tu consultorio o clínica
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-full shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <Badge className="ml-2 bg-green-500 text-white">-17%</Badge>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {reason === 'no_subscription' && (
          <Alert className="mb-8 border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              Necesitas una suscripción activa para acceder a la plataforma.
            </AlertDescription>
          </Alert>
        )}

        {reason === 'feature_requires_pro' && (
          <Alert className="mb-8 border-purple-500 bg-purple-50">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              Esta funcionalidad requiere el Plan Pro o superior.
            </AlertDescription>
          </Alert>
        )}

        {checkout === 'canceled' && (
          <Alert className="mb-8 border-gray-500 bg-gray-50">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-900">
              Checkout cancelado. Puedes intentarlo nuevamente cuando quieras.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-8 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const isLoading = loadingPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular ? 'ring-2 ring-purple-500 shadow-xl scale-105' : 'shadow-md'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-purple-600 text-white">
                    Más Popular
                  </Badge>
                )}

                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${plan.gradient} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {currencyFormatter.format(price)}
                    </span>
                    <span className="text-gray-600">
                      / {billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 mt-1">
                      Ahorras {currencyFormatter.format(plan.monthlyPrice * 12 - plan.annualPrice)} al año
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Elegir Plan'
                  )}
                </Button>

                <ul className="mt-8 space-y-3">
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

        {/* Lifetime Plan */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <Badge className="bg-amber-600 text-white mb-4">Plan Lifetime</Badge>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Pago Único de por Vida
            </h3>
            <p className="text-gray-700 mb-6">
              Todas las funcionalidades del Plan Pro, pero con un solo pago.
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl font-bold text-gray-900">
                {currencyFormatter.format(19990)}
              </span>
              <span className="text-gray-600">pago único</span>
            </div>
            <p className="text-green-700 font-semibold mb-6">
              Ahorras {currencyFormatter.format(lifetimeSavings)} vs 5 años de Plan Pro
            </p>
            <Button
              onClick={async () => {
                setLoadingPlan('lifetime')
                try {
                  const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      priceId: STRIPE_PRICES.LIFETIME,
                      planTier: 'enterprise',
                    }),
                  })
                  const { url } = await response.json()
                  if (url) window.location.href = url
                } catch (err: any) {
                  setError(err.message)
                } finally {
                  setLoadingPlan(null)
                }
              }}
              disabled={loadingPlan === 'lifetime'}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {loadingPlan === 'lifetime' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Comprar Lifetime'
              )}
            </Button>
          </div>
        </Card>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Tienes preguntas?</h3>
          <p className="text-gray-600 mb-6">
            Contacta a nuestro equipo de soporte en{' '}
            <a href="mailto:soporte@agendamedpro.com" className="text-purple-600 hover:underline">
              soporte@agendamedpro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
