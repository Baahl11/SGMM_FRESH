'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, Building2, Crown, ArrowUpRight, Sparkles } from 'lucide-react'
import { useQuotaUsage } from '@/lib/hooks/use-quota-check'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function QuotaSidebarCard() {
  const { usage, loading } = useQuotaUsage()

  if (loading || !usage) {
    return (
      <Card className="mx-4 my-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const doctorsPercentage = (usage.current_doctors / usage.max_doctors) * 100
  const locationsPercentage = (usage.current_locations / usage.max_locations) * 100

  const getDoctorsStatus = () => {
    if (doctorsPercentage >= 100) return { variant: 'destructive' as const, color: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', icon: 'bg-red-500' }
    if (doctorsPercentage >= 80) return { variant: 'warning' as const, color: 'from-yellow-500 to-amber-600', bg: 'from-yellow-50 to-amber-50', icon: 'bg-yellow-500' }
    return { variant: 'default' as const, color: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50', icon: 'bg-emerald-500' }
  }

  const getLocationsStatus = () => {
    if (locationsPercentage >= 100) return { variant: 'destructive' as const, color: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', icon: 'bg-red-500' }
    if (locationsPercentage >= 80) return { variant: 'warning' as const, color: 'from-yellow-500 to-amber-600', bg: 'from-yellow-50 to-amber-50', icon: 'bg-yellow-500' }
    return { variant: 'default' as const, color: 'from-cyan-500 to-blue-600', bg: 'from-cyan-50 to-blue-50', icon: 'bg-cyan-500' }
  }

  const doctorsStatus = getDoctorsStatus()
  const locationsStatus = getLocationsStatus()

  const getPlanGradient = () => {
    switch (usage.plan_tier) {
      case 'enterprise':
        return 'from-orange-50 to-amber-50 border-orange-200'
      case 'pro':
        return 'from-purple-50 to-pink-50 border-purple-200'
      default:
        return 'from-blue-50 to-indigo-50 border-blue-200'
    }
  }

  const getPlanIcon = () => {
    switch (usage.plan_tier) {
      case 'enterprise':
        return 'bg-gradient-to-br from-orange-500 to-amber-600'
      case 'pro':
        return 'bg-gradient-to-br from-purple-500 to-pink-600'
      default:
        return 'bg-gradient-to-br from-blue-500 to-indigo-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "mx-4 my-4 bg-gradient-to-br shadow-sm hover:shadow-lg transition-all duration-300 border",
        getPlanGradient()
      )}>
        <CardContent className="p-4">
          {/* Header - Plan Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", getPlanIcon())}>
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  Plan {usage.plan_tier}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recursos activos</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Activo
            </Badge>
          </div>

          {/* Doctores */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", doctorsStatus.icon)}>
                  <Users className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Doctores
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {usage.current_doctors}/{usage.max_doctors}
              </span>
            </div>
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${doctorsPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn("h-full bg-gradient-to-r rounded-full", doctorsStatus.color)}
              />
            </div>
            {doctorsPercentage >= 80 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                {doctorsPercentage >= 100 ? (
                  <>⛔ Límite alcanzado</>
                ) : (
                  <>⚠️ {usage.max_doctors - usage.current_doctors} disponibles</>
                )}
              </p>
            )}
          </div>

          {/* Consultorios */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", locationsStatus.icon)}>
                  <Building2 className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Consultorios
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {usage.current_locations}/{usage.max_locations}
              </span>
            </div>
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${locationsPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className={cn("h-full bg-gradient-to-r rounded-full", locationsStatus.color)}
              />
            </div>
            {locationsPercentage >= 80 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                {locationsPercentage >= 100 ? (
                  <>⛔ Límite alcanzado</>
                ) : (
                  <>⚠️ {usage.max_locations - usage.current_locations} disponibles</>
                )}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <Link href="/dashboard/settings/subscription">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 group"
            >
              <span>Gestionar Plan</span>
              <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
