'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: '¿Necesito tarjeta para probar el sistema?',
    answer:
      'No. La prueba de 7 días es completamente gratis y sin tarjeta. Usas datos reales de tu clínica y, si te convence, activas los pagos para empezar a cobrar anticipos online.',
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
]

export function MarketingFAQ() {
  return (
    <section className="bg-[#020512] py-24 text-white">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-3xl font-semibold">Preguntas frecuentes</h2>
        <p className="mt-3 text-center text-white/70">Información transparente para equipos directivos.</p>
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
      </div>
    </section>
  )
}
