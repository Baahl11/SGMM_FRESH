'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'] as const

/**
 * Persists UTM parameters to sessionStorage so they survive navigation
 * and can be retrieved at signup time for attribution.
 */
export function UtmCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const existing = (() => {
      try { return JSON.parse(sessionStorage.getItem('utm_data') ?? '{}') } catch { return {} }
    })()

    let hasNew = false
    const updated = { ...existing }

    UTM_PARAMS.forEach((key) => {
      const value = searchParams.get(key)
      if (value && !existing[key]) {
        updated[key] = value
        hasNew = true
      }
    })

    if (hasNew) {
      try { sessionStorage.setItem('utm_data', JSON.stringify(updated)) } catch { /* ignore */ }
    }
  }, [searchParams])

  return null
}

/** Returns persisted UTM data for sending to backend at signup */
export function getStoredUtmData(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(sessionStorage.getItem('utm_data') ?? '{}') } catch { return {} }
}
