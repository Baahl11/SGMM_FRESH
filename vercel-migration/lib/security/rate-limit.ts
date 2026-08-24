/**
 * Rate limiting básico (auditoría fable 2026-06-11, E2 / Capa 9).
 *
 * LIMITACIÓN CONOCIDA Y DOCUMENTADA: este limitador vive en memoria del
 * proceso. En Vercel/serverless cada instancia tiene su propio Map y se
 * reinicia con frecuencia, por lo que sólo mitiga abuso de ráfaga dentro de
 * una instancia. Para límites reales distribuidos se requiere Upstash Redis o
 * Vercel KV (ver docs/fable-audit/19_OPEN_DECISIONS.md, decisión OD-4).
 *
 * Reglas de identidad:
 * - NUNCA usar un identificador suministrado por un cliente anónimo.
 * - Usuario autenticado → `user:<uid>`; anónimo → `ip:<ip>`.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now()
  // Evita crecimiento sin límite del Map.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
      if (buckets.size <= MAX_BUCKETS / 2) break
    }
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterSeconds: 0 }
  }
  bucket.count += 1
  const allowed = bucket.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  }
}

export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
  }
}
