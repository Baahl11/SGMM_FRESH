import type { Metadata } from 'next'
import { ConversionLanding, type CalculatorContext } from './conversion-landing'

export const metadata: Metadata = {
  title: 'Prueba gratis 14 días',
  description:
    'Organiza citas, reduce inasistencias y controla tu clínica desde un solo lugar. Activa AgendaMedPro por 14 días sin cargos.',
  alternates: {
    canonical: 'https://agendamedpro.com/prueba-gratis',
  },
  openGraph: {
    title: '14 días para recuperar el control de tu clínica',
    description:
      'Agenda, recordatorios, pacientes, inventario y cobros en un solo sistema. Prueba AgendaMedPro sin cargos durante 14 días.',
    url: 'https://agendamedpro.com/prueba-gratis',
    type: 'website',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto dura la prueba gratis de AgendaMedPro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La prueba dura 14 días completos y permite usar las funciones incluidas en el plan seleccionado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Se realiza algún cobro durante la prueba?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No se realiza ningún cobro durante los primeros 14 días. Puedes cancelar antes del día 15.',
      },
    },
    {
      '@type': 'Question',
      name: '¿AgendaMedPro funciona para varios doctores?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. AgendaMedPro permite administrar varios doctores, agendas, consultorios y sucursales desde una sola cuenta.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo importar mis pacientes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Puedes importar información desde Excel o CSV y recibir acompañamiento durante la configuración.',
      },
    },
  ],
}

type FreeTrialLandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readBoundedNumber(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number
) {
  if (typeof value !== 'string' || !value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) return null
  return Math.round(parsed)
}

export default async function FreeTrialLandingPage({ searchParams }: FreeTrialLandingPageProps) {
  const rawSearchParams = await searchParams
  const isCalculatorSource = rawSearchParams.source === 'calculator'
  const calculatorContext: CalculatorContext | null = isCalculatorSource
    ? {
        monthlyLoss: readBoundedNumber(rawSearchParams.monthly_loss, 0, 100_000_000),
        monthlyNoShows: readBoundedNumber(rawSearchParams.monthly_no_shows, 0, 100_000),
        averageTicket: readBoundedNumber(rawSearchParams.average_ticket, 1, 1_000_000),
        recoverableMonthly: readBoundedNumber(rawSearchParams.recoverable_monthly, 0, 100_000_000),
        appointmentsToCoverPlan: readBoundedNumber(
          rawSearchParams.appointments_to_cover_plan,
          1,
          10_000
        ),
      }
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ConversionLanding calculatorContext={calculatorContext} />
    </>
  )
}
