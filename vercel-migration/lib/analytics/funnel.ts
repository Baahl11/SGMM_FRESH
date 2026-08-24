import {
  normalizeMarketingAttribution,
  type MarketingAttributionContext,
} from '@/lib/marketing/attribution'

export const FUNNEL_EVENT_NAMES = [
  'calculator_view',
  'calculator_cta',
  'trial_landing_view',
  'trial_landing_cta',
  'signup_view',
  'signup_success',
  'select_trial_plan_view',
  'plan_select_clicked',
  'checkout_started',
  'trial_started',
] as const

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number]

export type NormalizedFunnelEvent = {
  eventName: FunnelEventName
  path: string | null
  context: MarketingAttributionContext | null
  metadata: Record<string, string | number | boolean | null>
}

const eventNames = new Set<string>(FUNNEL_EVENT_NAMES)

function boundedString(value: unknown, maxLength = 255) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned ? cleaned.slice(0, maxLength) : null
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const entries = Object.entries(value as Record<string, unknown>).slice(0, 20)
  const normalized: Record<string, string | number | boolean | null> = {}

  for (const [key, rawValue] of entries) {
    const safeKey = boundedString(key, 80)
    if (!safeKey) continue

    if (typeof rawValue === 'string') {
      normalized[safeKey] = boundedString(rawValue, 255)
    } else if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      normalized[safeKey] = Math.round(rawValue)
    } else if (typeof rawValue === 'boolean' || rawValue === null) {
      normalized[safeKey] = rawValue
    }
  }

  return normalized
}

export function normalizeFunnelEventPayload(value: unknown): NormalizedFunnelEvent | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const eventName = boundedString(input.eventName, 80)

  if (!eventName || !eventNames.has(eventName)) return null

  return {
    eventName: eventName as FunnelEventName,
    path: boundedString(input.path, 500),
    context: normalizeMarketingAttribution(input.context),
    metadata: normalizeMetadata(input.metadata),
  }
}
