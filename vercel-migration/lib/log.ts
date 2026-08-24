/**
 * Logger con redacción de datos sensibles (auditoría fable 2026-06-11, hallazgos D2/J).
 *
 * Objetivo: que ningún log de servidor contenga tokens, teléfonos completos,
 * emails completos ni cuerpos de mensajes de pacientes. Sustituye los
 * console.log con PII detectados en webhooks y módulos de auth.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|authorization|api[_-]?key|service[_-]?role|signature|cookie|jwt/i

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._\-]{10,}/gi
const EMAIL_PATTERN = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g
// Teléfonos: conserva sólo los últimos 4 dígitos.
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '[sin teléfono]'
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '****'
  return `****${digits.slice(-4)}`
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[sin email]'
  return email.replace(EMAIL_PATTERN, (_m, first: string, domain: string) => `${first}***${domain}`)
}

export function redactText(input: string): string {
  return input
    .replace(JWT_PATTERN, '[JWT_REDACTADO]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTADO]')
    .replace(EMAIL_PATTERN, (_m, first: string, domain: string) => `${first}***${domain}`)
    .replace(PHONE_PATTERN, (m) => maskPhone(m))
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (value == null || depth > 4) return value
  if (typeof value === 'string') return redactText(value)
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redactValue(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(k)) {
      out[k] = '[REDACTADO]'
    } else {
      out[k] = redactValue(v, depth + 1)
    }
  }
  return out
}

function emit(level: Level, scope: string, message: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return
  const payload = meta ? JSON.stringify(redactValue(meta)) : ''
  const line = `[${scope}] ${redactText(message)} ${payload}`.trim()
   
  ;(level === 'debug' ? console.log : console[level])(line)
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => emit('debug', scope, message, meta),
    info: (message: string, meta?: Record<string, unknown>) => emit('info', scope, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit('warn', scope, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => emit('error', scope, message, meta),
  }
}
