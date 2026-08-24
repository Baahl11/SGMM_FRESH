'use client'

import { readStoredMarketingAttribution } from '@/lib/marketing/attribution'
import type { FunnelEventName } from './funnel'

type MetadataValue = string | number | boolean | null

export function trackFunnelEvent(
  eventName: FunnelEventName,
  metadata: Record<string, MetadataValue> = {}
) {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({
    eventName,
    path: window.location.pathname,
    context: readStoredMarketingAttribution(),
    metadata,
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon('/api/analytics/funnel', blob)) return
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch('/api/analytics/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the funnel.
  })
}
