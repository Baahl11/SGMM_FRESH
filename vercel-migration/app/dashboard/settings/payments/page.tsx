'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface ConnectAccountStatus {
  has_account: boolean
  account_id?: string
  onboarding_completed: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements?: any
}

export default function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    fetchConnectStatus()
  }, [])

  const fetchConnectStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/connect/onboard')
      if (res.ok) {
        const data = await res.json()
        setConnectStatus(data)
      }
    } catch (error) {
      console.error('Error fetching Connect status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    try {
      setOnboarding(true)
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to create onboarding link')
      }

      const { onboarding_url } = await res.json()
      
      // Redirigir a Stripe
      window.location.href = onboarding_url
    } catch (error: any) {
      console.error('Error starting onboarding:', error)
      alert('Error al iniciar configuración: ' + error.message)
      setOnboarding(false)
    }
  }

  const handleOpenDashboard = async () => {
    try {
      const res = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to create dashboard link')
      }

      const { dashboard_url } = await res.json()
      window.open(dashboard_url, '_blank')
    } catch (error: any) {
      console.error('Error opening dashboard:', error)
      alert('Error al abrir dashboard: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración de Pagos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta tu cuenta de Stripe para recibir pagos de depósitos directamente
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Stripe Connect
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recibe pagos de tus pacientes
              </p>
            </div>
          </div>

          {connectStatus?.onboarding_completed && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-4 h-4 mr-1" />
              Activo
            </Badge>
          )}
        </div>

        {/* Estado de la cuenta */}
        {!connectStatus?.has_account && (
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              No tienes una cuenta de Stripe Connect configurada. Necesitas conectar tu cuenta para recibir pagos de depósitos.
            </AlertDescription>
          </Alert>
        )}

        {connectStatus?.has_account && !connectStatus.onboarding_completed && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900 dark:text-orange-100">
              Tu cuenta de Stripe está creada pero necesitas completar la configuración.
            </AlertDescription>
          </Alert>
        )}

        {/* Beneficios */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            ¿Por qué conectar Stripe?
          </h3>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Recibe pagos directamente</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los depósitos de tus pacientes llegan directo a tu cuenta
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Comisión transparente</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solo pagas 3% + $5 MXN por cada depósito procesado
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Pagos automáticos</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transferencias automáticas a tu cuenta bancaria
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Status */}
        {connectStatus?.has_account && (
          <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuración completada
              </span>
              {connectStatus.onboarding_completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pagos habilitados
              </span>
              {connectStatus.charges_enabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Retiros habilitados
              </span>
              {connectStatus.payouts_enabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ID de cuenta
              </span>
              <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                {connectStatus.account_id?.slice(0, 12)}...
              </code>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!connectStatus?.has_account || !connectStatus.onboarding_completed ? (
            <Button
              onClick={handleStartOnboarding}
              disabled={onboarding}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              size="lg"
            >
              {onboarding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {connectStatus?.has_account ? 'Completar Configuración' : 'Conectar Stripe'}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleOpenDashboard}
              variant="outline"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Dashboard de Stripe
            </Button>
          )}

          {connectStatus?.has_account && !connectStatus.onboarding_completed && (
            <Button
              onClick={fetchConnectStatus}
              variant="ghost"
              size="lg"
            >
              Actualizar Estado
            </Button>
          )}
        </div>
      </Card>

      {/* Info adicional */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          ℹ️ Información importante
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>El proceso de configuración toma aproximadamente 5 minutos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Necesitarás tu RFC, CLABE bancaria y una identificación oficial</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>La plataforma cobra 3% + $5 MXN por cada depósito procesado</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Los pagos llegan a tu cuenta en 2-3 días hábiles</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
