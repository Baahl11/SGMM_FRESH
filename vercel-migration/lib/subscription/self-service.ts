import { PLAN_FEATURES, type PlanTier } from '@/lib/stripe/config'

export type SelfServicePlanTier = Extract<PlanTier, 'pro' | 'enterprise'>
export type BillingCycle = 'monthly' | 'annual'

export const SELF_SERVICE_TRIAL_DAYS = 14

export function normalizeSelfServicePlan(value: unknown): SelfServicePlanTier | null {
  return value === 'pro' || value === 'enterprise' ? value : null
}

export function normalizeBillingCycle(value: unknown): BillingCycle | null {
  return value === 'monthly' || value === 'annual' ? value : null
}

export function selfServicePlanPayload(planTier: SelfServicePlanTier) {
  const plan = PLAN_FEATURES[planTier]
  return {
    plan_tier: planTier,
    max_doctors: plan.max_doctors,
    max_locations: plan.max_locations,
    features: [...plan.features],
  }
}

export function noCardTrialEnabled() {
  return process.env.SELF_SERVICE_NO_CARD_TRIAL_ENABLED === 'true'
}

