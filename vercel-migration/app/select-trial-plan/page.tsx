'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react'

// Helper to clean Stripe IDs (remove quotes, newlines, whitespace)
const cleanStripeId = (id: string | undefined): string => {
  if (!id) return ''
  return id
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/\\r\\n|\\n|\\r/g, '') // Remove escaped newlines
    .replace(/\r\n|\n|\r/g, '') // Remove actual newlines
    .trim()
}

// Stripe Price IDs from environment variables (cleaned)
const STRIPE_PRICES = {
  BASICO_MONTHLY: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY),
  BASICO_ANNUAL: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL),
  PRO_MONTHLY: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY),
  PRO_ANNUAL: cleanStripeId(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL),
}

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

  // Detectar si viene de trial expirado
  const reason = searchParams.get('reason')
  const message = searchParams.get('message')
  const isTrialExpired = reason === 'trial_expired'

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setLoadingPlan(plan.id)
      setError(null)

      // Si es trial expirado, ir a Stripe para agregar tarjeta
      if (isTrialExpired) {
        const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId

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

        if (url) {
          window.location.href = url
        }
      } else {
        // Usuario nuevo: Redirigir a signin para que haga OAuth
        // El OAuth callback creará el trial automáticamente
        const redirectUrl = `/auth/signin?plan=${plan.id}&billing=${billingCycle}`
        router.push(redirectUrl)
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
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-500 text-white text-base px-6 py-2">
            🎉 ¡SIN TARJETA REQUERIDA! - Prueba Gratis por 7 Días
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {isTrialExpired ? 'Continúa con AgendaMedPro' : 'Comienza tu Prueba Gratis'}
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {isTrialExpired ? (
              <span className="font-bold text-orange-600">{message || 'Tu periodo de prueba ha terminado'}</span>
            ) : (
              <>
                Crea tu cuenta con Google y <span className="font-bold text-green-600">empieza a usar el sistema inmediatamente</span>
              </>
            )}
          </p>
          {!isTrialExpired && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 flex-wrap">
              <span>✓ Sin contrato</span>
              <span className="text-gray-300">•</span>
              <span>✓ Cancela cuando quieras</span>
              <span className="text-gray-300">•</span>
              <span>✓ Todas las funciones incluidas</span>
            </div>
          )}
        </div>

        {/* Social Proof */}
        {!isTrialExpired && (
          <div className="mb-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">500+</div>
                <div className="text-sm text-gray-600">Médicos activos</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">50K+</div>
                <div className="text-sm text-gray-600">Citas gestionadas</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-green-600">4.9/5</div>
                <div className="text-sm text-gray-600">Calificación</div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Notice - Solo para trial expirado */}
        {isTrialExpired && (
          <div className="mb-8 max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-2xl">💳</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium mb-2">
                  <strong>Métodos de pago aceptados:</strong>
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>✅ Visa, Mastercard, American Express</p>
                  <p>✅ Tarjetas de crédito y débito</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Expired Alert */}
        {isTrialExpired && (
          <div className="mb-8 max-w-2xl mx-auto bg-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">
                  Tu Periodo de Prueba ha Terminado
                </h3>
                <p className="text-orange-800 mb-3">
                  Has disfrutado de <strong>7 días gratis</strong> de AgendaMedPro. Para continuar usando el sistema, selecciona un plan y agrega tu método de pago.
                </p>
                <div className="bg-white/50 rounded-lg p-3 border border-orange-200">
                  <p className="text-sm text-orange-900 font-medium">
                    💡 <strong>Tip:</strong> ¿Tienes un código promocional? Ingrésalo en el checkout para obtener descuentos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Comparison Table */}
        <div className="mt-16 mb-16 max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Comparación Detallada</h3>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Funcionalidad</th>
                    <th className="text-center p-4 font-semibold text-blue-600">Básico</th>
                    <th className="text-center p-4 font-semibold text-purple-600">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Número de doctores</td>
                    <td className="p-4 text-center text-gray-600">1</td>
                    <td className="p-4 text-center text-gray-900 font-semibold">10</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Citas mensuales</td>
                    <td className="p-4 text-center text-gray-600">200</td>
                    <td className="p-4 text-center text-gray-900 font-semibold">Ilimitadas</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Gestión de pacientes</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Agenda y calendario</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Expedientes médicos</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Múltiples sucursales</td>
                    <td className="p-4 text-center text-gray-400">—</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">WhatsApp Business</td>
                    <td className="p-4 text-center text-gray-400">—</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Inventario avanzado</td>
                    <td className="p-4 text-center text-gray-400">—</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Reportes extendidos</td>
                    <td className="p-4 text-center text-gray-400">—</td>
                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">Soporte</td>
                    <td className="p-4 text-center text-gray-600">Email</td>
                    <td className="p-4 text-center text-gray-900 font-semibold">Prioritario</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Preguntas Frecuentes</h3>
          <div className="space-y-4 text-left">
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">❓</span>
                ¿Necesito agregar mi tarjeta para la prueba gratis?
              </p>
              <p className="text-gray-600">
                <strong>¡No!</strong> Solo necesitas crear tu cuenta con Google. No pedimos tarjeta hasta después de los 7 días, cuando decidas continuar usando AgendaMedPro.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">⏰</span>
                ¿Cuánto dura la prueba gratis?
              </p>
              <p className="text-gray-600">
                Tendrás <strong>7 días completos</strong> para probar todas las funciones de AgendaMedPro sin restricciones ni límites.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">🔓</span>
                ¿Puedo cancelar en cualquier momento?
              </p>
              <p className="text-gray-600">
                Por supuesto. No hay contratos ni compromisos. Cancela cuando quieras desde tu panel de control, sin preguntas ni complicaciones.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">🔄</span>
                ¿Puedo cambiar de plan después?
              </p>
              <p className="text-gray-600">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplican inmediatamente y el cobro se ajusta proporcionalmente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">🛡️</span>
                ¿Mis datos están seguros?
              </p>
              <p className="text-gray-600">
                Absolutamente. Usamos encriptación de nivel bancario y cumplimos con todas las regulaciones de privacidad médica (HIPAA, GDPR). Tus datos están protegidos 24/7.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <p className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-purple-600">📞</span>
                ¿Ofrecen soporte técnico?
              </p>
              <p className="text-gray-600">
                Sí. El plan Básico incluye soporte por email, y el plan Pro incluye soporte prioritario con respuesta en menos de 2 horas.
              </p>
            </div>
          </div>

          {/* CTA Final */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h4 className="text-2xl font-bold mb-4">¿Listo para transformar tu consultorio?</h4>
            <p className="text-lg mb-6 text-purple-100">
              Únete a cientos de médicos que ya confían en AgendaMedPro
            </p>
            <Button
              onClick={() => {
                const firstPlan = plans[0] // Seleccionar primer plan (Básico)
                if (firstPlan && !loadingPlan) handleSelectPlan(firstPlan)
              }}
              disabled={!!loadingPlan}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg"
            >
              Comenzar Ahora - 100% Gratis
            </Button>
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
