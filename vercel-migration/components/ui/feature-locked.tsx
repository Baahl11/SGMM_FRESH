'use client'

import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FeatureLockedProps {
  feature: string
  requiredPlan: 'pro' | 'enterprise'
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEATURE_NAMES: Record<string, string> = {
  inventory: 'Control de Inventario',
  expenses: 'Control de Gastos',
  bundles_discounts: 'Bundles y Descuentos',
  commissions: 'Sistema de Comisiones',
  sms_whatsapp: 'Mensajería SMS/WhatsApp',
  advanced_reports: 'Reportes Avanzados',
  patient_tags: 'Tags de Pacientes',
  file_uploads: 'Upload de Archivos',
  multi_location: 'Multi-Ubicación',
  api_access: 'Acceso API',
  custom_integrations: 'Integraciones Personalizadas',
  priority_support: 'Soporte Prioritario 24/7',
  account_manager: 'Gerente de Cuenta Dedicado',
  onsite_training: 'Capacitación Presencial',
  white_label: 'White Label',
}

const PLAN_INFO = {
  pro: {
    name: 'Plan Pro',
    price: '$1,499 MXN/mes',
    features: [
      'Hasta 10 doctores',
      '5 consultorios',
      'Inventario completo',
      'Control de gastos',
      'Bundles y descuentos',
      'Mensajería SMS/WhatsApp',
      'Reportes avanzados',
    ],
  },
  enterprise: {
    name: 'Plan Enterprise',
    price: '$2,999 MXN/mes',
    features: [
      'Doctores ilimitados',
      'Consultorios ilimitados',
      'Multi-ubicación',
      'Acceso API',
      'Soporte 24/7',
      'Gerente de cuenta',
      'Capacitación presencial',
    ],
  },
}

export function FeatureLocked({ feature, requiredPlan, open, onOpenChange }: FeatureLockedProps) {
  const router = useRouter()
  const featureName = FEATURE_NAMES[feature] || 'Esta función'
  const planInfo = PLAN_INFO[requiredPlan]

  const handleUpgrade = () => {
    router.push(`/pricing?plan=${requiredPlan}&feature=${feature}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-7 w-7 text-yellow-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Función Disponible en {planInfo.name}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            <strong className="text-lg text-gray-900">{featureName}</strong> requiere el{' '}
            <strong className="text-blue-600">{planInfo.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Precio */}
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{planInfo.price}</p>
            <p className="text-sm text-gray-600 mt-1">+ 7 días de prueba gratis</p>
          </div>

          {/* Features incluidas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-3">Incluye:</p>
            <ul className="space-y-2">
              {planInfo.features.map((feat, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleUpgrade} size="lg" className="w-full">
              Ver Planes y Actualizar
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
