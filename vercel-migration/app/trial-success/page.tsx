'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2, Calendar, CreditCard } from 'lucide-react'
import confetti from 'canvas-confetti'

function TrialSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
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
  }, [router])

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
            Tu prueba gratis de 7 días ha comenzado
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">7 Días Gratis</h3>
            <p className="text-sm text-gray-600">
              Acceso completo a todas las funcionalidades hasta el {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Sin Cargo Hoy</h3>
            <p className="text-sm text-gray-600">
              Tu primer pago será el día 8. Cancela cuando quieras sin costo.
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
