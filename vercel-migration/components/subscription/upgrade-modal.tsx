'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, Check, Crown, Zap } from 'lucide-react'
import { type PlanTier } from '@/lib/stripe/config'
import { getPlanDisplayName } from '@/lib/subscription/quota-service'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: PlanTier
  limitType: 'doctors' | 'locations'
  currentCount: number
  maxCount: number
}

const PLAN_PRICES = {
  basico: 499,
  pro: 999,
  enterprise: 2999,
}

const PLAN_FEATURES = {
  basico: {
    doctors: 2,
    locations: 1,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
  },
  pro: {
    doctors: 10,
    locations: 5,
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
  },
  enterprise: {
    doctors: 999,
    locations: 999,
    icon: Crown,
    color: 'from-orange-500 to-red-500',
  },
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  limitType,
  currentCount,
  maxCount,
}: UpgradeModalProps) {
  const limitTypeName = limitType === 'doctors' ? 'doctores' : 'consultorios'
  const nextPlan = currentPlan === 'basico' ? 'pro' : 'enterprise'
  const nextPlanFeatures = PLAN_FEATURES[nextPlan]
  const NextPlanIcon = nextPlanFeatures.icon

  const handleUpgrade = () => {
    // Redirigir a la página de pricing con el plan pre-seleccionado
    window.location.href = `/#pricing?plan=${nextPlan}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${nextPlanFeatures.color}`}>
              <NextPlanIcon className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl">
              Límite alcanzado
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Has alcanzado el límite de tu plan <Badge variant="outline">{getPlanDisplayName(currentPlan)}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current limit info */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">
                Uso actual
              </span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-900">
                {currentCount}/{maxCount} {limitTypeName}
              </Badge>
            </div>
            <p className="text-sm text-orange-700">
              Tu plan actual permite hasta <strong>{maxCount} {limitTypeName}</strong> y ya tienes <strong>{currentCount}</strong> configurados.
            </p>
          </div>

          {/* Upgrade suggestion */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">
                Actualiza a {getPlanDisplayName(nextPlan)}
              </h4>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-purple-800">
                <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                <span>
                  Hasta <strong>{nextPlanFeatures.doctors} {nextPlanFeatures.doctors === 999 ? 'doctores ilimitados' : 'doctores'}</strong>
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-purple-800">
                <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                <span>
                  Hasta <strong>{nextPlanFeatures.locations} {nextPlanFeatures.locations === 999 ? 'consultorios ilimitados' : 'consultorios'}</strong>
                </span>
              </li>
              {nextPlan === 'pro' && (
                <>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>Inventario médico completo</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>Reportes avanzados</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>WhatsApp y SMS</span>
                  </li>
                </>
              )}
              {nextPlan === 'enterprise' && (
                <>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>Multi-ubicación</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>API personalizada</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-purple-800">
                    <Check className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>Soporte 24/7</span>
                  </li>
                </>
              )}
            </ul>

            <div className="flex items-baseline gap-1 text-purple-900">
              <span className="text-3xl font-bold">${PLAN_PRICES[nextPlan]}</span>
              <span className="text-sm">MXN/mes</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Actualizar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
