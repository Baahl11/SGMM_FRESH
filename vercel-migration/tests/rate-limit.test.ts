import { describe, expect, it } from 'vitest'
import { checkRateLimit } from '@/lib/security/rate-limit'

describe('rate limit en memoria (fable E2/C13)', () => {
  it('permite hasta el límite y luego bloquea con retryAfter', () => {
    const key = `test:${Math.random()}`
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed).toBe(true)
    }
    const blocked = checkRateLimit(key, { limit: 3, windowMs: 60_000 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
  })
  it('claves distintas no comparten cuota', () => {
    const a = `a:${Math.random()}`
    const b = `b:${Math.random()}`
    checkRateLimit(a, { limit: 1, windowMs: 60_000 })
    expect(checkRateLimit(a, { limit: 1, windowMs: 60_000 }).allowed).toBe(false)
    expect(checkRateLimit(b, { limit: 1, windowMs: 60_000 }).allowed).toBe(true)
  })
})
