'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  const router = useRouter()

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
          Hubo un problema al iniciar sesión con Google. Por favor, intenta de nuevo.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full"
            size="lg"
          >
            Intentar de Nuevo
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
