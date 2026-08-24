'use client'

import { motion } from 'framer-motion'
import {
  CalendarX,
  ClipboardList,
  TrendingDown,
  Package,
  Clock,
  MessageSquareX,
} from 'lucide-react'

const pains = [
  {
    icon: CalendarX,
    title: 'Tu agenda está desordenada y pierdes citas',
    detail: 'Dobles reservas, horarios sin confirmar y pacientes que no aparecen. Cada hueco sin ocupar es dinero que no regresa.',
  },
  {
    icon: MessageSquareX,
    title: 'Tu equipo confirma por WhatsApp manualmente',
    detail: 'Horas de llamadas y mensajes para confirmar una cita que igual se cancela. Trabajo operativo alto con resultado incierto.',
  },
  {
    icon: TrendingDown,
    title: 'No sabes qué horarios generan más ingresos',
    detail: 'Sin reportes claros, es imposible saber qué días venden más, qué doctores facturan mejor o dónde se pierden oportunidades.',
  },
  {
    icon: Package,
    title: 'Tu inventario se controla en hojas o a mano',
    detail: 'Caducidades que pasan desapercibidas, materiales que se acaban sin aviso y compras de emergencia más caras.',
  },
  {
    icon: Clock,
    title: 'La administración te consume 3+ horas al día',
    detail: 'Registros duplicados, correos de seguimiento, pagos sin confirmar. Tiempo que debería ir a pacientes.',
  },
  {
    icon: ClipboardList,
    title: 'La facturación y el cobro no están conectados',
    detail: 'Pagos registrados en un lado, citas en otro. Imposible saber cuánto cobra cada doctor o cada tratamiento.',
  },
]

export function PainPoints() {
  return (
    <section className="bg-[#020512] py-24 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-red-300/70">¿Te suena familiar?</p>
          <h2 className="mt-3 text-3xl font-semibold lg:text-4xl">
            Los problemas que frenan a la mayoría de consultorios en México
          </h2>
          <p className="mt-4 text-white/60">
            No es falta de pacientes. Es falta de sistema. Cada punto impacta tu ingreso diario.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map((pain, index) => (
            <motion.div
              key={pain.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-400/10">
                <pain.icon className="h-5 w-5 text-red-300" />
              </div>
              <h3 className="text-base font-semibold text-white">{pain.title}</h3>
              <p className="mt-2 text-sm text-white/60">{pain.detail}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 px-8 py-6 text-center">
          <p className="text-white/80">
            AgendaMedPro resuelve todos estos puntos en una sola plataforma.{' '}
            <span className="font-semibold text-emerald-300">Sin hojas de cálculo, sin confirmaciones manuales y con control real de ingresos.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
