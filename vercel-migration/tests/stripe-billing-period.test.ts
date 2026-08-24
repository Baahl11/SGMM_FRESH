import { describe, expect, it } from 'vitest'
import {
  getStripeInvoiceSubscriptionId,
  getStripeSubscriptionPeriod,
  stripeTimestampToIso,
} from '@/lib/stripe/billing-period'

describe('Stripe billing period compatibility', () => {
  it('uses subscription item periods from the current Stripe API', () => {
    expect(getStripeSubscriptionPeriod({
      items: { data: [{ current_period_start: 1782281049, current_period_end: 1784873049 }] },
    })).toEqual({ start: 1782281049, end: 1784873049 })
  })

  it('keeps compatibility with legacy top-level periods', () => {
    expect(getStripeSubscriptionPeriod({
      current_period_start: 100,
      current_period_end: 200,
      items: { data: [{ current_period_start: 300, current_period_end: 400 }] },
    })).toEqual({ start: 100, end: 200 })
  })

  it('resolves subscription IDs from current and legacy invoices', () => {
    expect(getStripeInvoiceSubscriptionId({
      parent: { subscription_details: { subscription: 'sub_current' } },
    })).toBe('sub_current')
    expect(getStripeInvoiceSubscriptionId({ subscription: 'sub_legacy' })).toBe('sub_legacy')
  })

  it('does not create invalid dates from missing timestamps', () => {
    expect(stripeTimestampToIso(undefined)).toBeNull()
    expect(stripeTimestampToIso(1782281049)).toBe('2026-06-24T06:04:09.000Z')
  })
})
