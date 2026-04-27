'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

const REASON_COPY: Record<string, string> = {
  access_denied: 'Google bloqueó o canceló la autenticación. Puedes intentar de nuevo o crear tu cuenta con email.',
  missing_authorization_code: 'No se recibió el código de autenticación de Google.',
  exchange_code_for_session_failed: 'No fue posible crear la sesión después de autenticar con Google.',
  oauth_email_missing: 'Google no devolvió un correo electrónico válido para continuar.',
}

function AuthCodeErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const reason = searchParams.get('reason') || 'unknown'
  const detail = searchParams.get('detail')
  const plan = searchParams.get('plan')
  const billing = searchParams.get('billing')

  const authParams = new URLSearchParams()
  if (plan) authParams.set('plan', plan)
  if (billing) authParams.set('billing', billing)

  const paramsString = authParams.toString()
  const signInHref = paramsString ? `/auth/signin?${paramsString}` : '/auth/signin'
  const signUpHref = paramsString ? `/auth/signup?${paramsString}` : '/auth/signup'

  const reasonCopy = REASON_COPY[reason] || 'Hubo un problema al iniciar sesión con Google. Puedes intentar de nuevo o continuar con registro por email.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error de Autenticación
        </h1>
        
        <p className="text-gray-600 mb-6">
          {reasonCopy}
        </p>

        {detail && (
          <p className="text-xs text-gray-500 mb-6 break-words">
            Detalle técnico: {detail}
          </p>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => router.push(signInHref)}
            className="w-full"
            size="lg"
          >
            Intentar con Google otra vez
          </Button>

          <Button
            onClick={() => router.push(signUpHref)}
            variant="secondary"
            className="w-full"
          >
            Crear cuenta con email
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Volver al Inicio
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Si el problema persiste, contacta a{' '}
            <a href="mailto:soporte@agendamedpro.com" className="text-blue-600 hover:underline">
              soporte@agendamedpro.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Autenticación</h1>
            <p className="text-gray-600">Cargando detalle del error...</p>
          </Card>
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  )
}
