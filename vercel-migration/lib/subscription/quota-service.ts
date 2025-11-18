/**
 * Quota Service - Validación de límites de planes
 * Verifica que los usuarios no excedan los límites de su suscripción
 */

import { createClient } from '@/lib/supabase/client'
import { PLAN_FEATURES, type PlanTier } from '@/lib/stripe/config'

export interface QuotaUsage {
  current_doctors: number
  max_doctors: number
  current_locations: number
  max_locations: number
  plan_tier: PlanTier
  can_add_doctor: boolean
  can_add_location: boolean
}

export interface QuotaCheckResult {
  allowed: boolean
  message?: string
  usage?: QuotaUsage
}

/**
 * Obtiene el plan actual del usuario
 */
export async function getUserPlan(userId: string): Promise<{ plan_tier: PlanTier; max_doctors: number; max_locations: number } | null> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return null
  }
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan_tier, max_doctors, max_locations, status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle to handle 0 or 1 result gracefully

  if (error || !subscription) {
    console.error('Error fetching user subscription:', error)
    return null
  }

  return {
    plan_tier: subscription.plan_tier as PlanTier,
    max_doctors: subscription.max_doctors || PLAN_FEATURES[subscription.plan_tier as PlanTier].max_doctors,
    max_locations: subscription.max_locations || PLAN_FEATURES[subscription.plan_tier as PlanTier].max_locations,
  }
}

/**
 * Cuenta el número actual de doctores del usuario
 */
export async function countUserDoctors(userId: string): Promise<number> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return 0
  }
  
  const { count, error } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting doctors:', error)
    return 0
  }

  return count || 0
}

/**
 * Cuenta el número actual de consultorios del usuario
 */
export async function countUserLocations(userId: string): Promise<number> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return 0
  }
  
  const { count, error } = await supabase
    .from('consultorios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting locations:', error)
    return 0
  }

  return count || 0
}

/**
 * Obtiene el uso completo de cuotas del usuario
 */
export async function getQuotaUsage(userId: string): Promise<QuotaUsage | null> {
  const plan = await getUserPlan(userId)
  
  if (!plan) {
    return null
  }

  const [currentDoctors, currentLocations] = await Promise.all([
    countUserDoctors(userId),
    countUserLocations(userId),
  ])

  return {
    current_doctors: currentDoctors,
    max_doctors: plan.max_doctors,
    current_locations: currentLocations,
    max_locations: plan.max_locations,
    plan_tier: plan.plan_tier,
    can_add_doctor: currentDoctors < plan.max_doctors,
    can_add_location: currentLocations < plan.max_locations,
  }
}

/**
 * Verifica si el usuario puede agregar un doctor
 */
export async function canAddDoctor(userId: string): Promise<QuotaCheckResult> {
  const usage = await getQuotaUsage(userId)
  
  if (!usage) {
    return {
      allowed: false,
      message: 'No se pudo verificar tu plan. Por favor contacta a soporte.',
    }
  }

  if (usage.can_add_doctor) {
    return {
      allowed: true,
      usage,
    }
  }

  return {
    allowed: false,
    message: `Has alcanzado el límite de ${usage.max_doctors} doctores de tu plan ${usage.plan_tier.toUpperCase()}. Actualiza tu plan para agregar más doctores.`,
    usage,
  }
}

/**
 * Verifica si el usuario puede agregar un consultorio
 */
export async function canAddLocation(userId: string): Promise<QuotaCheckResult> {
  const usage = await getQuotaUsage(userId)
  
  if (!usage) {
    return {
      allowed: false,
      message: 'No se pudo verificar tu plan. Por favor contacta a soporte.',
    }
  }

  if (usage.can_add_location) {
    return {
      allowed: true,
      usage,
    }
  }

  return {
    allowed: false,
    message: `Has alcanzado el límite de ${usage.max_locations} consultorios de tu plan ${usage.plan_tier.toUpperCase()}. Actualiza tu plan para agregar más consultorios.`,
    usage,
  }
}

/**
 * Calcula el porcentaje de uso de una cuota
 */
export function getQuotaPercentage(current: number, max: number): number {
  if (max === 0) return 0
  return Math.round((current / max) * 100)
}

/**
 * Determina si el usuario está cerca del límite (>80%)
 */
export function isNearLimit(current: number, max: number): boolean {
  return getQuotaPercentage(current, max) >= 80
}

/**
 * Obtiene el nombre amigable del plan
 */
export function getPlanDisplayName(planTier: PlanTier): string {
  const names: Record<PlanTier, string> = {
    basico: 'Básico',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }
  return names[planTier] || planTier
}

/**
 * Obtiene el color del badge según el uso
 */
export function getUsageBadgeColor(percentage: number): string {
  if (percentage >= 100) return 'destructive' // Rojo
  if (percentage >= 80) return 'warning' // Amarillo
  return 'default' // Azul/Gris
}
