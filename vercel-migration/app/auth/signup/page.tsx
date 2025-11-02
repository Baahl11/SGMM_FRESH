import Link from 'next/link'
import { Check, CreditCard, Sparkles } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'
import { Badge } from '@/components/ui/badge'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="max-w-2xl text-white">
          <Badge className="mb-6 bg-green-500 text-white">
            🚀 Trial de 7 días con tarjeta requerida
          </Badge>
          <div className="flex items-center gap-3 text-purple-200">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-wide uppercase">AgendaMedPro Onboarding</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Accede al sistema médico más completo en minutos
          </h1>
          <p className="mt-6 text-lg text-purple-100">
            Regístrate, enlaza tu tarjeta y comienza tu prueba gratuita de 7 días con todas las funcionalidades premium. No se cobrará nada hasta el día 8.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-300">
                  <Check className="h-4 w-4" />
                  {step.title}
                </div>
                <p className="mt-2 text-sm text-purple-100/80">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-purple-200">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <CreditCard className="h-4 w-4" />
              Cobro automático solo si continúas después de la prueba
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              Cancelación en un clic desde tu panel
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-md lg:mt-0">
          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Crear Cuenta</h2>
              <p className="mt-2 text-sm text-gray-500">
                Completa el formulario y continúa a la selección de plan.
              </p>
            </div>

            <SignupForm />

            <div className="mt-6 rounded-xl bg-purple-50 p-4 text-sm text-purple-800">
              Tu trial dura 7 días completos. Se solicitará tu tarjeta en el siguiente paso para activar el acceso sin interrupciones.
            </div>
            <p className="mt-4 text-sm text-gray-500">
              También puedes crear tu cuenta usando Google para acelerar el registro.
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-purple-600 hover:text-purple-500"
              >
                ¿Ya tienes cuenta? Inicia sesión aquí
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/70">
            Al crear una cuenta aceptas los términos y condiciones. © 2025 SGMM Pro.
          </p>
        </div>
      </div>
    </div>
  )
}
