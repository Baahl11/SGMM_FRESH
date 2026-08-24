import { describe, expect, it } from 'vitest'
import { dateStringInTimezone, timezoneOffsetMinutes } from '@/lib/timezone'

describe('zona horaria de clínica (fable E3)', () => {
  it('convierte instantes UTC a fecha local de Ciudad de México', () => {
    // 2026-01-15T05:30Z = 2026-01-14 23:30 en CDMX (UTC-6, sin DST)
    expect(dateStringInTimezone(new Date('2026-01-15T05:30:00Z'), 'America/Mexico_City')).toBe('2026-01-14')
    // 2026-01-15T07:30Z = 01:30 del 15 en CDMX
    expect(dateStringInTimezone(new Date('2026-01-15T07:30:00Z'), 'America/Mexico_City')).toBe('2026-01-15')
  })
  it('America/Cancun es UTC-5 fijo (sin DST) — el offset manual -6 era incorrecto ahí', () => {
    expect(timezoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'America/Cancun')).toBe(-300)
    expect(timezoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'America/Cancun')).toBe(-300)
  })
})
