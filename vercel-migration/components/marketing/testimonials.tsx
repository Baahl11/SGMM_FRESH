'use client'

import { motion } from 'framer-motion'
import { trackTestimonialsView } from '@/lib/analytics/funnel-events'

const testimonials = [
  {
    name: 'Dra. Mariana Ramírez',
    role: 'Medicina estética, CDMX',
    quote:
      'Antes perdíamos 15 mil pesos al mes en no-shows. Desde que cobramos anticipos, las cancelaciones bajaron 78% y las que quedan nos dejan el depósito. Además dejamos de quedarnos sin insumos en días críticos.',
  },
  {
    name: 'Dr. Luis Sandoval',
    role: 'Traumatología deportiva, GDL',
    quote:
      'Mi asistente ya no pasa 3 horas al día confirmando citas por teléfono. Los recordatorios automáticos por WhatsApp nos ahorran 18 horas semanales y recuperamos tiempo para pacientes nuevos.',
  },
  {
    name: 'Dra. Karla Torres',
    role: 'Clínica multidisciplinaria, MTY',
    quote:
      'Aumentamos nuestra facturación 32% porque la lista de espera automática llena los huecos que antes se quedaban vacíos. Ahora también vemos rentabilidad por doctor y por servicio en tiempo real.',
  },
]

export function TestimonialShowcase() {
  return (
    <section className="bg-[#050b1d] py-24 text-white">
      <motion.div onViewportEnter={trackTestimonialsView} viewport={{ once: true, amount: 0.1 }} />
      <div className="mx-auto max-w-5xl space-y-10 px-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Casos reales</p>
          <h2 className="mt-3 text-3xl font-semibold lg:text-4xl">Clínicas premium que ya operan con AgendaMedPro</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-sm text-white/70">“{testimonial.quote}”</p>
              <div className="mt-6">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-white/60">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
