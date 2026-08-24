'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  LockKeyhole,
  MessageCircleMore,
  PackageCheck,
  ShieldCheck,
  Star,
  Stethoscope,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  trackCtaClick,
  trackPageView,
  trackSignupIntent,
  trackTrialLandingCta,
  trackTrialLandingView,
} from '@/lib/analytics/funnel-events'
import { trackFunnelEvent } from '@/lib/analytics/funnel-client'
import {
  captureMarketingAttribution,
  readStoredMarketingAttribution,
} from '@/lib/marketing/attribution'
import styles from './landing.module.css'

export type CalculatorContext = {
  monthlyLoss: number | null
  monthlyNoShows: number | null
  averageTicket: number | null
  recoverableMonthly: number | null
  appointmentsToCoverPlan: number | null
}

function currency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

const outcomes = [
  {
    icon: CalendarCheck2,
    title: 'Agenda sin conflictos',
    text: 'Doctores, consultorios y horarios coordinados desde una sola vista.',
    accent: 'from-emerald-400/25 to-teal-400/10',
  },
  {
    icon: MessageCircleMore,
    title: 'Menos inasistencias',
    text: 'Confirmaciones y recordatorios automáticos por WhatsApp y SMS.',
    accent: 'from-sky-400/25 to-blue-500/10',
  },
  {
    icon: WalletCards,
    title: 'Cobros conectados',
    text: 'Anticipos, facturación y seguimiento de pagos ligados a cada cita.',
    accent: 'from-violet-400/25 to-fuchsia-500/10',
  },
  {
    icon: PackageCheck,
    title: 'Inventario automático',
    text: 'Descuenta insumos por tratamiento y recibe alertas antes de agotarlos.',
    accent: 'from-orange-400/25 to-rose-500/10',
  },
]

const workflow = [
  {
    title: 'Configura tu operación',
    text: 'Agrega doctores, servicios, horarios y sucursales. Lo esencial queda listo en menos de 30 minutos.',
  },
  {
    title: 'Activa reservas y recordatorios',
    text: 'Tus pacientes reservan en línea y reciben confirmaciones sin llamadas ni mensajes manuales.',
  },
  {
    title: 'Controla con datos',
    text: 'Consulta ocupación, ingresos, tratamientos e inventario para decidir con información real.',
  },
]

const testimonials = [
  {
    initials: 'MR',
    name: 'Dra. Mariana Ramírez',
    role: 'Medicina estética · CDMX',
    quote:
      'Ahora el equipo sabe qué citas están confirmadas, qué pacientes dejaron anticipo y qué insumos requiere cada tratamiento.',
  },
  {
    initials: 'LS',
    name: 'Dr. Luis Sandoval',
    role: 'Traumatología · Guadalajara',
    quote:
      'Dejamos de perseguir confirmaciones todo el día. La agenda y los recordatorios trabajan incluso cuando el consultorio está cerrado.',
  },
  {
    initials: 'KT',
    name: 'Dra. Karla Torres',
    role: 'Clínica multidisciplinaria · Monterrey',
    quote:
      'Por fin tenemos una vista única de doctores, sedes, tratamientos y facturación. La operación se siente mucho más ligera.',
  },
]

const faqs = [
  {
    question: '¿Qué incluye la prueba de 14 días?',
    answer:
      'Acceso a las funciones del plan Pro: agenda multi-doctor, pacientes, expedientes, recordatorios, inventario, reportes, reservas online y más.',
  },
  {
    question: '¿Me cobran al registrarme?',
    answer:
      'No. Puedes probar Pro o Enterprise durante 14 días sin tarjeta. Al terminar eliges si deseas continuar con un plan de pago.',
  },
  {
    question: '¿Cuánto cuesta después?',
    answer:
      'El plan Pro cuesta $1,499 MXN al mes. No existen contratos forzosos y puedes administrar o cancelar tu suscripción desde tu cuenta.',
  },
  {
    question: '¿Funciona para varios doctores o sucursales?',
    answer:
      'Sí. El plan Pro permite hasta 10 doctores y múltiples sucursales. Para operaciones más grandes existe el plan Enterprise.',
  },
  {
    question: '¿Puedo importar mis pacientes actuales?',
    answer:
      'Sí. Puedes importar pacientes desde Excel o CSV y recibir acompañamiento durante la configuración inicial.',
  },
  {
    question: '¿Mis datos y los de mis pacientes están protegidos?',
    answer:
      'AgendaMedPro aplica controles de acceso, aislamiento por cuenta y conexiones cifradas para proteger la información de tu clínica.',
  },
]

function ProductPreview() {
  const appointments = [
    { time: '09:00', name: 'Ana Martínez', service: 'Consulta inicial', badge: 'Confirmada', badgeClass: 'bg-emerald-400/15 text-emerald-200' },
    { time: '10:30', name: 'Carlos Vega', service: 'Seguimiento', badge: 'Anticipo', badgeClass: 'bg-sky-400/15 text-sky-200' },
    { time: '12:00', name: 'Sofía Pérez', service: 'Procedimiento', badge: 'Confirmada', badgeClass: 'bg-violet-400/15 text-violet-200' },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:mx-0">
      <div className="absolute -inset-10 bg-[radial-gradient(circle,_rgba(56,189,248,0.2),_transparent_60%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_40px_120px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:p-6">
        <div className="rounded-[28px] border border-white/10 bg-[#020512]/90 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">Dashboard clínico</p>
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Operación de hoy</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky-400/30">
              <CalendarCheck2 className="h-5 w-5 text-emerald-200" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.time}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.045] p-3"
                >
                  <span className="text-xs font-semibold text-white/55">{appointment.time}</span>
                  <div>
                    <p className="text-xs font-semibold text-white sm:text-sm">{appointment.name}</p>
                    <p className="text-[10px] text-white/45 sm:text-xs">{appointment.service}</p>
                  </div>
                  <span className={`${appointment.badgeClass} rounded-full px-2.5 py-1 text-[9px] font-medium`}>
                    {appointment.badge}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-400/15 to-sky-400/5 p-4">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
                <p className="mt-4 text-3xl font-semibold text-white">92%</p>
                <p className="mt-1 text-[11px] text-white/50">Ocupación semanal</p>
              </div>
              <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/15 to-sky-400/5 p-4">
                <MessageCircleMore className="h-5 w-5 text-violet-300" />
                <p className="mt-4 text-3xl font-semibold text-white">18</p>
                <p className="mt-1 text-[11px] text-white/50">Recordatorios enviados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.floatCard} absolute -bottom-6 -left-2 rounded-2xl border border-white/15 bg-[#0c172b]/95 px-4 py-3 shadow-2xl backdrop-blur-xl sm:-left-8`}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </span>
          <div>
            <p className="text-xs font-semibold text-white">Cita confirmada</p>
            <p className="text-[10px] text-white/45">Automáticamente por WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConversionLanding({
  calculatorContext,
}: {
  calculatorContext: CalculatorContext | null
}) {
  const [showStickyCta, setShowStickyCta] = useState(false)
  const [activeCalculatorContext, setActiveCalculatorContext] = useState(calculatorContext)
  const calculatorMonthlyLoss = activeCalculatorContext?.monthlyLoss ?? null
  const hasCalculatorResult = calculatorMonthlyLoss !== null

  const signupHref = useMemo(() => {
    const params = new URLSearchParams({
      landing: 'prueba-gratis',
    })

    if (activeCalculatorContext) {
      params.set('source', 'calculator')
    }

    return `/auth/signup?${params.toString()}`
  }, [activeCalculatorContext])

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search)
    const storedBeforeCapture = readStoredMarketingAttribution()

    if (!(currentParams.get('source') === 'calculator' && storedBeforeCapture)) {
      captureMarketingAttribution(currentParams)
    }

    const stored = readStoredMarketingAttribution()
    if (currentParams.get('source') === 'calculator' && stored) {
      setActiveCalculatorContext({
        monthlyLoss: stored.calculator.monthlyLoss,
        monthlyNoShows: stored.calculator.missedAppointments,
        averageTicket: stored.calculator.averageTicket,
        recoverableMonthly: stored.calculator.recoverableMonthly,
        appointmentsToCoverPlan: stored.calculator.appointmentsToCover,
      })
    }

    trackPageView('/prueba-gratis')
    trackTrialLandingView()
    trackFunnelEvent('trial_landing_view')

    const updateStickyCta = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      setShowStickyCta(scrollableHeight > 0 && window.scrollY / scrollableHeight >= 0.22)
    }

    updateStickyCta()
    window.addEventListener('scroll', updateStickyCta, { passive: true })
    return () => window.removeEventListener('scroll', updateStickyCta)
  }, [])

  const handleCta = (label: string) => {
    trackSignupIntent()
    trackCtaClick(label, signupHref)
    trackTrialLandingCta(label)
    trackFunnelEvent('trial_landing_cta', { placement: label })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030614] text-white">
      <section className={`${styles.hero} relative overflow-hidden`}>
        <div className={`${styles.grid} pointer-events-none absolute inset-0`} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.18),_transparent_62%)] blur-3xl" />

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.24em] text-white sm:text-sm sm:tracking-[0.3em]">
            AgendaMedPro
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/signin"
              className="aura-cta aura-cta--ghost h-10 px-4 text-xs sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:pb-32 lg:pt-20">
          <div>
            <div className={`${styles.reveal} inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-100`}>
              <span className={`${styles.pulseDot} h-2 w-2 rounded-full bg-emerald-300`} />
              14 días gratis · Sin tarjeta · Elige Pro o Enterprise
            </div>

            <p className={`${styles.revealDelay} mt-8 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-200/75`}>
              AgendaMedPro
            </p>
            <h1 className={`${styles.revealDelay} mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-[64px] lg:leading-[68px]`}>
              {hasCalculatorResult
                ? `Tu clínica podría estar perdiendo ${currency(calculatorMonthlyLoss)} al mes.`
                : 'Convierte el caos operativo en una clínica que fluye.'}
            </h1>

            <p className={`${styles.revealLater} mt-6 max-w-xl text-lg leading-relaxed text-white/70`}>
              {hasCalculatorResult
                ? 'Centraliza agenda, recordatorios y anticipos para reducir inasistencias y recuperar capacidad de atención.'
                : 'Agenda, pacientes, recordatorios, cobros, inventario y reportes en un solo sistema. Recupera tiempo, reduce inasistencias y vuelve a enfocarte en atender.'}
            </p>

            {hasCalculatorResult && (
              <div className={`${styles.revealLater} mt-6 grid max-w-xl grid-cols-2 gap-3`}>
                {activeCalculatorContext && activeCalculatorContext.monthlyNoShows !== null && (
                  <div className="rounded-2xl border border-rose-300/15 bg-rose-400/[0.07] p-4">
                    <p className="text-2xl font-semibold text-rose-200">{activeCalculatorContext.monthlyNoShows}</p>
                    <p className="mt-1 text-xs text-white/50">citas perdidas al mes</p>
                  </div>
                )}
                {activeCalculatorContext && activeCalculatorContext.appointmentsToCoverPlan !== null && (
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] p-4">
                    <p className="text-2xl font-semibold text-emerald-200">{activeCalculatorContext.appointmentsToCoverPlan}</p>
                    <p className="mt-1 text-xs text-white/50">citas cubren el plan Pro</p>
                  </div>
                )}
              </div>
            )}

            <div className={`${styles.revealLater} mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center`}>
              <Link
                href={signupHref}
                onClick={() => handleCta('hero_start_trial')}
                className="aura-cta aura-cta--primary group w-full px-7 py-4 sm:w-auto"
              >
                Empezar mi prueba gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#como-funciona" className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-white/60 hover:text-white">
                Ver cómo funciona
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            <div className={`${styles.revealLater} mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45`}>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" /> Configuración guiada</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" /> Cancela cuando quieras</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" /> Soporte en español</span>
            </div>
          </div>

          <div className={styles.revealLater}>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#050b1d] py-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 sm:px-8 lg:grid-cols-4">
          {[
            ['< 30 min', 'Configuración inicial'],
            ['10 doctores', 'Incluidos en Pro'],
            ['24/7', 'Reservas automáticas'],
            ['14 días', 'Prueba completa'],
          ].map(([value, label]) => (
            <div key={value} className="text-center">
              <p className="text-xl font-semibold text-white sm:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#020512] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/70">Operación centralizada</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Todo lo que hoy está disperso, por fin conectado.
            </h2>
            <p className="mt-4 text-white/60">
              Menos pestañas, menos hojas de cálculo y menos mensajes perdidos. Cada parte de la atención alimenta la siguiente.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((outcome) => (
              <article
                key={outcome.title}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${outcome.accent}`}>
                  <outcome.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-7 text-xl font-semibold">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{outcome.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative bg-[#050b1d] px-5 py-24 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-sky-200/70">De cero a operando</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Empieza hoy. Nota la diferencia esta semana.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {workflow.map((step, index) => (
              <article key={step.title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky-400/30 text-lg font-semibold">
                  {index + 1}
                </span>
                <h3 className="mt-7 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#020512] px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-violet-200/70">Tu día clínico completo</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Sin saltar entre cinco sistemas.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-white/60">
              Desde que el paciente reserva hasta que se factura el tratamiento, AgendaMedPro mantiene el contexto y reduce el trabajo repetitivo.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [Stethoscope, 'Expediente y evolución clínica'],
                [FileText, 'Consentimientos y formularios'],
                [BarChart3, 'Reportes por doctor y sucursal'],
                [CreditCard, 'Anticipos y pagos conectados'],
                [LockKeyhole, 'Permisos por rol y equipo'],
                [ShieldCheck, 'Soporte de implementación'],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof Stethoscope
                return (
                  <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <FeatureIcon className="h-4 w-4 text-emerald-300" />
                    <span className="text-sm text-white/75">{label as string}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-emerald-400/10 via-sky-500/10 to-violet-500/15 p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-[#050b1d]/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-rose-200/60">Sin sistema</p>
                <ul className="mt-5 space-y-3 text-sm text-white/45">
                  {['Confirmaciones manuales', 'Citas en varios calendarios', 'Inventario en hojas', 'Pagos sin conciliar', 'Reportes tardíos'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-300/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[24px] border border-emerald-300/20 bg-[#071a18]/90 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Con AgendaMedPro</p>
                <ul className="mt-5 space-y-3 text-sm text-white/75">
                  {['Recordatorios automáticos', 'Una agenda por equipo', 'Insumos conectados', 'Anticipos por cita', 'Indicadores en vivo'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050b1d] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/45">Experiencia de clínicas</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
                Menos administración. Más control.
              </h2>
            </div>
            <div className="flex items-center gap-1 text-amber-300" aria-label="5 de 5 estrellas">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-5 w-5 fill-current" />)}
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <figure
                key={testimonial.name}
                className={`rounded-[30px] border p-7 ${
                  index === 1
                    ? 'border-emerald-300/25 bg-gradient-to-br from-emerald-400/10 to-sky-400/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <blockquote className="text-base leading-relaxed text-white/75">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/25 to-sky-400/25 text-xs font-semibold">
                    {testimonial.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{testimonial.name}</span>
                    <span className="block text-xs text-white/45">{testimonial.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="precio" className="bg-[#030614] px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/70">Precio claro</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Pruébalo con tu clínica. Decide con resultados.
            </h2>
            <p className="mt-5 leading-relaxed text-white/60">
              Configura tu agenda, invita a tu equipo y úsalo durante 14 días con tu operación real.
            </p>
            <div className="mt-7 flex items-center gap-3 text-sm text-white/65">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Sin contrato forzoso. Cancela desde tu cuenta.
            </div>
          </div>

          <div className="relative rounded-[34px] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/15 via-sky-500/10 to-violet-500/20 p-7 shadow-[0_30px_100px_rgba(14,165,233,0.18)] sm:p-9">
            <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full border border-emerald-200/25 bg-[#0b2824] px-4 py-2 text-xs font-semibold text-emerald-100">
              14 DÍAS GRATIS
            </div>
            <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Plan Pro</p>
                <p className="mt-3 text-3xl font-semibold">Toda tu operación.</p>
              </div>
              <div className="sm:text-right">
                <p className="text-4xl font-semibold">$1,499</p>
                <p className="text-xs text-white/45">MXN / mes después del trial</p>
              </div>
            </div>

            <div className="grid gap-3 py-7 sm:grid-cols-2">
              {[
                'Hasta 10 doctores',
                'Citas ilimitadas',
                'Múltiples sucursales',
                'WhatsApp Business',
                'Inventario y reportes',
                'Soporte prioritario',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15">
                    <Check className="h-3 w-3 text-emerald-300" />
                  </span>
                  {feature}
                </div>
              ))}
            </div>

            <Link
              href={signupHref}
              onClick={() => handleCta('pricing_start_trial')}
              className="aura-cta aura-cta--primary group w-full py-4"
            >
              Activar mis 14 días gratis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-center text-[11px] text-white/40">
              Sin tarjeta · Acceso completo durante 14 días · Tú decides si continúas
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#020512] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-white/45">Sin letra pequeña</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Preguntas antes de empezar</h2>
          </div>

          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left font-medium marker:hidden">
                  {faq.question}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/65 transition group-open:rotate-45 group-open:border-emerald-300/40 group-open:bg-emerald-400/10">
                    <span className="text-xl font-light">+</span>
                  </span>
                </summary>
                <p className="max-w-3xl pb-6 pr-10 text-sm leading-relaxed text-white/55 sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#020512] px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-emerald-400/15 via-sky-500/10 to-violet-500/20 px-6 py-14 text-center sm:px-10 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.2),_transparent_55%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-200/70">Tu próxima semana puede verse distinta</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-semibold sm:text-5xl">
              Deja que AgendaMedPro cargue con la operación.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-white/60">
              Empieza con tu agenda real, tus doctores y tus pacientes. Tienes 14 días para comprobarlo.
            </p>
            <Link
              href={signupHref}
              onClick={() => handleCta('final_start_trial')}
              className="aura-cta aura-cta--primary group mt-8 w-full px-8 py-4 sm:w-auto"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-5 text-xs text-white/40">Sin tarjeta · 14 días completos · Tus datos se conservan si no continúas</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#01030a] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold">AgendaMedPro</p>
            <p className="mt-1 text-xs text-white/40">Operación clínica centralizada.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-white/50">
            <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white">Términos</Link>
            <Link href="/soporte" className="hover:text-white">Soporte</Link>
          </div>
          <p className="text-xs text-white/35">© {new Date().getFullYear()} AgendaMedPro</p>
        </div>
      </footer>

      <div
        className={`${styles.stickyCta} fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#030614]/95 px-4 pt-3 backdrop-blur-xl transition duration-300 sm:hidden ${
          showStickyCta ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
        }`}
      >
        <Link
          href={signupHref}
          onClick={() => handleCta('mobile_sticky_start_trial')}
          className="aura-cta aura-cta--primary w-full py-3.5 text-sm"
        >
          Probar gratis 14 días
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  )
}
