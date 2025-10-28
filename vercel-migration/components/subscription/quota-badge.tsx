'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Users, Building2 } from 'lucide-react'
import { type QuotaUsage, getQuotaPercentage, getUsageBadgeColor, isNearLimit } from '@/lib/subscription/quota-service'
import { cn } from '@/lib/utils'

interface QuotaBadgeProps {
  usage: QuotaUsage
  type: 'doctors' | 'locations'
  className?: string
  showIcon?: boolean
  showPercentage?: boolean
}

export function QuotaBadge({ usage, type, className, showIcon = true, showPercentage = false }: QuotaBadgeProps) {
  const current = type === 'doctors' ? usage.current_doctors : usage.current_locations
  const max = type === 'doctors' ? usage.max_doctors : usage.max_locations
  const percentage = getQuotaPercentage(current, max)
  const nearLimit = isNearLimit(current, max)
  const atLimit = current >= max

  const Icon = type === 'doctors' ? Users : Building2
  const label = type === 'doctors' ? 'Doctores' : 'Consultorios'

  const badgeColor = getUsageBadgeColor(percentage)
  const variant = badgeColor === 'warning' ? 'default' : (badgeColor as 'default' | 'destructive')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              'gap-1.5 cursor-help',
              atLimit && 'bg-red-100 text-red-900 border-red-300',
              nearLimit && !atLimit && 'bg-yellow-100 text-yellow-900 border-yellow-300',
              className
            )}
          >
            {showIcon && <Icon className="w-3 h-3" />}
            <span>
              {current}/{max}
            </span>
            {showPercentage && (
              <span className="text-xs opacity-70">
                ({percentage}%)
              </span>
            )}
            {atLimit && <AlertTriangle className="w-3 h-3" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{label}</p>
            <p className="text-sm">
              Estás usando {current} de {max} disponibles
            </p>
            {nearLimit && !atLimit && (
              <p className="text-xs text-yellow-600">
                ⚠️ Cerca del límite ({percentage}%)
              </p>
            )}
            {atLimit && (
              <p className="text-xs text-red-600">
                🚫 Límite alcanzado. Actualiza tu plan.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface QuotaSummaryProps {
  usage: QuotaUsage
  className?: string
}

export function QuotaSummary({ usage, className }: QuotaSummaryProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <QuotaBadge usage={usage} type="doctors" />
      <QuotaBadge usage={usage} type="locations" />
    </div>
  )
}
