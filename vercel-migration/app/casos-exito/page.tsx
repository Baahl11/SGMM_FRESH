import { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/nav'
import {
  TrendingUp,
  Users,
  Calendar,
  Package,
  DollarSign,
  Clock,
  ArrowRight,
  PhoneCall,
  Building2,
  UserCheck,
  Shield,
  Stethoscope
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Casos de Éxito | AgendaMedPro',
  description: 'Historias reales de médicos y clínicas que multiplicaron su eficiencia con AgendaMedPro'
}

const successStories = [
  {
    title: 'Clínica Salud Integral: De Excel a sistema profesional en 2 semanas',
    clinic: 'Clínica Multiespecialidad',
    doctors: 5,
    location: 'Querétaro, Qro.',
    duration: '8 meses usando AgendaMedPro',
    icon: Building2,
    accent: 'emerald',
    challenge:
      'Gestionar 5 doctores con Excel y papel generaba conflictos constantes de horarios, pérdida de citas, inventario descontrolado, y facturación manual que tomaba días.',
    solution:
      'Implementaron AgendaMedPro con calendario multi-doctor, inventario automático, facturación CFDI 4.0, y recordatorios por WhatsApp.',
    results: [
      { metric: '0 conflictos', description: 'de agenda en 8 meses', icon: Calendar, color: 'blue' },
      { metric: '+35%', description: 'aumento en citas mensuales', icon: TrendingUp, color: 'green' },
      { metric: '90%', description: 'reducción en inasistencias', icon: Users, color: 'purple' },
      { metric: '3h/día', description: 'ahorro en tareas administrativas', icon: Clock, color: 'orange' }
    ],
    testimonial:
      'Pasamos de caos total a organización perfecta. Ahora coordinamos 5 doctores sin un solo conflicto y nuestros pacientes aman los recordatorios por WhatsApp.',
    author: 'Dr. Luis Hernández, Director Médico'
  },
  {
    title: 'Dr. Carlos Mendoza: Duplicó su facturación optimizando agenda',
    clinic: 'Consultorio Médico General',
    doctors: 1,
    location: 'Puebla, Pue.',
    duration: '1 año usando AgendaMedPro',
    icon: UserCheck,
    accent: 'sky',
    challenge:
      'Agenda desorganizada con muchos huecos vacíos por inasistencias. Inventario manual que consumía 2 horas diarias. Pérdida de pacientes por falta de seguimiento.',
    solution:
      'Implementó sistema de recordatorios automáticos, inventario automático, y reportes de ingresos para optimizar horarios pico.',
    results: [
      { metric: '+120%', description: 'aumento en facturación anual', icon: DollarSign, color: 'green' },
      { metric: '5%', description: 'tasa de inasistencias (antes 30%)', icon: Users, color: 'blue' },
      { metric: '95%', description: 'ocupación de agenda', icon: Calendar, color: 'purple' },
      { metric: '2h/día', description: 'recuperadas para atender más pacientes', icon: Clock, color: 'orange' }
    ],
    testimonial:
      'AgendaMedPro no solo me organizó, me hizo más rentable. Identifiqué mis horarios pico, reduje inasistencias, y ahora atiendo 40% más pacientes por semana.',
    author: 'Dr. Carlos Mendoza'
  },
  {
    title: 'Dra. Ana Martínez: Cero errores de medicación con inventario automático',
    clinic: 'Consultorio Pediátrico',
    doctors: 3,
    location: 'CDMX',
    duration: '6 meses usando AgendaMedPro',
    icon: Shield,
    accent: 'violet',
    challenge:
      'Control manual de inventario generaba errores frecuentes: recetar medicamentos agotados, no detectar caducidades, pérdidas por mal conteo.',
    solution:
      'Implementó módulo de inventario con descuentos automáticos al usar productos en consulta, alertas de bajo stock, y control de caducidades.',
    results: [
      { metric: '0 errores', description: 'de medicación por desabasto', icon: Package, color: 'red' },
      { metric: '100%', description: 'trazabilidad de cada producto', icon: TrendingUp, color: 'green' },
      { metric: '$15,000', description: 'ahorro mensual evitando caducidades', icon: DollarSign, color: 'green' },
      { metric: '1.5h/día', description: 'ahorro en conteo manual', icon: Clock, color: 'orange' }
    ],
    testimonial:
      'Como pediatra no puedo darme el lujo de equivocarme con medicamentos. El inventario automático me da paz mental total y ha evitado pérdidas por caducidades.',
    author: 'Dra. Ana Martínez'
  },
  {
    title: 'Centro Médico del Valle: Coordinó 12 doctores sin administrador dedicado',
    clinic: 'Clínica Multiespecialidad Grande',
    doctors: 12,
    location: 'Toluca, Edomex',
    duration: '10 meses usando AgendaMedPro',
    icon: Stethoscope,
    accent: 'cyan',
    challenge:
      '12 especialistas en 6 consultorios generaban conflictos diarios. Tenían una persona dedicada solo a coordinar horarios. Pacientes se quejaban de esperas por mala organización.',
    solution:
      'Vista grid multi-doctor para ver disponibilidad de todos simultáneamente. Configuración de horarios automáticos por especialista con detección de conflictos.',
    results: [
      { metric: '$25,000', description: 'ahorro mensual en coordinador', icon: DollarSign, color: 'green' },
      { metric: '0 conflictos', description: 'desde implementación', icon: Calendar, color: 'blue' },
      { metric: '-60%', description: 'reducción en tiempos de espera', icon: Clock, color: 'orange' },
      { metric: '+50%', description: 'mejora en satisfacción del paciente', icon: Users, color: 'purple' }
    ],
    testimonial:
      'Gestionar 12 doctores era imposible sin software. AgendaMedPro nos ahorró el sueldo de un coordinador y mejoró dramáticamente la experiencia del paciente.',
    author: 'Lic. María González, Gerente Administrativa'
  }
]

const totalDoctors = successStories.reduce((acc, story) => acc + story.doctors, 0)

const heroHighlights = [
  { label: 'Doctores coordinados', value: `${totalDoctors}+`, detail: 'gestionados desde una sola consola' },
  { label: 'Implementación promedio', value: '14 días', detail: 'equipo de onboarding dedicado' },
  { label: 'Automatizaciones activas', value: '60+', detail: 'recordatorios, inventario y cobros' }
]

const gradientByColor: Record<string, string> = {
  blue: 'from-sky-500/20 via-transparent to-transparent',
  green: 'from-emerald-500/20 via-transparent to-transparent',
  purple: 'from-purple-500/20 via-transparent to-transparent',
  orange: 'from-orange-400/20 via-transparent to-transparent',
  red: 'from-rose-500/20 via-transparent to-transparent'
}

const iconByColor: Record<string, string> = {
  blue: 'text-sky-200',
  green: 'text-emerald-200',
  purple: 'text-purple-200',
  orange: 'text-orange-200',
  red: 'text-rose-200'
}

const storyIconThemes: Record<string, { background: string; ring: string; icon: string }> = {
  emerald: {
    background: 'from-emerald-500/30 via-emerald-500/5 to-transparent',
    ring: 'ring-emerald-400/30',
    icon: 'text-emerald-50'
  },
  sky: {
    background: 'from-sky-500/30 via-sky-500/5 to-transparent',
    ring: 'ring-sky-400/30',
    icon: 'text-sky-50'
  },
  violet: {
    background: 'from-indigo-500/30 via-indigo-500/5 to-transparent',
    ring: 'ring-indigo-400/30',
    icon: 'text-indigo-50'
  },
  cyan: {
    background: 'from-cyan-500/30 via-cyan-500/5 to-transparent',
    ring: 'ring-cyan-400/30',
    icon: 'text-cyan-50'
  }
}

const getStoryIconTheme = (accent: string) => storyIconThemes[accent] ?? storyIconThemes.emerald

export default function CasosExitoPage() {
  return (
    <main className="min-h-screen bg-[#030614] text-white">
      <MarketingNav />
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_55%)]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_60%)] blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center">
          <div className="space-y-8 lg:w-1/2">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white/80">
              <TrendingUp className="h-4 w-4 text-emerald-200" />
              Casos de éxito con estética clínica premium
            </div>
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">AgendaMedPro</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Historias reales de clínicas que operan con precisión fintech.
              </h1>
              <p className="text-lg text-white/75">
                Todas las implementaciones se acompañan de un equipo de revenue enablement, migración de datos y plantillas
                listas para cobrar, notificar y medir desde el día uno.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroHighlights.map((highlight) => (
                <div key={highlight.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-2xl font-semibold text-white">{highlight.value}</p>
                  <p className="text-sm text-white/70">{highlight.label}</p>
                  <p className="mt-1 text-xs text-white/50">{highlight.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/#pricing" className="aura-cta aura-cta--primary w-full justify-center sm:w-auto">
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/522223404585?text=Hola,%20quiero%20una%20demo%20personalizada%20de%20AgendaMedPro"
                target="_blank"
                rel="noopener noreferrer"
                className="aura-cta w-full justify-center sm:w-auto"
              >
                <PhoneCall className="h-4 w-4" /> Agendar demo personalizada
              </a>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute -top-6 right-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur">
              SLA 99.98% monitoreado 24/7
            </div>
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_140px_rgba(2,6,23,0.75)] backdrop-blur">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Bitácora en vivo</span>
                <span>Implementaciones recientes</span>
              </div>
              <div className="mt-5 space-y-4">
                {successStories.slice(0, 3).map((story) => {
                  const Icon = story.icon
                  const iconTheme = getStoryIconTheme(story.accent)

                  return (
                    <div key={story.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ${iconTheme.background} ${iconTheme.ring}`}
                        >
                          <Icon className={`h-6 w-6 ${iconTheme.icon}`} />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/40">{story.clinic}</p>
                          <p className="text-base font-semibold text-white">{story.title.split(':')[0]}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                        <span>{story.location}</span>
                        <span>
                          {story.doctors} {story.doctors === 1 ? 'doctor' : 'doctores'}
                        </span>
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-[#040a1c] px-4 py-2 text-[11px] text-emerald-200">
                        {story.duration}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-6 text-xs text-white/50">Cada caso incluye migración de datos, automatizaciones y playbook financiero.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-16">
        {successStories.map((story) => {
          const Icon = story.icon
          const iconTheme = getStoryIconTheme(story.accent)

          return (
            <article
              key={story.title}
              className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_45px_160px_rgba(2,6,23,0.75)] backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-[150px]" />
                <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-blue-500/20 blur-[170px]" />
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.85fr]">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ring-1 ring-inset ${iconTheme.background} ${iconTheme.ring}`}
                    >
                      <Icon className={`h-8 w-8 ${iconTheme.icon}`} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Caso destacado</p>
                      <h2 className="text-2xl font-semibold text-white">{story.title}</h2>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <span className="glass-chip border-white/20 bg-white/5 text-xs text-white">{story.clinic}</span>
                      <span className="glass-chip border-white/20 bg-white/5 text-xs text-white">
                        {story.doctors} {story.doctors === 1 ? 'doctor' : 'doctores'}
                      </span>
                      <span className="glass-chip border-white/20 bg-white/5 text-xs text-white">{story.location}</span>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-rose-200">Desafío</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{story.challenge}</p>
                    </div>
                    <div className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-5">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-sky-200">Solución implementada</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{story.solution}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm text-white/70">&ldquo;{story.testimonial}&rdquo;</p>
                    <p className="mt-3 text-xs font-semibold text-emerald-200">— {story.author}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">Resultados medidos</p>
                    <p className="mt-2 text-sm text-white/70">
                      Indicadores automatizados desde reportes de ingresos, módulos de inventario y asistentes de agenda.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {story.results.map((result) => {
                        const Icon = result.icon
                        return (
                          <div
                            key={`${story.title}-${result.metric}`}
                            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradientByColor[result.color] ?? 'from-white/5 to-transparent'} p-4`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Impacto</p>
                              <Icon className={`h-5 w-5 ${iconByColor[result.color] ?? 'text-white/80'}`} />
                            </div>
                            <p className="mt-3 text-2xl font-semibold text-white">{result.metric}</p>
                            <p className="text-sm text-white/70">{result.description}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 p-5 text-sm text-white/70">
                    <p className="font-semibold text-white">Playbook operativo</p>
                    <p className="mt-1">
                      {story.duration}. Incluye migración, entrenamiento para staff y dashboards listos para auditoría financiera.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-300/30 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-blue-600/20 p-10 text-center shadow-[0_55px_160px_rgba(1,10,30,0.65)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] opacity-60" />
          <div className="relative space-y-5">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-100">Implementación premium</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">¿Listo para tu propia historia de éxito?</h2>
            <p className="text-lg text-white/80">
              Onboarding guiado, reportes financieros listos para inversionistas y soporte cara a cara en cada iteración.
            </p>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
              <Link href="/#pricing" className="aura-cta aura-cta--primary justify-center px-8 text-base">
                Explorar planes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/522223404585?text=Hola,%20quiero%20una%20demo%20personalizada%20de%20AgendaMedPro"
                target="_blank"
                rel="noopener noreferrer"
                className="aura-cta aura-cta--ghost justify-center px-8 text-base"
              >
                <PhoneCall className="h-4 w-4" /> Hablar con nuestro equipo
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm font-semibold text-white/60 transition hover:text-white">
            ← Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
