'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Shield, Star, TrendingUp, Users, Calendar, Package, MessageSquare, FileText, BarChart } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/nav'
import { MarketingFooter } from '@/components/marketing/footer'

const FEATURES = [
  {
    icon: Users,
    title: 'Doctores ilimitados',
    description: 'Agrega todos los médicos que necesites'
  },
  {
    icon: Calendar,
    title: 'Agenda completa',
    description: '4 vistas diferentes y horarios automáticos'
  },
  {
    icon: Package,
    title: 'Inventario ilimitado',
    description: 'Control total de productos y materiales'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp con IA',
    description: 'Asistente inteligente 24/7'
  },
  {
    icon: FileText,
    title: 'Expedientes digitales',
    description: 'Historial médico completo y seguro'
  },
  {
    icon: BarChart,
    title: 'Reportes avanzados',
    description: 'Analytics y métricas en tiempo real'
  },
  {
    icon: Shield,
    title: 'Seguridad HIPAA',
    description: 'Datos encriptados y respaldados'
  },
  {
    icon: Star,
    title: 'Soporte prioritario',
    description: 'Ayuda rápida cuando la necesites'
  },
]

const ALL_FEATURES = [
  'Doctores ilimitados',
  'Consultorios ilimitados',
  'Citas ilimitadas',
  'Inventario completo',
  'Tratamientos personalizados',
  'Bundles y paquetes',
  'Agenda con 4 vistas',
  'Reservas online',
  'Expedientes digitales',
  'Recetas electrónicas',
  'WhatsApp con IA',
  'Recordatorios automáticos',
  'Control de gastos',
  'Reportes avanzados',
  'Facturación electrónica',
  'Multi-ubicación',
  'Roles y permisos',
  'Backup automático',
  'Actualizaciones incluidas',
  'Soporte prioritario',
]

type CommercialPlan = 'pro' | 'enterprise'

const COMMERCIAL_PLANS = [
  {
    id: 'pro' as const,
    name: 'Pro',
    icon: Zap,
    description: 'Para clínicas en crecimiento con operación multi-doctor.',
    monthlyPrice: 1499,
    annualPrice: 14990,
    annualBadge: 'Ahorra 2 meses',
    highlights: ['Hasta 10 doctores', 'Reportes avanzados', 'WhatsApp + inventario'],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    icon: TrendingUp,
    description: 'Para redes médicas con alta demanda y necesidades avanzadas.',
    monthlyPrice: 2999,
    annualPrice: 29990,
    annualBadge: 'Escalamiento total',
    highlights: ['Doctores ilimitados', 'API e integraciones', 'Soporte 24/7'],
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')
  const router = useRouter()

  const handleSubscribe = (plan: CommercialPlan, cycle: 'monthly' | 'annual') => {
    router.push(`/select-trial-plan?plan=${plan}&billing=${cycle}`)
  }

  return (
    <main className="min-h-screen bg-[#030614]">
      <MarketingNav />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-400/80">Dos planes, una sola plataforma</p>
            <h1 className="mt-6 text-5xl font-bold text-white lg:text-6xl">
              Gestiona tu consultorio <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                sin límites
              </span>
            </h1>
            <p className="mt-6 text-xl text-white/70 max-w-2xl mx-auto">
              Elige entre Pro y Enterprise según tu operación actual. Ambos planes incluyen onboarding guiado,
              trial de 14 días sin tarjeta y activación sin fricción.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-full px-8 py-3 text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`rounded-full px-8 py-3 text-sm font-medium transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Anual
                <span className="absolute -top-2 -right-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {COMMERCIAL_PLANS.map((plan, index) => {
              const annualSavings = plan.monthlyPrice * 12 - plan.annualPrice
              const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
              const periodLabel = billingCycle === 'monthly' ? 'MXN/mes' : 'MXN/año'
              const monthlyEquivalent = Math.round(plan.annualPrice / 12)

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`rounded-[32px] border p-10 transition-all relative ${
                    plan.id === 'pro'
                      ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-400/15 via-sky-500/10 to-purple-500/20 shadow-[0_25px_80px_rgba(34,197,94,0.35)]'
                      : 'border-white/20 bg-white/[0.04]'
                  }`}
                >
                  {billingCycle === 'annual' && (
                    <div className="absolute -top-4 right-8">
                      <div className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                        {plan.annualBadge} · Ahorra ${annualSavings.toLocaleString('es-MX')}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <plan.icon className="h-8 w-8 text-emerald-300" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.4em] text-white/50">Plan</p>
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-white/70">{plan.description}</p>

                  <div className="mt-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">${displayPrice.toLocaleString('es-MX')}</span>
                      <span className="text-white/60">{periodLabel}</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="mt-2 text-sm text-emerald-300">
                        Equivale a ${monthlyEquivalent.toLocaleString('es-MX')} MXN/mes
                      </p>
                    )}
                    <p className="mt-1 text-xs text-white/60">
                      {billingCycle === 'annual' ? 'Facturado anualmente' : 'Facturado mensualmente'}
                    </p>
                  </div>

                  <ul className="mt-6 space-y-2 text-sm text-white/75">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-300" />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id, billingCycle)}
                    className="mt-8 w-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-center font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50 hover:scale-105"
                  >
                    Elegir {plan.name}
                  </button>

                  <p className="mt-4 text-center text-xs text-white/60">
                    14 días gratis sin tarjeta • Decide al terminar
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">Todo incluido</p>
            <h2 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">
              Funcionalidades completas
            </h2>
            <p className="mt-4 text-white/70">
              Todas las capacidades críticas incluidas en Pro y Enterprise desde el día uno.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <feature.icon className="h-10 w-10 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Complete Feature List */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-10">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              Lista completa de funcionalidades
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ALL_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 rounded-full bg-emerald-400/20 p-1.5">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-white/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-[32px] border border-emerald-400/40 bg-gradient-to-br from-emerald-400/10 via-cyan-500/5 to-purple-500/10 p-12 text-center"
          >
            <Sparkles className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para transformar tu consultorio?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Únete a cientos de médicos que ya digitalizaron su práctica con AgendaMedPro
            </p>
            <button
              onClick={() => handleSubscribe('pro', billingCycle)}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-12 py-5 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50 hover:scale-105"
            >
              Elegir plan y activar trial
            </button>
            <p className="mt-4 text-sm text-white/60">
              Empieza sin tarjeta • Acceso completo durante 14 días
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">Preguntas frecuentes</p>
            <h2 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">
              ¿Tienes dudas?
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Puedo cambiar de plan mensual a anual?',
                a: 'Sí, puedes cambiar en cualquier momento desde tu panel. El cambio se aplicará de inmediato y se ajustará el cobro proporcionalmente.'
              },
              {
                q: '¿Qué incluye la prueba gratis de 14 días?',
                a: 'Acceso completo al plan que elijas, Pro o Enterprise, durante 14 días. No necesitas tarjeta para activar el trial.'
              },
              {
                q: '¿Puedo cancelar cuando quiera?',
                a: 'Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones. Tu acceso continuará hasta el final del período pagado.'
              },
              {
                q: '¿Los precios incluyen IVA?',
                a: 'Los precios mostrados son antes de IVA. Se agregará el 16% de IVA en la factura según la legislación mexicana.'
              },
              {
                q: '¿Hay límite de doctores o consultorios?',
                a: 'No. Con tu suscripción puedes agregar doctores, consultorios, pacientes y citas ilimitadas.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-white/70">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
