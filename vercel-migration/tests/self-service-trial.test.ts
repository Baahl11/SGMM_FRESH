import { describe, expect, it } from 'vitest'
import {
  normalizeBillingCycle,
  normalizeSelfServicePlan,
  selfServicePlanPayload,
} from '@/lib/subscription/self-service'

describe('self-service no-card trial', () => {
  it('accepts only Pro and Enterprise', () => {
    expect(normalizeSelfServicePlan('pro')).toBe('pro')
    expect(normalizeSelfServicePlan('enterprise')).toBe('enterprise')
    expect(normalizeSelfServicePlan('basico')).toBeNull()
    expect(normalizeSelfServicePlan('lifetime')).toBeNull()
  })

  it('accepts only supported billing cycles', () => {
    expect(normalizeBillingCycle('monthly')).toBe('monthly')
    expect(normalizeBillingCycle('annual')).toBe('annual')
    expect(normalizeBillingCycle('yearly')).toBeNull()
  })

  it('provisions the selected plan limits and features', () => {
    const pro = selfServicePlanPayload('pro')
    const enterprise = selfServicePlanPayload('enterprise')

    expect(pro.plan_tier).toBe('pro')
    expect(pro.max_doctors).toBe(10)
    expect(pro.features).toContain('inventory')
    expect(enterprise.plan_tier).toBe('enterprise')
    expect(enterprise.max_doctors).toBe(999)
    expect(enterprise.features).toContain('all')
  })
})

