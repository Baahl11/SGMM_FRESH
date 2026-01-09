import Link from 'next/link'
import { Check, CreditCard, Sparkles } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const steps = [
  {
    title: 'Crea tu cuenta',
    description: 'Registra tus datos para activar tu perfil en AgendaMedPro.'
  },
  {
    title: 'Agrega tu tarjeta',
    description: 'Validamos tu método de pago para habilitar la prueba de 7 días.'
  },
  {
    title: 'Disfruta tu trial',
    description: 'Explora todas las funciones premium. Cancela antes del día 8 si lo necesitas.'
  }
]

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030614] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.25),_transparent_60%)] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          <Badge className="mb-6 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            Trial de 7 días con tarjeta requerida
          </Badge>
          <div className="flex items-center gap-3 text-emerald-200/80">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-[0.4em] uppercase">AgendaMedPro Onboarding</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Activa tu cuenta premium en minutos
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Registramos tus datos, vinculamos tu tarjeta y desbloqueamos el trial completo de 7 días. No se realiza ningún cobro hasta el día 8.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <Check className="h-4 w-4" />
                  {step.title}
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
              <CreditCard className="h-4 w-4 text-emerald-300" />
              Cobro automático solo si continúas después del trial
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
              Cancelación en un clic desde tu panel
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-md lg:mt-0">
          <div className="glass-panel p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-8 w-8 text-emerald-300" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold">Crear cuenta</h2>
              <p className="mt-2 text-sm text-white/70">
                Completa el formulario y continúa a la selección de plan oficial.
              </p>
            </div>

            <Suspense fallback={<SignupForm />}>
              <SignupForm />
            </Suspense>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100">
              Tu trial dura 7 días completos. Solicitamos tu tarjeta en el siguiente paso para garantizar acceso continuo.
            </div>
            <p className="mt-4 text-sm text-white/60">
              También puedes registrarte con Google para acelerar el proceso.
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="aura-cta aura-cta--ghost w-full justify-center text-sm"
              >
                ¿Ya tienes cuenta? Inicia sesión aquí
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            Al crear una cuenta aceptas los términos y condiciones. © {new Date().getFullYear()} AgendaMedPro.
          </p>
        </div>
      </div>
    </div>
  )
}
