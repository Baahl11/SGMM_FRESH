'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, RotateCw, ShieldCheck } from 'lucide-react'

const toSafeInternalPath = (value: string | null) => {
  if (!value) return '/select-trial-plan'
  if (value.startsWith('http://') || value.startsWith('https://')) return '/select-trial-plan'
  return value.startsWith('/') ? value : `/${value}`
}

function VerifyEmailRequiredContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get('email') || ''
  const plan = searchParams.get('plan')
  const billing = searchParams.get('billing')
  const next = toSafeInternalPath(searchParams.get('next'))

  const [isResending, setIsResending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)

  const signInHref = useMemo(() => {
    const params = new URLSearchParams()
    if (plan === 'pro' || plan === 'enterprise') params.set('plan', plan)
    if (billing === 'monthly' || billing === 'annual') params.set('billing', billing)
    return params.toString() ? `/auth/signin?${params.toString()}` : '/auth/signin'
  }, [plan, billing])

  const handleResendVerification = async () => {
    if (!email) {
      setStatusType('error')
      setStatusMessage('Necesitamos tu correo para reenviar el enlace de verificacion.')
      return
    }

    setIsResending(true)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          next,
          plan,
          billing,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No fue posible reenviar el correo de verificacion.')
      }

      setStatusType('success')
      setStatusMessage('Correo reenviado. Revisa tu bandeja principal y spam.')
    } catch (error) {
      setStatusType('error')
      setStatusMessage((error as Error).message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030614] px-4 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18),_transparent_62%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl items-center justify-center">
        <div className="glass-panel w-full border-white/10 bg-white/[0.03] p-8">
          <div className="text-center">
            <Badge className="mb-4 border border-amber-300/45 bg-amber-300/15 px-4 py-2 text-amber-100">
              Verificacion obligatoria antes de activar trial
            </Badge>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Mail className="h-8 w-8 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-semibold">Verifica tu correo para continuar</h1>
            <p className="mt-3 text-white/70">
              Por seguridad, debes confirmar tu email antes de elegir plan e iniciar el trial.
            </p>
            {email && (
              <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                Correo detectado: <span className="font-semibold text-emerald-200">{email}</span>
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.02] p-4 text-sm text-white/75">
            <p className="font-semibold text-white">Pasos recomendados</p>
            <p className="mt-2">1. Abre tu correo y busca el mensaje de confirmacion.</p>
            <p className="mt-1">2. Haz clic en el enlace de verificacion.</p>
            <p className="mt-1">3. Vuelve a iniciar sesion para continuar con tu activacion.</p>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-200">⚠️ ¿No encuentras el correo?</p>
            <p className="mt-1">Revisa tu carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>. A veces los correos de verificacion caen ahí.</p>
            <p className="mt-1">Si usaste Gmail, busca en <strong>Promociones</strong> o <strong>Actualizaciones</strong>.</p>
            <p className="mt-2">También puedes reenviar el correo usando el botón de abajo.</p>
          </div>

          {statusMessage && (
            <div
              className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                statusType === 'success'
                  ? 'border border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                  : 'border border-red-300/40 bg-red-400/15 text-red-100'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <div className="mt-8 grid gap-3">
            <Button
              onClick={handleResendVerification}
              disabled={isResending || !email}
              className="w-full bg-gradient-to-r from-emerald-300 to-sky-300 font-semibold text-slate-900 hover:opacity-95"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Reenviar correo de verificacion
                </>
              )}
            </Button>

            <Button
              onClick={() => router.push(signInHref)}
              variant="outline"
              className="w-full border-white/30 bg-white/5 text-white hover:bg-white/10"
            >
              Ya verifique mi correo, continuar
            </Button>

            <Link
              href={signInHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Volver a iniciar sesion
            </Link>

            <Link
              href={next}
              className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-transparent px-4 py-2 text-sm text-white/55 transition hover:text-white/80"
            >
              Ir a selección de plan
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/50">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Este control protege el acceso y evita activaciones sin correo validado.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailRequiredPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030614] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
        </div>
      }
    >
      <VerifyEmailRequiredContent />
    </Suspense>
  )
}
