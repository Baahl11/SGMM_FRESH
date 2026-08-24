'use client'

import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowRight } from 'lucide-react'
import { trackSignupIntent } from '@/lib/analytics/funnel-events'

const faqs = [
  {
    question: '¿Necesito tarjeta para probar el sistema?',
    answer:
      'Necesitas agregar una tarjeta para activar el trial, pero no se realiza ningún cobro durante los primeros 14 días. Si cancelas antes del día 15, no pagas absolutamente nada. La tarjeta solo queda guardada para cuando decidas quedarte.',
  },
  {
    question: '¿Cuánto cuesta el sistema?',
    answer:
      'Manejamos dos planes: Pro desde $1,499 MXN/mes y Enterprise desde $2,999 MXN/mes. Ambos pueden activarse con ciclo mensual o anual, y cobramos 3% de cada anticipo procesado (tu clínica se queda con el 97%).',
  },
  {
    question: '¿Funciona con mi cuenta de WhatsApp Business?',
    answer:
      'Sí. Conectas tu propia cuenta oficial de WhatsApp Business con tus credenciales (BYOK). Pagas directo a tu proveedor y mantienes control total sobre tus números y plantillas. AgendaMedPro automatiza el envío y trazabilidad.',
  },
  {
    question: '¿Cuánto tiempo toma implementarlo?',
    answer:
      'Puedes dejarlo funcionando en menos de 30 minutos: doctores, horarios, servicios y link de reservas. Después conectas WhatsApp/SMS y empiezas a recibir anticipos con recordatorios automáticos.',
  },
  {
    question: '¿Funciona para varios doctores y sucursales?',
    answer:
      'Sí. El plan Pro soporta hasta 10 doctores y el plan Enterprise es ilimitado. Cada sucursal tiene su propia agenda, horarios y configuración. Puedes ver reportes por doctor, por sucursal o globales desde un solo panel.',
  },
  {
    question: '¿Migran mis datos de Excel o de otro sistema?',
    answer:
      'Sí. Te ayudamos a importar pacientes desde Excel o CSV y dejar la agenda operando sin fricción. El tiempo de migración suele ser de 1 a 2 horas según volumen, con soporte del equipo durante el proceso.',
  },
  {
    question: '¿Puedo cancelar cuando quiera?',
    answer:
      'Sí, puedes cancelar en cualquier momento desde tu cuenta. No hay contratos ni permanencia. Si cancelas antes del siguiente ciclo de facturación, no se genera ningún cargo adicional. Tus datos quedan disponibles para exportar por 30 días después de cancelar.',
  },
]

export function MarketingFAQ() {
  return (
    <section className="bg-[#020512] py-24 text-white">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-semibold">Preguntas frecuentes</h2>
        <p className="mt-3 text-center text-white/70">Respuestas directas. Sin letra pequeña.</p>
        <Accordion type="single" collapsible className="mt-10 space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="rounded-3xl border border-white/10 bg-white/[0.02] px-6"
            >
              <AccordionTrigger className="text-left text-lg">{faq.question}</AccordionTrigger>
              <AccordionContent className="pb-6 text-white/70">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Final */}
        <div className="mt-20 rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent px-8 py-12 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/70">Siguiente paso</p>
          <h2 className="mt-3 text-3xl font-semibold lg:text-4xl">
            Empieza hoy. 14 días sin cargos.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
              14 días gratis para validar con tus propios pacientes, tu propia agenda y tus propios cobros.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/select-trial-plan" className="aura-cta aura-cta--primary px-8 py-4 text-base" onClick={trackSignupIntent}>
              Prueba gratis 14 días
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/40">
            Activa con tarjeta, sin cobro en 14 días · Cancela cuando quieras · Soporte en español
          </p>
        </div>
      </div>
    </section>
  )
}
