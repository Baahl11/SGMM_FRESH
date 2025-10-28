/**
 * Quota Service - SERVER SIDE
 * Validación de límites de planes para API routes y Server Components
 */

import { createClient } from '@/lib/supabase/server'
import { PLAN_FEATURES, type PlanTier } from '@/lib/stripe/server'

export interface QuotaCheckResult {
  allowed: boolean
  message: string
  current: number
  max: number
}

/**
 * Obtiene el plan actual del usuario (SERVER SIDE)
 */
async function getUserPlan(userId: string) {
  const supabase = await createClient()
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan_tier, max_doctors, max_locations, status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single()

  if (error || !subscription) {
    // Retornar plan básico por defecto si no hay suscripción
    return {
      plan_tier: 'basico' as PlanTier,
      max_doctors: PLAN_FEATURES.basico.max_doctors,
      max_locations: PLAN_FEATURES.basico.max_locations,
    }
  }

  return {
    plan_tier: subscription.plan_tier as PlanTier,
    max_doctors: subscription.max_doctors || PLAN_FEATURES[subscription.plan_tier as PlanTier].max_doctors,
    max_locations: subscription.max_locations || PLAN_FEATURES[subscription.plan_tier as PlanTier].max_locations,
  }
}

/**
 * Cuenta el número actual de doctores del usuario (SERVER SIDE)
 */
async function countUserDoctors(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activo', true)

  if (error) {
    console.error('Error counting doctors:', error)
    return 0
  }

  return count || 0
}

/**
 * Cuenta el número actual de consultorios del usuario (SERVER SIDE)
 */
async function countUserLocations(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('consultorios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activo', true)

  if (error) {
    console.error('Error counting consultorios:', error)
    return 0
  }

  return count || 0
}

/**
 * Verifica si el usuario puede añadir un doctor (SERVER SIDE - para API routes)
 */
export async function canAddDoctor(userId: string): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId)
  const currentCount = await countUserDoctors(userId)

  const allowed = currentCount < plan.max_doctors

  return {
    allowed,
    message: allowed 
      ? 'Puedes añadir un doctor' 
      : `Has alcanzado el límite de ${plan.max_doctors} doctores en tu plan ${plan.plan_tier}. Actualiza tu plan para añadir más.`,
    current: currentCount,
    max: plan.max_doctors
  }
}

/**
 * Verifica si el usuario puede añadir un consultorio (SERVER SIDE - para API routes)
 */
export async function canAddLocation(userId: string): Promise<QuotaCheckResult> {
  const plan = await getUserPlan(userId)
  const currentCount = await countUserLocations(userId)

  const allowed = currentCount < plan.max_locations

  return {
    allowed,
    message: allowed 
      ? 'Puedes añadir un consultorio' 
      : `Has alcanzado el límite de ${plan.max_locations} consultorios en tu plan ${plan.plan_tier}. Actualiza tu plan para añadir más.`,
    current: currentCount,
    max: plan.max_locations
  }
}
