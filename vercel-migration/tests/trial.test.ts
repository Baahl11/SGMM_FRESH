import { describe, expect, it } from 'vitest'
import { TRIAL_DAYS, trialEndDate } from '@/lib/config/trial'

describe('config de trial (fable H1)', () => {
  it('la fuente única de verdad es 14 días', () => {
    expect(TRIAL_DAYS).toBe(14)
  })
  it('trialEndDate devuelve ahora + 14 días (±1 min)', () => {
    const end = trialEndDate().getTime()
    const expected = Date.now() + 14 * 24 * 60 * 60 * 1000
    expect(Math.abs(end - expected)).toBeLessThan(60_000)
  })
})
