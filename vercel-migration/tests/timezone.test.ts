import { describe, expect, it } from 'vitest'
import {
  addDaysToDateString,
  clinicDateStringRangeUtc,
  dateStringInTimezone,
  diaSemanaClinica,
  timezoneOffsetMinutes,
} from '@/lib/timezone'

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

// Adenda V2.1, hallazgo A-5: comparar una columna timestamptz contra un
// string sin offset (`${date}T00:00:00`) hace que Postgres lo interprete
// como UTC. En México (UTC-6) el "día" consultado terminaba corrido seis
// horas. clinicDateStringRangeUtc()/addDaysToDateString() son los
// reemplazos correctos para las 7 ubicaciones citadas en la adenda.
describe('clinicDateStringRangeUtc (adenda A-5)', () => {
  it('convierte un string YYYY-MM-DD al rango UTC correcto del día local en CDMX', () => {
    const { startUtc, endUtc } = clinicDateStringRangeUtc('2026-08-26', 'America/Mexico_City')
    // 2026-08-26T00:00:00 en CDMX (UTC-6) = 2026-08-26T06:00:00Z
    expect(startUtc.toISOString()).toBe('2026-08-26T06:00:00.000Z')
    expect(endUtc.toISOString()).toBe('2026-08-27T06:00:00.000Z')
  })

  it('el fin de un día es exactamente el inicio del siguiente (límite exclusivo, sin huecos ni solapes)', () => {
    const { endUtc } = clinicDateStringRangeUtc('2026-08-26', 'America/Mexico_City')
    const { startUtc: inicioSiguiente } = clinicDateStringRangeUtc('2026-08-27', 'America/Mexico_City')
    expect(endUtc.getTime()).toBe(inicioSiguiente.getTime())
  })

  it('usa DEFAULT_CLINIC_TIMEZONE cuando no se especifica zona', () => {
    const { startUtc } = clinicDateStringRangeUtc('2026-08-26')
    expect(startUtc.toISOString()).toBe('2026-08-26T06:00:00.000Z')
  })

  it('respeta zonas distintas a CDMX (Cancún, UTC-5 fijo)', () => {
    const { startUtc } = clinicDateStringRangeUtc('2026-08-26', 'America/Cancun')
    expect(startUtc.toISOString()).toBe('2026-08-26T05:00:00.000Z')
  })
})

describe('addDaysToDateString (adenda A-5 — reemplaza el "tomorrow" calculado en UTC)', () => {
  it('suma días de calendario', () => {
    expect(addDaysToDateString('2026-08-26', 1)).toBe('2026-08-27')
  })
  it('cruza el fin de mes correctamente', () => {
    expect(addDaysToDateString('2026-08-31', 1)).toBe('2026-09-01')
  })
  it('cruza el fin de año correctamente', () => {
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01')
  })
})

// Adenda V2.1, hallazgo A-6: tres archivos leen doctor_schedules.dia_semana
// con convenciones distintas (0=Lunes en la migración y en el webhook,
// 0=Domingo vía Date.getDay() crudo en check-availability). Fijamos
// 0=Lunes como canónico y prohibimos getDay() crudo contra esa columna.
describe('diaSemanaClinica (adenda A-6)', () => {
  it('usa la convención 0=Lunes..6=Domingo (igual que supabase/migrations/007_create_doctors_system.sql)', () => {
    // 2024-01-01 es lunes (referencia conocida)
    expect(diaSemanaClinica(new Date('2024-01-01T12:00:00Z'), 'America/Mexico_City')).toBe(0) // lunes
    expect(diaSemanaClinica(new Date('2024-01-02T12:00:00Z'), 'America/Mexico_City')).toBe(1) // martes
    expect(diaSemanaClinica(new Date('2024-01-03T12:00:00Z'), 'America/Mexico_City')).toBe(2) // miércoles
    expect(diaSemanaClinica(new Date('2024-01-04T12:00:00Z'), 'America/Mexico_City')).toBe(3) // jueves
    expect(diaSemanaClinica(new Date('2024-01-05T12:00:00Z'), 'America/Mexico_City')).toBe(4) // viernes
    expect(diaSemanaClinica(new Date('2024-01-06T12:00:00Z'), 'America/Mexico_City')).toBe(5) // sábado
    expect(diaSemanaClinica(new Date('2024-01-07T12:00:00Z'), 'America/Mexico_City')).toBe(6) // domingo
  })

  it('usa la fecha local de la clínica, no el día UTC crudo del instante (lo que Date.getDay() haría mal)', () => {
    // 2026-08-27T04:00:00Z = 2026-08-26 22:00 en CDMX (UTC-6): el día local
    // sigue siendo el 26 (miércoles), aunque en UTC ya sea jueves 27.
    const instante = new Date('2026-08-27T04:00:00Z')
    expect(diaSemanaClinica(instante, 'America/Mexico_City')).toBe(2) // miércoles
  })
})
