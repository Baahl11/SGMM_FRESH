/**
 * Configuración de Stripe compartida entre cliente y servidor
 * NO incluye secretos ni instancias de Stripe
 */

export type PlanTier = 'basico' | 'pro' | 'enterprise'

/**
 * Configuración de features por plan
 */
export const PLAN_FEATURES = {
  basico: {
    max_doctors: 2,
    max_locations: 1,
    features: [
      'agenda_4_views',
      'patients_basic',
      'treatments_basic',
      'appointments',
      'basic_reports',
      'email_notifications',
    ],
  },
  pro: {
    max_doctors: 10,
    max_locations: 5,
    features: [
      'agenda_4_views',
      'patients_basic',
      'treatments_basic',
      'appointments',
      'basic_reports',
      'email_notifications',
      'inventory',
      'expenses',
      'bundles_discounts',
      'commissions',
      'sms_whatsapp',
      'advanced_reports',
      'patient_tags',
      'file_uploads',
    ],
  },
  enterprise: {
    max_doctors: 999, // "Ilimitado"
    max_locations: 999,
    features: [
      'all', // Enterprise tiene acceso a todo
      'multi_location',
      'api_access',
      'custom_integrations',
      'priority_support',
      'account_manager',
      'onsite_training',
      'white_label',
    ],
  },
} as const

/**
 * Helper para verificar si un feature está disponible en un plan
 */
export function hasFeature(planTier: PlanTier, feature: string): boolean {
  const planConfig = PLAN_FEATURES[planTier]
  const features = planConfig.features as readonly string[]
  
  // Enterprise tiene acceso a todo
  if (features.includes('all')) {
    return true
  }
  
  return features.includes(feature)
}

/**
 * Helper para obtener límites de un plan
 */
export function getPlanLimits(planTier: PlanTier) {
  return {
    max_doctors: PLAN_FEATURES[planTier].max_doctors,
    max_locations: PLAN_FEATURES[planTier].max_locations,
  }
}
