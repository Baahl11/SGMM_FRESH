'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown, Loader2, AlertCircle, CreditCard, Star, TrendingUp, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { STRIPE_PRICES } from '@/lib/stripe/client'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// Payment gateway configuration with real logos
const PAYMENT_GATEWAYS = {
  stripe: { 
    name: 'Stripe', 
    logo: '/stripe-logo.svg',
    color: 'from-indigo-500 to-purple-600'
  },
  mercadopago: { 
    name: 'Mercado Pago', 
    logo: '/mercadopago-logo.svg',
    color: 'from-blue-400 to-cyan-500'
  },
} as const

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
      '1 consultorio',
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
      '5 consultorios',
      'Citas ilimitadas',
      'Inventario ilimitado',
      'Tratamientos ilimitados',
      'Todo del plan Básico',
      'Bundles y paquetes',
      'Reportes avanzados',
      'Control de gastos fijos',
      'Mensajería interna',
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

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'mercadopago'>('stripe')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Obtener parámetros de URL para mostrar mensajes
  const reason = searchParams.get('reason')
  const feature = searchParams.get('feature')
  const checkout = searchParams.get('checkout')

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthenticated(true)
        
        // Check if user has active subscription or trial
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .single()
        
        if (subscription) {
          setHasActiveSubscription(true)
        }
      }
    }
    
    checkAuth()
  }, [])

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setLoadingPlan(plan.id)
      setError(null)

      // Si no está autenticado, redirigir a registro con el plan seleccionado
      if (!isAuthenticated) {
        router.push(`/auth/register?plan=${plan.id}&billing=${billingCycle}`)
        return
      }

      // Si ya tiene suscripción activa, redirigir al dashboard
      if (hasActiveSubscription) {
        router.push('/dashboard')
        return
      }

      // Si está autenticado pero quiere cambiar de plan, proceder con pago
      if (paymentGateway === 'stripe') {
        // Checkout con Stripe
        const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId

        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al crear sesión de pago')
        }

        const { url } = await response.json()

        if (url) {
          window.location.href = url
        } else {
          throw new Error('No se recibió URL de checkout')
        }
      } else {
        // Checkout con Mercado Pago
        const response = await fetch('/api/mercadopago/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planTier: plan.id,
            billingCycle,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al crear sesión de pago')
        }

        const { init_point } = await response.json()

        if (init_point) {
          window.location.href = init_point
        } else {
          throw new Error('No se recibió URL de checkout')
        }
      }
    } catch (err: any) {
      console.error('Error selecting plan:', err)
      setError(err.message || 'Error al procesar el pago')
      setLoadingPlan(null)
    }
  }

  const lifetimeSavings = (999 * 12 * 5) - 19990 // 5 años de Plan Pro vs Lifetime

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-20 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-300/10 to-purple-300/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-full border border-purple-200/50 dark:border-purple-800/50 mb-6">
            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Planes flexibles para tu negocio</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 mb-6">
            Elige tu Plan Perfecto
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Gestiona tu consultorio médico con la plataforma todo-en-uno más completa de México
          </p>

          {/* Billing Cycle Toggle - Redesigned */}
          <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Anual
              <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                -17% 🎉
              </Badge>
            </button>
          </div>

          {/* Payment Gateway Selector - Redesigned */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pago 100% seguro con:
              </span>
            </div>
            <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setPaymentGateway('stripe')}
                className={`group px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 ${
                  paymentGateway === 'stripe'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  paymentGateway === 'stripe' ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/30'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <span>Stripe</span>
              </button>
              <button
                onClick={() => setPaymentGateway('mercadopago')}
                className={`group px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 ${
                  paymentGateway === 'mercadopago'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  paymentGateway === 'mercadopago' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
                <span>Mercado Pago</span>
              </button>
            </div>
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
                className={`relative overflow-hidden border-2 ${
                  plan.popular 
                    ? 'border-purple-500/50 dark:border-purple-400/50 bg-white/80 dark:bg-gray-900/80 shadow-2xl shadow-purple-500/20 scale-105 transform' 
                    : 'border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/70'
                } backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 group`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${plan.gradient}`} />
                
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 border-0 animate-pulse">
                      ⭐ Más Popular
                    </Badge>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg ${
                      plan.id === 'basico' ? 'shadow-blue-500/50' : plan.id === 'pro' ? 'shadow-purple-500/50' : 'shadow-orange-500/50'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${plan.gradient}`}>
                        {currencyFormatter.format(price)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        MXN/{billingCycle === 'monthly' ? 'mes' : 'año'}
                      </span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Ahorras {currencyFormatter.format(plan.monthlyPrice * 12 - plan.annualPrice)} al año
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                    className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white shadow-lg ${
                      plan.id === 'basico' ? 'shadow-blue-500/30 hover:shadow-blue-500/50' : 
                      plan.id === 'pro' ? 'shadow-purple-500/30 hover:shadow-purple-500/50' : 
                      'shadow-orange-500/30 hover:shadow-orange-500/50'
                    } transition-all duration-300 group-hover:scale-105`}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : hasActiveSubscription ? (
                      <>
                        Ir al Dashboard
                        <Zap className="ml-2 h-5 w-5" />
                      </>
                    ) : isAuthenticated ? (
                      <>
                        Actualizar Plan
                        <Zap className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Comenzar prueba gratis
                        <Zap className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                      7 días gratis
                    </p>
                  )}

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full ${
                          plan.id === 'basico' ? 'bg-blue-500/10' : 
                          plan.id === 'pro' ? 'bg-purple-500/10' : 
                          'bg-orange-500/10'
                        } flex items-center justify-center flex-shrink-0`}>
                          <Check className={`w-3 h-3 ${
                            plan.id === 'basico' ? 'text-blue-600 dark:text-blue-400' : 
                            plan.id === 'pro' ? 'text-purple-600 dark:text-purple-400' : 
                            'text-orange-600 dark:text-orange-400'
                          }`} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Lifetime Plan - Premium Edition */}
        <Card className="relative overflow-hidden border-2 border-amber-400/50 dark:border-amber-500/50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/50 dark:via-orange-950/50 dark:to-yellow-950/50 backdrop-blur-xl shadow-2xl shadow-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-12 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-500/50 mb-6 animate-pulse">
              <Crown className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">Oferta Especial Lifetime</span>
              <Crown className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 mb-4">
              Pago Único de por Vida
            </h3>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Todas las funcionalidades del <strong>Plan Pro</strong>, pero con un solo pago. Sin mensualidades, sin sorpresas.
            </p>

            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                    {currencyFormatter.format(19990)}
                  </span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Pago único • Para siempre</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 mb-8">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  Ahorras {currencyFormatter.format(lifetimeSavings)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">vs. 5 años de Plan Pro mensual</p>
              </div>
            </div>

            <Button
              onClick={async () => {
                setLoadingPlan('lifetime')
                try {
                  // Para Lifetime, pedir email si no está autenticado
                  let userEmail = null
                  
                  // Intentar obtener usuario (sin redirigir)
                  try {
                    const res = await fetch('/api/auth/session')
                    const data = await res.json()
                    userEmail = data?.user?.email
                  } catch {
                    // No autenticado
                  }

                  // Si no hay email, pedirlo
                  if (!userEmail) {
                    userEmail = prompt('Ingresa tu email para continuar con la compra:')
                    if (!userEmail) {
                      setLoadingPlan(null)
                      return
                    }
                  }

                  if (paymentGateway === 'stripe') {
                    const response = await fetch('/api/stripe/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        priceId: STRIPE_PRICES.LIFETIME,
                        email: userEmail,
                      }),
                    })
                    
                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.error || 'Error al crear sesión de pago')
                    }
                    
                    const { url } = await response.json()
                    if (url) window.location.href = url
                  } else {
                    const response = await fetch('/api/mercadopago/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        planTier: 'lifetime',
                        billingCycle: 'once',
                        email: userEmail,
                      }),
                    })
                    
                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.error || 'Error al crear sesión de pago')
                    }
                    
                    const { init_point } = await response.json()
                    if (init_point) window.location.href = init_point
                  }
                } catch (err: any) {
                  setError(err.message)
                } finally {
                  setLoadingPlan(null)
                }
              }}
              disabled={loadingPlan === 'lifetime'}
              size="lg"
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white shadow-2xl shadow-amber-500/50 hover:shadow-3xl hover:shadow-amber-500/70 text-lg px-12 py-6 transition-all duration-300 hover:scale-105"
            >
              {loadingPlan === 'lifetime' ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Crown className="w-6 h-6 mr-2" />
                  Obtener Licencia Lifetime
                  <Sparkles className="w-6 h-6 ml-2" />
                </>
              )}
            </Button>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Acceso Total</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Todas las features Pro</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sin Mensualidades</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Un pago, para siempre</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Actualizaciones Gratis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">De por vida incluidas</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Trust Badges & FAQ */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 mb-12 flex-wrap justify-center">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Pago 100% Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">7 Días de Prueba</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Activación Instantánea</span>
            </div>
          </div>

          <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4">
            ¿Tienes preguntas?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Nuestro equipo está listo para ayudarte
          </p>
          <a 
            href="mailto:soporte@agendamedpro.com" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            soporte@agendamedpro.com
          </a>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
