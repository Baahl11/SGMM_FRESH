import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Singleton para obtener la instancia de Stripe en el cliente
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
      return Promise.resolve(null)
    }
    
    stripePromise = loadStripe(publishableKey)
  }
  
  return stripePromise
}

/**
 * Price IDs públicos (para referencias en el frontend)
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

export type PlanName = 'basico' | 'pro' | 'enterprise' | 'lifetime'
export type BillingCycle = 'monthly' | 'annual' | 'once'

/**
 * Helper para obtener el price_id desde el nombre del plan y ciclo de facturación
 */
export function getPriceId(planName: PlanName, billingCycle: BillingCycle = 'monthly'): string {
  switch (planName) {
    case 'basico':
      return billingCycle === 'annual' ? STRIPE_PRICES.BASICO_ANNUAL : STRIPE_PRICES.BASICO_MONTHLY
    case 'pro':
      return billingCycle === 'annual' ? STRIPE_PRICES.PRO_ANNUAL : STRIPE_PRICES.PRO_MONTHLY
    case 'enterprise':
      return billingCycle === 'annual' ? STRIPE_PRICES.ENTERPRISE_ANNUAL : STRIPE_PRICES.ENTERPRISE_MONTHLY
    case 'lifetime':
      return STRIPE_PRICES.LIFETIME
    default:
      return STRIPE_PRICES.BASICO_MONTHLY
  }
}
