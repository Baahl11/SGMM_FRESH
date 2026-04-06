'use client'

import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { trackSignupIntent, trackWhatsAppDemoClick } from '@/lib/analytics/funnel-events'
import { WHATSAPP_DEMO_URL } from '@/lib/marketing/constants'

const faqs = [
  {
    question: '¿Necesito tarjeta para probar el sistema?',
    answer:
      'Necesitas agregar una tarjeta para activar el trial, pero no se realiza ningún cobro durante los primeros 7 días. Si cancelas antes del día 8, no pagas absolutamente nada. La tarjeta solo queda guardada para cuando decidas quedarte.',
  },
  {
    question: '¿Cuánto cuesta el sistema?',
    answer:
      'El plan básico cuesta $599 MXN al mes para 1 doctor. El plan Pro a $999 MXN incluye hasta 10 doctores y reportes avanzados. Además, cobramos 3% de cada anticipo que proceses (tú te quedas con el 97%).',
  },
  {
    question: '¿Funciona con mi cuenta de WhatsApp Business?',
    answer:
      'Sí, conectas tu propia cuenta oficial de WhatsApp Business. Pagas directo a tu proveedor y mantienes el control total de tus números y plantillas aprobadas. Nosotros solo automatizamos el envío.',
  },
  {
    question: '¿Cuánto tiempo toma implementarlo?',
    answer:
      'Lo configuras en menos de 30 minutos. Agregas tus doctores, horarios y servicios. Copias el link de reservas y lo publicas en Instagram, Facebook o tu sitio web. Listo para empezar a recibir pagos.',
  },
  {
    question: '¿Funciona para varios doctores y sucursales?',
    answer:
      'Sí. El plan Pro soporta hasta 10 doctores en la misma cuenta. Cada sucursal tiene su propia agenda, horarios y configuración. Puedes ver los reportes por doctor, por sucursal o globales desde un solo panel.',
  },
  {
    question: '¿Migran mis datos de Excel o de otro sistema?',
    answer:
      'Sí. Te ayudamos a importar tu base de pacientes desde Excel, CSV o cualquier sistema anterior. El proceso tarda entre 1 y 2 horas dependiendo del volumen. El equipo de soporte te acompaña durante la migración sin costo adicional.',
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
            Empieza hoy. 7 días sin cargos.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            7 días gratis para que veas con tus propios datos cómo cambia la operación de tu clínica.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup" className="aura-cta aura-cta--primary px-8 py-4 text-base" onClick={trackSignupIntent}>
              Prueba gratis 7 días
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={WHATSAPP_DEMO_URL}
              className="aura-cta px-8 py-4 text-base"
              rel="noreferrer"
              target="_blank"
              onClick={trackWhatsAppDemoClick}
            >
              <MessageCircle className="h-5 w-5" /> Agendar demo por WhatsApp
            </a>
          </div>
          <p className="mt-6 text-xs text-white/40">
            Activa con tarjeta, sin cobro en 7 días · Cancela cuando quieras · Soporte en español
          </p>
        </div>
      </div>
    </section>
  )
}
