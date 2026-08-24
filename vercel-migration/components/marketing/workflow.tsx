'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    title: 'Paciente reserva y deja anticipo online',
    detail: 'Ve horarios disponibles, elige su fecha y paga con tarjeta en menos de 2 minutos. Cita confirmada desde el primer paso.',
  },
  {
    title: 'Confirmación automática',
    detail: 'El paciente recibe confirmación por email y WhatsApp. Tu equipo deja de perseguir confirmaciones manuales.',
  },
  {
    title: 'Recordatorios inteligentes',
    detail: 'El sistema envía mensajes 24h y 2h antes. Si alguien cancela, la lista de espera ocupa ese espacio automáticamente.',
  },
  {
    title: 'Control total del negocio en tiempo real',
    detail: 'Ves cuánto facturaste, qué tratamientos dejan más margen y cuánto inventario te queda por sede y doctor.',
  },
]

export function WorkflowTimeline() {
  return (
    <section id="automatizacion" className="bg-[#020512] py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm uppercase tracking-[0.4em] text-emerald-200/70">Flujo completo</p>
        <h2 className="mt-3 text-center text-3xl font-semibold lg:text-4xl">Una sola plataforma para todo el ciclo del paciente</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-white/65">
          Desde la reserva hasta el reporte final de ingresos. Cada etapa queda automatizada y trazable.
        </p>
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
