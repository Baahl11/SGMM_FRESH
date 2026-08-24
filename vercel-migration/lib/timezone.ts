/**
 * Utilidades de zona horaria por clínica (auditoría fable 2026-06-11, E3).
 *
 * ANTES: el chat asumía México = UTC-6 con aritmética manual. México tiene
 * varias zonas IANA (America/Mexico_City, America/Cancun, America/Tijuana,
 * America/Hermosillo, etc.) y el producto es multi-sede.
 * AHORA: conversión basada en Intl con zona configurable por clínica.
 */
export const DEFAULT_CLINIC_TIMEZONE =
  process.env.DEFAULT_CLINIC_TIMEZONE ?? 'America/Mexico_City'

/** Devuelve 'YYYY-MM-DD' del instante dado en la zona indicada. */
export function dateStringInTimezone(date: Date, timeZone: string = DEFAULT_CLINIC_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Inicio y fin (instantes UTC) del día local de la clínica que contiene `date`. */
export function clinicDayRangeUtc(
  date: Date,
  timeZone: string = DEFAULT_CLINIC_TIMEZONE
): { startUtc: Date; endUtc: Date; localDate: string } {
  const localDate = dateStringInTimezone(date, timeZone)
  const offsetMinutes = timezoneOffsetMinutes(date, timeZone)
  const startUtc = new Date(Date.parse(`${localDate}T00:00:00Z`) - offsetMinutes * 60_000)
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60_000)
  return { startUtc, endUtc, localDate }
}

/** Offset (minutos que la zona está adelante de UTC) en el instante dado. */
export function timezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]))
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '00' : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
  return Math.round((asUtc - date.getTime()) / 60_000)
}
