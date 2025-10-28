import Stripe from 'stripe'
import { PLAN_FEATURES, type PlanTier, hasFeature as configHasFeature, getPlanLimits as configGetPlanLimits } from './config'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

// Singleton instance de Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

/**
 * Price IDs de los planes
 */
export const STRIPE_PRICES = {
  BASICO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_MONTHLY || 'price_basico_monthly_placeholder',
  BASICO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASICO_ANNUAL || 'price_basico_annual_placeholder',
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
  PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual_placeholder',
  ENTERPRISE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_placeholder',
  ENTERPRISE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual_placeholder',
  LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME || 'price_lifetime_placeholder',
} as const

// Re-export tipos y helpers de config
export type { PlanTier }
export { PLAN_FEATURES }

/**
 * Helper para obtener el tier del plan desde el price_id
 */
export function getPlanTierFromPriceId(priceId: string): PlanTier {
  switch (priceId) {
    case STRIPE_PRICES.BASICO_MONTHLY:
    case STRIPE_PRICES.BASICO_ANNUAL:
      return 'basico'
    case STRIPE_PRICES.PRO_MONTHLY:
    case STRIPE_PRICES.PRO_ANNUAL:
      return 'pro'
    case STRIPE_PRICES.ENTERPRISE_MONTHLY:
    case STRIPE_PRICES.ENTERPRISE_ANNUAL:
    case STRIPE_PRICES.LIFETIME:
      return 'enterprise'
    default:
      return 'basico' // Default to básico if unknown
  }
}

// Re-export helpers de config
export const hasFeature = configHasFeature
export const getPlanLimits = configGetPlanLimits
