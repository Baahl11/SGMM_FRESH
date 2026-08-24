'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { trackPricingView } from '@/lib/analytics/funnel-events'

const plans = [
  {
    name: 'Pro',
    price: '$1,499 MXN',
    period: 'mes',
    badge: 'Más popular',
    description: 'Para clínicas en crecimiento.',
    outcome: 'Pensado para equipos, múltiples consultorios y operación con métricas avanzadas.',
    features: [
      'Hasta 10 doctores',
      '5 consultorios',
      'Citas ilimitadas',
      'Inventario ilimitado',
      'Tratamientos ilimitados',
      'Agenda multivista',
      'Bundles y paquetes',
      'Reportes avanzados',
      'Control de gastos fijos',
      'Mensajería interna',
      'Soporte prioritario',
    ],
    cta: '/select-trial-plan?plan=pro&billing=monthly',
    ctaLabel: 'Comenzar prueba gratis',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$2,999 MXN',
    period: 'mes',
    badge: 'Multi-sede',
    description: 'Para grupos médicos grandes.',
    outcome: 'Escala multi-sede con procesos estables, SLA y acompañamiento dedicado.',
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
    cta: '/select-trial-plan?plan=enterprise&billing=monthly',
    ctaLabel: 'Activar Enterprise',
    highlighted: false,
  },
]

export function PremiumPricing() {
  return (
    <section id="precios" className="bg-[#030614] py-28 text-white">
      <motion.div onViewportEnter={trackPricingView} viewport={{ once: true, amount: 0.1 }} />
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Planes flexibles</p>
          <h2 className="mt-3 text-3xl font-semibold lg:text-4xl">Elige el plan que se adapta a tu ritmo de crecimiento</h2>
          <p className="mt-4 text-white/70">Sin contratos forzosos. Cancela cuando quieras. Soporte en español y onboarding guiado.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`rounded-[32px] border p-8 ${
                plan.highlighted
                  ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-400/15 via-sky-500/10 to-purple-500/20 shadow-[0_25px_80px_rgba(34,197,94,0.35)]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-white/50">{plan.name}</p>
                  <p className="mt-4 text-4xl font-semibold">{plan.price}</p>
                  <p className="text-sm text-white/60">{plan.period}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{plan.badge}</span>
              </div>
              <p className="mt-6 text-sm text-white/80">{plan.description}</p>
              <p className="mt-3 text-sm text-emerald-200/85">{plan.outcome}</p>
              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta}
                className={`aura-cta mt-8 w-full justify-center ${plan.highlighted ? 'aura-cta--primary' : ''}`}
              >
                {plan.ctaLabel}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
