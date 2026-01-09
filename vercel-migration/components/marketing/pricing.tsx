'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Básico',
    price: '$599 MXN',
    period: 'mes',
    badge: '7 días gratis',
    description: 'Perfecto para consultorios pequeños.',
    features: [
      '1 doctor',
      '1 consultorio',
      '200 citas/mes',
      '20 ítems de inventario',
      '10 tipos de tratamientos',
      'Agenda con 4 vistas',
      'Gestión de pacientes',
      'Horarios automáticos',
      'Reportes básicos',
      'Soporte por email',
    ],
    cta: '/auth/signup?plan=basic',
    ctaLabel: 'Comenzar prueba gratis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$999 MXN',
    period: 'mes',
    badge: 'Más popular',
    description: 'Para clínicas en crecimiento.',
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
    cta: '/auth/signup?plan=pro',
    ctaLabel: 'Comenzar prueba gratis',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$2,999 MXN',
    period: 'mes',
    badge: 'Multi-sede',
    description: 'Para grupos médicos grandes.',
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
    cta: '/contacto?topic=enterprise',
    ctaLabel: 'Hablar con ventas',
    highlighted: false,
  },
  {
    name: 'Pago Único de por Vida',
    price: '$19,990 MXN',
    period: 'pago único',
    badge: 'Lifetime',
    description: 'Todas las funcionalidades del Plan Pro con un solo pago.',
    features: [
      'Acceso total para siempre',
      'Sin mensualidades',
      'Actualizaciones incluidas',
      'Ahorro vs 5 años Plan Pro',
      'Pago 100% seguro',
    ],
    cta: '/auth/signup?plan=lifetime',
    ctaLabel: 'Obtener licencia',
    highlighted: false,
  },
]

export function PremiumPricing() {
  return (
    <section id="precios" className="bg-[#030614] py-28 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Planes flexibles</p>
          <h2 className="mt-3 text-3xl font-semibold lg:text-4xl">Elige tu plan perfecto</h2>
          <p className="mt-4 text-white/70">Precios oficiales de agendamedpro.com/pricing, sin inventar información.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
