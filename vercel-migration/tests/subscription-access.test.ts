import { describe, expect, it } from 'vitest'
import {
  hasSubscriptionAccess,
  isStripeBackedSubscription,
  isTrialExpired,
} from '@/lib/subscription/access'

const now = new Date('2026-06-23T18:00:00.000Z')

describe('subscription access', () => {
  it('allows active paid or manual subscriptions', () => {
    expect(hasSubscriptionAccess({ status: 'active' }, now)).toBe(true)
  })

  it('allows a trial only before its exact end', () => {
    expect(hasSubscriptionAccess({ status: 'trialing', trial_end: '2026-06-23T18:00:01.000Z' }, now)).toBe(true)
    expect(hasSubscriptionAccess({ status: 'trialing', trial_end: '2026-06-23T18:00:00.000Z' }, now)).toBe(false)
    expect(isTrialExpired({ status: 'trialing', trial_end: '2026-06-23T18:00:00.000Z' }, now)).toBe(true)
  })

  it('does not grant access from a Stripe id alone', () => {
    expect(hasSubscriptionAccess({ status: 'canceled', stripe_subscription_id: 'sub_123' }, now)).toBe(false)
    expect(isStripeBackedSubscription({ stripe_subscription_id: 'sub_123' })).toBe(true)
  })
})

