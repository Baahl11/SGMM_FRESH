export type AccessSubscription = {
  status?: string | null
  trial_end?: string | null
  current_period_end?: string | null
  stripe_subscription_id?: string | null
}

export function isStripeBackedSubscription(subscription: AccessSubscription | null | undefined) {
  return Boolean(subscription?.stripe_subscription_id?.startsWith('sub_'))
}

export function isTrialExpired(
  subscription: AccessSubscription | null | undefined,
  now = new Date()
) {
  if (subscription?.status !== 'trialing' || !subscription.trial_end) return false
  return new Date(subscription.trial_end).getTime() <= now.getTime()
}

export function hasSubscriptionAccess(
  subscription: AccessSubscription | null | undefined,
  now = new Date()
) {
  if (!subscription) return false
  if (subscription.status === 'active') return true
  if (subscription.status !== 'trialing' || !subscription.trial_end) return false
  return new Date(subscription.trial_end).getTime() > now.getTime()
}

