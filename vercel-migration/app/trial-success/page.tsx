'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

function TrialSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [countdown, setCountdown] = useState(8)
  const [syncState, setSyncState] = useState<'pending' | 'ok' | 'error'>('pending')
  const syncAttempted = useRef(false)

  useEffect(() => {
    if (syncAttempted.current) return
    syncAttempted.current = true

    // Sync the subscription with the DB before redirecting.
    // This is a fallback in case the Stripe webhook hasn't fired yet.
    const syncSubscription = async () => {
      if (!sessionId) {
        setSyncState('ok')
        return
      }
      try {
        const res = await fetch('/api/stripe/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
        if (res.ok) {
          setSyncState('ok')
        } else {
          const data = await res.json().catch(() => ({}))
          console.warn('[trial-success] sync-session returned non-ok', data)
          // Still proceed — webhook may arrive shortly
          setSyncState('ok')
        }
      } catch (err) {
        console.error('[trial-success] sync-session fetch failed', err)
        // Don't block user; show success and redirect anyway
        setSyncState('ok')
      }
    }

    syncSubscription()
  }, [sessionId])

  useEffect(() => {
    if (syncState !== 'ok') return

    // Lanzar confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // Countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/welcome')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [syncState, router])

  if (syncState === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-10 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Activando tu trial…</p>
          <p className="text-sm text-gray-500 mt-2">Esto solo toma unos segundos</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Bienvenido a AgendaMedPro! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Tu prueba gratis de 14 días ha comenzado
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">14 Días Gratis</h3>
            <p className="text-sm text-gray-600">
              Acceso completo a todas las funcionalidades hasta el {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Sin Cargo Hoy</h3>
            <p className="text-sm text-gray-600">
              Tu primer pago será el día 15. Cancela cuando quieras sin costo.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">🚀 Próximos Pasos</h3>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">1.</span>
              <span>Configura tu perfil y horarios de atención</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">2.</span>
              <span>Agrega tus primeros pacientes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">3.</span>
              <span>Crea tu primera cita</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">4.</span>
              <span>Explora reportes y estadísticas</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/welcome')}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Ir a Mi Agenda
          </Button>
          <p className="text-sm text-gray-500">
            Redirigiendo automáticamente en {countdown} segundos...
          </p>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta a soporte en{' '}
            <a href="mailto:soporte@agendamedpro.com" className="text-purple-600 hover:underline">
              soporte@agendamedpro.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function TrialSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <TrialSuccessContent />
    </Suspense>
  )
}
