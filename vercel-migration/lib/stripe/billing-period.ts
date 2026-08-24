type StripePeriodItem = {
  current_period_start?: number | null
  current_period_end?: number | null
}

type StripeSubscriptionPeriodSource = {
  current_period_start?: number | null
  current_period_end?: number | null
  items?: { data?: StripePeriodItem[] | null } | null
}

type StripeInvoiceSubscriptionSource = {
  subscription?: string | { id?: string | null } | null
  parent?: {
    subscription_details?: {
      subscription?: string | { id?: string | null } | null
    } | null
  } | null
}

function stripeId(value: string | { id?: string | null } | null | undefined) {
  if (typeof value === 'string') return value
  return value?.id ?? null
}

export function getStripeSubscriptionPeriod(subscription: StripeSubscriptionPeriodSource) {
  const firstItem = subscription.items?.data?.[0]

  return {
    start: subscription.current_period_start ?? firstItem?.current_period_start ?? null,
    end: subscription.current_period_end ?? firstItem?.current_period_end ?? null,
  }
}

export function stripeTimestampToIso(timestamp: number | null | undefined) {
  if (!Number.isFinite(timestamp) || !timestamp || timestamp <= 0) return null
  return new Date(timestamp * 1000).toISOString()
}

export function getStripeInvoiceSubscriptionId(invoice: StripeInvoiceSubscriptionSource) {
  return stripeId(invoice.subscription) ??
    stripeId(invoice.parent?.subscription_details?.subscription)
}
