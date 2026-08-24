import { describe, expect, it } from 'vitest'
import { maskEmail, maskPhone, redactText } from '@/lib/log'

describe('redacción de logs (fable D2)', () => {
  it('enmascara teléfonos dejando últimos 4', () => {
    const masked = maskPhone('+52 222 340 4585')
    expect(masked).toContain('4585')
    expect(masked).not.toContain('340')
  })
  it('enmascara emails preservando dominio', () => {
    const masked = maskEmail('paciente.uno@example.com')
    expect(masked).toContain('@example.com')
    expect(masked).not.toContain('paciente.uno')
  })
  it('redacta JWTs y tokens Bearer en texto libre', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c'
    const out = redactText(`Authorization: Bearer ${jwt} fin`)
    expect(out).not.toContain(jwt)
    expect(out.toLowerCase()).toContain('redact')
  })
})
