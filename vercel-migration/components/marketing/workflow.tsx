'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    title: 'Paciente reserva y paga online',
    detail: 'Ve horarios disponibles, elige su fecha y paga el anticipo con tarjeta. Todo en menos de 2 minutos.',
  },
  {
    title: 'Confirmación automática',
    detail: 'El paciente recibe confirmación por email y WhatsApp. Tú ves el pago en tu cuenta en segundos.',
  },
  {
    title: 'Recordatorios inteligentes',
    detail: 'El sistema envía mensajes 24h y 2h antes. Si cancela alguien, la lista de espera llena el hueco.',
  },
  {
    title: 'Control total del negocio',
    detail: 'Ves cuánto facturaste, qué tratamientos son más rentables y cuánto inventario te queda. Todo en tiempo real.',
  },
]

export function WorkflowTimeline() {
  return (
    <section id="automatizacion" className="bg-[#020512] py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm uppercase tracking-[0.4em] text-emerald-200/70">Customer Journey</p>
        <h2 className="mt-3 text-center text-3xl font-semibold lg:text-4xl">Una sola plataforma para todo el ciclo del paciente</h2>
        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky-400/30 text-lg font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-white/70">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
