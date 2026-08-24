'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { trackSignupIntent } from '@/lib/analytics/funnel-events'

const stats = [
  { label: 'No-shows menos en 90 días', value: '-78%' },
  { label: 'Horas administrativas ahorradas', value: '18 h/sem' },
  { label: 'Ingresos recuperados por agenda llena', value: '+32%' },
]

const heroDeposits = [
  { patient: 'Sandra Martínez', treatment: 'Botox avanzado', time: '09:30', amount: '$2,800 MXN' },
  { patient: 'Ricardo Pineda', treatment: 'PRP capilar', time: '11:00', amount: '$1,950 MXN' },
  { patient: 'Paola Ortiz', treatment: 'Relleno facial', time: '13:15', amount: '$3,400 MXN' },
]

const heroMiniPanels = [
  {
    title: 'Expediente y seguimiento',
    detail: 'Historia clínica + evolución',
    metric: 'Ficha completa en 1 pantalla',
    badge: 'Firma y consentimiento digital',
  },
  {
    title: 'Lista de espera automática',
    detail: '3 pacientes listos para ocupar hueco',
    metric: 'Espacio ocupado en 14 min',
    badge: 'Sin llamadas manuales',
  },
  {
    title: 'Cobro + facturación conectados',
    detail: 'Anticipo, checkout y conciliación',
    metric: '97% para tu clínica',
    badge: 'Reporte por doctor y sucursal',
  },
]

const heroCapabilities = [
  'Agenda multivista con bloqueo inteligente',
  'WhatsApp Business y SMS con tus credenciales',
  'Inventario por consumo en cada procedimiento',
  'Reportes de facturación por doctor, sede y servicio',
]

export function MarketingHero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-[#030614] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,85,255,0.35),_transparent_60%)]" />
      <div className="absolute inset-y-0 left-1/2 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(186,85,255,0.25),_transparent_65%)] blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-28 lg:flex-row lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10 lg:flex-1"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
            <span className="text-xs uppercase tracking-widest text-emerald-300">Sistema 360</span>
            Plataforma mexicana para clínicas estéticas y consultorios que quieren crecer sin contratar más administración
          </div>
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.4em] text-emerald-200/80">AgendaMedPro</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[58px] lg:leading-[62px]">
              Convierte cada hueco de agenda en ingreso medible.
            </h1>
            <p className="mt-6 text-lg text-white/80 lg:text-xl">
              Agenda de citas, cobro de anticipos, expediente clínico, recordatorios por WhatsApp y control de inventario en una sola plataforma. Tus pacientes reservan y pagan online; tú mantienes operación ordenada y margen protegido.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/select-trial-plan" className="aura-cta aura-cta--primary" onClick={trackSignupIntent}>
              Prueba gratis 14 días
              <ArrowRight className="h-5 w-5 transition-transform" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="text-sm text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {heroCapabilities.map((item) => (
              <div key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex w-full flex-1 justify-center"
        >
          <div className="absolute -top-6 right-8 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur">
            97% para ti · 3% para nosotros
          </div>
          <div className="absolute -bottom-10 left-0 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-400/20 to-sky-400/20 px-6 py-4 text-sm text-white/90 backdrop-blur">
            Control total de inventario y pagos 24/7
          </div>
          <div className="w-full max-w-xl rounded-[40px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="rounded-[32px] bg-[#020512]/85 p-6 shadow-[0_30px_90px_rgba(3,6,20,0.75)]">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Dashboard clínico</span>
                <span>Multi-sede</span>
              </div>
              <div className="mt-5 space-y-3">
                {heroDeposits.map((deposit) => (
                  <div key={deposit.patient} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{deposit.patient}</p>
                      <p className="text-xs text-white/60">
                        {deposit.treatment} • {deposit.time} h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-emerald-300">{deposit.amount}</p>
                      <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] text-emerald-200">
                        Depósito confirmado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {heroMiniPanels.map((panel) => (
                  <div key={panel.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{panel.title}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{panel.metric}</p>
                    <p className="text-xs text-white/60">{panel.detail}</p>
                    <span className="mt-3 inline-flex rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
                      {panel.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-10 top-1/3 w-56 rounded-3xl border border-white/10 bg-white/[0.08] p-4 text-white backdrop-blur">
            <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-200">WhatsApp enviado</p>
            <p className="mt-2 text-sm text-white/85">“Hola Ana, tu cita con la Dra. Torres está confirmada mañana 10:30.”</p>
            <p className="mt-3 text-[11px] text-white/50">Plantilla aprobada · ID #WA-2411</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
