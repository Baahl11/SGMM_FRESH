'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type PlanTier = 'basico' | 'pro' | 'enterprise'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string
  plan_tier: PlanTier
  max_doctors: number
  max_locations: number
  features: string[]
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          // Si no existe suscripción, no es un error crítico
          if (fetchError.code === 'PGRST116') {
            setSubscription(null)
          } else {
            setError(fetchError.message)
          }
        } else {
          setSubscription(data as Subscription)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  /**
   * Verificar si el usuario tiene acceso a un feature específico
   */
  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false
    
    // Si tiene el feature 'all', tiene acceso a todo
    if (subscription.features.includes('all')) return true
    
    return subscription.features.includes(feature)
  }

  /**
   * Verificar si el usuario puede agregar más doctores
   */
  const canAddDoctor = async (): Promise<boolean> => {
    if (!subscription) return false
    
    const supabase = createClient()
    const { count } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })

    return (count || 0) < subscription.max_doctors
  }

  /**
   * Verificar si el usuario puede agregar más consultorios
   */
  const canAddLocation = async (): Promise<boolean> => {
    if (!subscription) return false
    
    const supabase = createClient()
    const { count } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })

    return (count || 0) < subscription.max_locations
  }

  /**
   * Obtener el nombre legible del plan
   */
  const getPlanName = (): string => {
    switch (subscription?.plan_tier) {
      case 'basico':
        return 'Plan Básico'
      case 'pro':
        return 'Plan Pro'
      case 'enterprise':
        return 'Plan Enterprise'
      default:
        return 'Sin Plan'
    }
  }

  /**
   * Obtener el precio del plan en formato legible
   */
  const getPlanPrice = (): string => {
    switch (subscription?.plan_tier) {
      case 'basico':
        return '$499/mes'
      case 'pro':
        return '$999/mes'
      case 'enterprise':
        return '$2,999/mes'
      default:
        return 'Gratis'
    }
  }

  /**
   * Verificar si está en trial
   */
  const isInTrial = (): boolean => {
    if (!subscription) return false
    return subscription.status === 'trialing'
  }

  /**
   * Obtener días restantes de trial
   */
  const getTrialDaysRemaining = (): number | null => {
    if (!subscription || !subscription.trial_end) return null
    
    const trialEnd = new Date(subscription.trial_end)
    const now = new Date()
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  return {
    subscription,
    loading,
    error,
    hasFeature,
    canAddDoctor,
    canAddLocation,
    getPlanName,
    getPlanPrice,
    isInTrial,
    getTrialDaysRemaining,
    isActive: subscription?.status === 'active',
    isTrialing: subscription?.status === 'trialing',
    isPastDue: subscription?.status === 'past_due',
    isCanceled: subscription?.status === 'canceled',
    planTier: subscription?.plan_tier || 'basico',
  }
}
