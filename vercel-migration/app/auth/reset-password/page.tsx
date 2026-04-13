'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase populates the session from the URL hash after clicking the magic link
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Session is established automatically from the URL token
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      } else {
        setDone(true)
        setTimeout(() => router.push('/dashboard'), 2500)
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
          {done ? (
            <div className="rounded-[32px] border border-emerald-400/30 bg-emerald-400/5 p-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
              <h1 className="mt-6 text-2xl font-semibold">Contraseña actualizada</h1>
              <p className="mt-3 text-white/70">
                Tu contraseña fue cambiada exitosamente. Redirigiendo al dashboard...
              </p>
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck className="h-7 w-7 text-white/80" />
              </div>
              <h1 className="mt-6 text-2xl font-semibold">Crea una nueva contraseña</h1>
              <p className="mt-2 text-sm text-white/60">
                Elige una contraseña segura de al menos 6 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80">
                    Nueva contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-white/80">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  disabled={isLoading || !password || !confirm}
                  className="aura-cta aura-cta--primary w-full justify-center"
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                ¿El enlace expiró?{' '}
                <Link href="/auth/forgot-password" className="text-white/80 underline hover:text-white">
                  Solicitar otro
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030614]" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
