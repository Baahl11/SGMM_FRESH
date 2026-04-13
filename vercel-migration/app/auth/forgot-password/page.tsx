'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError('No pudimos enviar el correo. Verifica que el email es correcto.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030614] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link href="/auth/signin" className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
          </Link>

          {sent ? (
            <div className="rounded-[32px] border border-emerald-400/30 bg-emerald-400/5 p-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
              <h1 className="mt-6 text-2xl font-semibold">Revisa tu email</h1>
              <p className="mt-3 text-white/70">
                Enviamos un enlace de recuperación a <strong className="text-white">{email}</strong>.
                Revisa también tu carpeta de spam.
              </p>
              <p className="mt-6 text-sm text-white/50">
                El enlace expira en 10 minutos.
              </p>
              <Link
                href="/auth/signin"
                className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
              >
                ← Regresar al login
              </Link>
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <Mail className="h-7 w-7 text-white/80" />
              </div>
              <h1 className="mt-6 text-2xl font-semibold">Recupera tu contraseña</h1>
              <p className="mt-2 text-sm text-white/60">
                Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="aura-cta aura-cta--primary w-full justify-center"
                >
                  {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030614]" />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
