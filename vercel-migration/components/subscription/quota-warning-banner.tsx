'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Ban, ArrowUpRight, X } from 'lucide-react'
import { useQuotaUsage } from '@/lib/hooks/use-quota-check'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function QuotaWarningBanner() {
  const { usage, loading } = useQuotaUsage()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (loading || !usage || dismissed) return null

  const doctorsPercentage = (usage.current_doctors / usage.max_doctors) * 100
  const locationsPercentage = (usage.current_locations / usage.max_locations) * 100

  // Solo mostrar si alguno está >= 90%
  const showDoctorsWarning = doctorsPercentage >= 90
  const showLocationsWarning = locationsPercentage >= 90

  if (!showDoctorsWarning && !showLocationsWarning) return null

  const isBlocked = doctorsPercentage >= 100 || locationsPercentage >= 100
  const isUrgent = (doctorsPercentage >= 90 && doctorsPercentage < 100) || 
                   (locationsPercentage >= 90 && locationsPercentage < 100)

  const getNextPlan = () => {
    if (usage.plan_tier === 'basico') return 'Pro'
    if (usage.plan_tier === 'pro') return 'Enterprise'
    return null
  }

  const nextPlan = getNextPlan()

  const handleUpgrade = () => {
    const planParam = usage.plan_tier === 'basico' ? 'pro' : 'enterprise'
    window.location.href = `/#pricing?plan=${planParam}`
  }

  // Blocked state (100%)
  if (isBlocked) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mx-4 md:mx-6 mt-4"
        >
          <Alert 
            variant="destructive" 
            className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-300 dark:border-red-800 shadow-lg relative overflow-hidden"
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-rose-100/50 dark:from-red-900/20 dark:to-rose-900/20"
              animate={{
                x: ['0%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <div className="relative flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <Ban className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-red-900 dark:text-red-100 font-bold text-base mb-1">
                    🚨 Límite de plan alcanzado
                  </AlertTitle>
                  <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                    {doctorsPercentage >= 100 && (
                      <span>Has alcanzado el límite de <strong>{usage.max_doctors} doctores</strong>. </span>
                    )}
                    {locationsPercentage >= 100 && (
                      <span>Has alcanzado el límite de <strong>{usage.max_locations} consultorios</strong>. </span>
                    )}
                    {nextPlan && (
                      <span>Actualiza a <strong>Plan {nextPlan}</strong> para continuar agregando recursos.</span>
                    )}
                  </AlertDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {nextPlan ? `Actualizar a ${nextPlan}` : 'Ver Planes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/dashboard/settings/subscription')}
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300"
                    >
                      Gestionar Plan
                    </Button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Urgent warning (90-99%)
  if (isUrgent) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mx-4 md:mx-6 mt-4"
        >
          <Alert className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-300 dark:border-orange-800 shadow-lg relative overflow-hidden">
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-orange-100/50 dark:bg-orange-900/20"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-orange-900 dark:text-orange-100 font-bold text-base mb-1">
                    ⚠️ Acercándose al límite
                  </AlertTitle>
                  <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
                    {showDoctorsWarning && (
                      <div className="mb-1">
                        Doctores: <strong>{usage.current_doctors}/{usage.max_doctors}</strong>
                        {' '}({Math.round(doctorsPercentage)}% usado)
                        {doctorsPercentage < 100 && (
                          <span className="text-orange-700 dark:text-orange-300 font-medium">
                            {' '}• {usage.max_doctors - usage.current_doctors} disponibles
                          </span>
                        )}
                      </div>
                    )}
                    {showLocationsWarning && (
                      <div className="mb-1">
                        Consultorios: <strong>{usage.current_locations}/{usage.max_locations}</strong>
                        {' '}({Math.round(locationsPercentage)}% usado)
                        {locationsPercentage < 100 && (
                          <span className="text-orange-700 dark:text-orange-300 font-medium">
                            {' '}• {usage.max_locations - usage.current_locations} disponibles
                          </span>
                        )}
                      </div>
                    )}
                    {nextPlan && (
                      <p className="mt-1">
                        Considera actualizar a <strong>Plan {nextPlan}</strong> para tener más espacio.
                      </p>
                    )}
                  </AlertDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {nextPlan ? `Ver Plan ${nextPlan}` : 'Ver Planes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDismissed(true)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300"
                    >
                      Entendido
                    </Button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}
