export const ATTRIBUTION_STORAGE_KEY = 'amp_marketing_attribution'
const LEGACY_STORAGE_KEY = 'amp_marketing_context'
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type AttributionTouch = {
  source: string | null
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  gclid: string | null
  fbclid: string | null
  landingPage: string | null
  referrer: string | null
}

export type MarketingAttributionContext = {
  anonymousId: string
  firstTouch: AttributionTouch
  lastTouch: AttributionTouch
  calculator: {
    monthlyLoss: number | null
    averageTicket: number | null
    missedAppointments: number | null
    appointmentsToCover: number | null
    recoverableMonthly: number | null
  }
  savedAt: number
  expiresAt: number
}

const emptyTouch = (): AttributionTouch => ({
  source: null,
  medium: null,
  campaign: null,
  content: null,
  term: null,
  gclid: null,
  fbclid: null,
  landingPage: null,
  referrer: null,
})

function boundedString(value: unknown, maxLength = 255) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function boundedNumber(value: unknown, minimum: number, maximum: number) {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) return null
  return Math.round(parsed)
}

function normalizeTouch(value: unknown): AttributionTouch {
  const touch = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    source: boundedString(touch.source),
    medium: boundedString(touch.medium),
    campaign: boundedString(touch.campaign),
    content: boundedString(touch.content),
    term: boundedString(touch.term),
    gclid: boundedString(touch.gclid, 500),
    fbclid: boundedString(touch.fbclid, 500),
    landingPage: boundedString(touch.landingPage, 500),
    referrer: boundedString(touch.referrer, 1000),
  }
}

export function normalizeMarketingAttribution(
  value: unknown
): MarketingAttributionContext | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const calculator = input.calculator && typeof input.calculator === 'object'
    ? input.calculator as Record<string, unknown>
    : {}
  const savedAt = boundedNumber(input.savedAt, 0, Number.MAX_SAFE_INTEGER) ?? Date.now()
  const expiresAt = boundedNumber(input.expiresAt, 0, Number.MAX_SAFE_INTEGER)
    ?? savedAt + ATTRIBUTION_TTL_MS

  if (expiresAt < Date.now()) return null

  return {
    anonymousId: boundedString(input.anonymousId, 100) ?? '',
    firstTouch: normalizeTouch(input.firstTouch),
    lastTouch: normalizeTouch(input.lastTouch),
    calculator: {
      monthlyLoss: boundedNumber(calculator.monthlyLoss, 0, 100_000_000),
      averageTicket: boundedNumber(calculator.averageTicket, 1, 1_000_000),
      missedAppointments: boundedNumber(calculator.missedAppointments, 0, 100_000),
      appointmentsToCover: boundedNumber(calculator.appointmentsToCover, 1, 10_000),
      recoverableMonthly: boundedNumber(calculator.recoverableMonthly, 0, 100_000_000),
    },
    savedAt,
    expiresAt,
  }
}

function hasTouchData(touch: AttributionTouch) {
  return Object.values(touch).some(Boolean)
}

function safeReferrer(referrer: string) {
  if (!referrer) return null
  try {
    const parsed = new URL(referrer)
    return `${parsed.origin}${parsed.pathname}`.slice(0, 1000)
  } catch {
    return null
  }
}

function readStorage(storage: Storage | undefined, key: string) {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    return raw ? normalizeMarketingAttribution(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function readStoredMarketingAttribution() {
  if (typeof window === 'undefined') return null

  return (
    readStorage(window.localStorage, ATTRIBUTION_STORAGE_KEY)
    ?? readStorage(window.sessionStorage, ATTRIBUTION_STORAGE_KEY)
    ?? readStorage(window.sessionStorage, LEGACY_STORAGE_KEY)
  )
}

export function captureMarketingAttribution(
  searchParams: Pick<URLSearchParams, 'get'>,
  pathname = typeof window !== 'undefined' ? window.location.pathname : null,
  referrer = typeof document !== 'undefined' ? document.referrer : ''
) {
  if (typeof window === 'undefined') return null

  const existing = readStoredMarketingAttribution()
  const now = Date.now()
  const currentTouch: AttributionTouch = {
    source: boundedString(searchParams.get('utm_source')),
    medium: boundedString(searchParams.get('utm_medium')),
    campaign: boundedString(searchParams.get('utm_campaign')),
    content: boundedString(searchParams.get('utm_content')),
    term: boundedString(searchParams.get('utm_term')),
    gclid: boundedString(searchParams.get('gclid'), 500),
    fbclid: boundedString(searchParams.get('fbclid'), 500),
    landingPage: boundedString(searchParams.get('landing') ?? pathname, 500),
    referrer: safeReferrer(referrer),
  }
  const calculator = {
    monthlyLoss: boundedNumber(searchParams.get('monthly_loss'), 0, 100_000_000),
    averageTicket: boundedNumber(searchParams.get('average_ticket'), 1, 1_000_000),
    missedAppointments: boundedNumber(searchParams.get('monthly_no_shows'), 0, 100_000),
    appointmentsToCover: boundedNumber(
      searchParams.get('appointments_to_cover_plan'),
      1,
      10_000
    ),
    recoverableMonthly: boundedNumber(
      searchParams.get('recoverable_monthly'),
      0,
      100_000_000
    ),
  }

  const context: MarketingAttributionContext = {
    anonymousId:
      existing?.anonymousId
      || window.crypto?.randomUUID?.()
      || `amp_${now}_${Math.random().toString(36).slice(2, 12)}`,
    firstTouch: existing?.firstTouch && hasTouchData(existing.firstTouch)
      ? existing.firstTouch
      : currentTouch,
    lastTouch: hasTouchData(currentTouch) ? currentTouch : existing?.lastTouch ?? emptyTouch(),
    calculator: {
      monthlyLoss: calculator.monthlyLoss ?? existing?.calculator.monthlyLoss ?? null,
      averageTicket: calculator.averageTicket ?? existing?.calculator.averageTicket ?? null,
      missedAppointments:
        calculator.missedAppointments ?? existing?.calculator.missedAppointments ?? null,
      appointmentsToCover:
        calculator.appointmentsToCover ?? existing?.calculator.appointmentsToCover ?? null,
      recoverableMonthly:
        calculator.recoverableMonthly ?? existing?.calculator.recoverableMonthly ?? null,
    },
    savedAt: now,
    expiresAt: now + ATTRIBUTION_TTL_MS,
  }

  const serialized = JSON.stringify(context)
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized)
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized)
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage can be blocked by browser privacy settings; the flow must continue.
  }

  return context
}

export async function syncSignupAttribution(context?: MarketingAttributionContext | null) {
  const payload = context ?? readStoredMarketingAttribution()
  if (!payload) return false

  try {
    const response = await fetch('/api/marketing/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'signup_created',
        context: payload,
      }),
      keepalive: true,
    })
    return response.ok
  } catch {
    return false
  }
}
