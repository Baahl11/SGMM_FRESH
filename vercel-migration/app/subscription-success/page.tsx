'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/ui/glass-panel'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const attempted = useRef(false)
  const [state, setState] = useState<'syncing' | 'ready' | 'error'>('syncing')

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    if (!sessionId) {
      setState('error')
      return
    }

    void fetch('/api/stripe/sync-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'No se pudo sincronizar la suscripcion')
        }
        setState('ready')
      })
      .catch((error) => {
        console.error('[subscription-success] Sync failed', error)
        setState('error')
      })
  }, [sessionId])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030614] px-4 text-white">
      <GlassPanel className="w-full max-w-xl border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
        {state === 'syncing' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-300" />
            <h1 className="mt-6 text-3xl font-semibold">Activando tu suscripcion</h1>
            <p className="mt-3 text-white/65">Estamos confirmando el pago con Stripe.</p>
          </>
        )}

        {state === 'ready' && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
            <h1 className="mt-6 text-3xl font-semibold">Tu acceso esta activo</h1>
            <p className="mt-3 text-white/65">
              Tu configuracion y datos siguen exactamente donde los dejaste.
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="mt-8 bg-gradient-to-r from-emerald-300 to-sky-300 font-semibold text-slate-900"
            >
              Volver al sistema
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-3xl font-semibold">Estamos confirmando tu pago</h1>
            <p className="mt-3 text-white/65">
              Stripe puede tardar unos segundos. No realices otro pago; vuelve a intentar entrar al sistema.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="mt-8">
              Revisar acceso
            </Button>
          </>
        )}
      </GlassPanel>
    </main>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030614]" />}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}

