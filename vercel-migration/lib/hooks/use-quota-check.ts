'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  getQuotaUsage, 
  canAddDoctor, 
  canAddLocation,
  type QuotaUsage, 
  type QuotaCheckResult 
} from '@/lib/subscription/quota-service'

export interface UseQuotaCheckReturn {
  usage: QuotaUsage | null
  loading: boolean
  error: string | null
  checkCanAddDoctor: () => Promise<QuotaCheckResult>
  checkCanAddLocation: () => Promise<QuotaCheckResult>
  refresh: () => Promise<void>
}

/**
 * Hook para verificar cuotas de suscripción en tiempo real
 */
export function useQuotaCheck(): UseQuotaCheckReturn {
  const [usage, setUsage] = useState<QuotaUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID from Supabase
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const quotaUsage = await getQuotaUsage(userId)
      setUsage(quotaUsage)
    } catch (err) {
      console.error('Error fetching quota usage:', err)
      setError('Error al cargar información de tu plan')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const checkCanAddDoctor = useCallback(async (): Promise<QuotaCheckResult> => {
    if (!userId) {
      return {
        allowed: false,
        message: 'No se pudo verificar tu sesión',
      }
    }

    const result = await canAddDoctor(userId)
    
    // Refresh usage después de la verificación
    if (result.usage) {
      setUsage(result.usage)
    }

    return result
  }, [userId])

  const checkCanAddLocation = useCallback(async (): Promise<QuotaCheckResult> => {
    if (!userId) {
      return {
        allowed: false,
        message: 'No se pudo verificar tu sesión',
      }
    }

    const result = await canAddLocation(userId)
    
    // Refresh usage después de la verificación
    if (result.usage) {
      setUsage(result.usage)
    }

    return result
  }, [userId])

  return {
    usage,
    loading,
    error,
    checkCanAddDoctor,
    checkCanAddLocation,
    refresh,
  }
}

/**
 * Hook simplificado para solo obtener el uso de cuotas
 */
export function useQuotaUsage() {
  const { usage, loading, error, refresh } = useQuotaCheck()
  
  return {
    usage,
    loading,
    error,
    refresh,
  }
}
