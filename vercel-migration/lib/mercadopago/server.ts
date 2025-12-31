import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'dummy-token-for-build';

// Singleton instance de Mercado Pago
export const mercadopago = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
})

export const preferenceClient = new Preference(mercadopago)
export const paymentClient = new Payment(mercadopago)

/**
 * Plan IDs de Mercado Pago (crear estos planes manualmente en MP)
 */
export const MERCADOPAGO_PLANS = {
  // Mensual
  BASICO_MONTHLY: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_MONTHLY || '',
  PRO_MONTHLY: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_MONTHLY || '',
  ENTERPRISE_MONTHLY: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_MONTHLY || '',
  
  // Anual
  BASICO_ANNUAL: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_BASICO_ANNUAL || '',
  PRO_ANNUAL: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_PRO_ANNUAL || '',
  ENTERPRISE_ANNUAL: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_ENTERPRISE_ANNUAL || '',
  
  // Lifetime (pago único)
  LIFETIME: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_LIFETIME || '',
} as const

/**
 * Determinar el tier del plan desde el preapproval_plan_id de Mercado Pago
 */
export function getPlanTierFromMPPlanId(planId: string): 'basico' | 'pro' | 'enterprise' | 'lifetime' {
  if (planId === MERCADOPAGO_PLANS.PRO_MONTHLY || planId === MERCADOPAGO_PLANS.PRO_ANNUAL) {
    return 'pro'
  }
  if (planId === MERCADOPAGO_PLANS.ENTERPRISE_MONTHLY || planId === MERCADOPAGO_PLANS.ENTERPRISE_ANNUAL) {
    return 'enterprise'
  }
  if (planId === MERCADOPAGO_PLANS.LIFETIME) {
    return 'lifetime'
  }
  return 'basico'
}

/**
 * Precios de los planes (en MXN)
 */
export const PLAN_PRICES = {
  basico: { monthly: 599, annual: 5990 },
  pro: { monthly: 999, annual: 9990 },
  enterprise: { monthly: 2999, annual: 29990 },
  lifetime: 19990,
} as const

/**
 * Límites de cada plan
 */
export const PLAN_LIMITS = {
  basico: { max_doctors: 1, max_locations: 1 },
  pro: { max_doctors: 10, max_locations: 5 },
  enterprise: { max_doctors: 999, max_locations: 999 },
  lifetime: { max_doctors: 999, max_locations: 999 },
} as const
