'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { CalendarRange, CircleDollarSign, MessageSquare, Settings2 } from 'lucide-react'

const features = [
  {
    title: 'Cobra anticipos y elimina no-shows',
    eyebrow: 'Pagos online con Stripe',
    description:
      'Tus pacientes pagan un depósito al reservar. Tú te quedas con el 97%, nosotros el 3% por procesar el pago. Si cancelan con anticipación, puedes reembolsar automáticamente. Si no llegan, el anticipo es tuyo. Así de simple.',
    bullets: [
      'Depósito configurable: monto fijo o porcentaje del servicio',
      'Políticas de reembolso personalizadas por tipo de cita',
      'Confirmación automática cuando el pago se aprueba',
    ],
    accent: 'Pagos online',
    outcome: 'Resultado: menos cancelaciones de último minuto',
    icon: CircleDollarSign,
    media: {
      label: 'Pago confirmado',
      content: 'Depósito $500 MXN • Cita confirmada • Paciente notificado',
    },
  },
  {
    title: 'Inventario médico que se actualiza solo',
    eyebrow: 'Control automático de medicamentos y materiales',
    description:
      'Cada vez que atiendes un paciente, el sistema descuenta automáticamente las unidades de Botox, ácido hialurónico o cualquier material que uses. Cuando te quedas sin stock, recibes una alerta por WhatsApp o email antes de que sea tarde.',
    bullets: [
      'Descuento automático por cada procedimiento realizado',
      'Alertas cuando llegues al mínimo que tú defines',
      'Historial completo de lotes, caducidades y proveedores',
    ],
    accent: 'Inventario inteligente',
    outcome: 'Resultado: compras con anticipación, sin urgencias costosas',
    icon: CalendarRange,
    media: {
      label: 'Alerta de inventario',
      content: 'Medicamento • 12u restantes • Reorden sugerido',
    },
  },
  {
    title: 'Mensajería automática que funciona',
    eyebrow: 'WhatsApp y SMS con tus credenciales',
    description:
      'Conecta tu cuenta oficial de WhatsApp Business o tu proveedor de SMS. El sistema envía recordatorios 24 horas, 2 horas y 1 hora antes de cada cita. Cuando se libera un espacio, la lista de espera se activa sola y avisa al siguiente paciente.',
    bullets: [
      'Recordatorios automáticos por WhatsApp y SMS',
      'Lista de espera inteligente que llena huecos automáticamente',
      'Plantillas personalizadas con el nombre del doctor y la clínica',
    ],
    accent: 'Automatización',
    outcome: 'Resultado: más asistencia y menos tiempo operativo',
    icon: MessageSquare,
    media: {
      label: 'Mensaje enviado',
      content: '"Hola Ana, tu cita con la Dra. Torres es mañana 10:30"',
    },
  },
  {
    title: 'Agenda, expediente y operación en una sola vista',
    eyebrow: 'Agenda + pacientes + reportes',
    description:
      'Programa citas sin conflictos, consulta antecedentes del paciente y toma decisiones con reportes en tiempo real. Cada doctor y cada sede opera en el mismo sistema para que no pierdas contexto ni dinero por desorden.',
    bullets: [
      'Vistas de día, semana y mes con estados de cita claros',
      'Ficha de paciente y seguimiento clínico desde la agenda',
      'Reportes por doctor, tratamiento y sucursal para decidir rápido',
    ],
    accent: 'Operación centralizada',
    outcome: 'Resultado: control total del negocio sin hojas de cálculo',
    icon: Settings2,
    media: {
      label: 'Agenda en vivo',
      content: '23 citas hoy • 0 conflictos • 4 espacios libres',
    },
  },
]

export function FeatureNarrative() {
  return (
    <section id="producto" className="relative bg-[#050b1d] py-24 text-white">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-6xl space-y-16 px-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className={`grid gap-10 lg:grid-cols-2 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className="space-y-5">
              <Badge variant="secondary" className="mb-2 bg-white/10 text-white">
                {feature.eyebrow}
              </Badge>
              <h2 className="text-3xl font-semibold lg:text-4xl">{feature.title}</h2>
              <p className="text-lg text-white/70">{feature.description}</p>
              <ul className="space-y-3 text-white/80">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/70">
                {feature.accent}
              </div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-emerald-200/75">{feature.outcome}</p>
              <feature.icon className="mb-4 h-10 w-10 text-emerald-300" />
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">{feature.media.label}</p>
                <p className="mt-3 text-xl font-semibold leading-snug text-white/90">{feature.media.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
