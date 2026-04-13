import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de pérdidas por inasistencias — AgendaMedPro',
  description:
    'Descubre cuánto dinero pierde tu clínica cada mes por no-shows. Cálculo gratuito en segundos con datos reales de tu consultorio.',
}

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
