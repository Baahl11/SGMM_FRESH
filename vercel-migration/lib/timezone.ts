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

/**
 * Rango UTC del día local de la clínica para un string 'YYYY-MM-DD', listo
 * para usar en `.gte(startUtc.toISOString()).lt(endUtc.toISOString())`
 * contra una columna timestamptz (adenda V2.1, hallazgo A-5).
 *
 * Reemplaza el patrón de interpolar un string de fecha seguido de la hora
 * sin offset (00:00:00 / 23:59:59), que Postgres interpreta como UTC y
 * corre la ventana del día seis horas en México.
 */
export function clinicDateStringRangeUtc(
  dateStr: string,
  timeZone: string = DEFAULT_CLINIC_TIMEZONE
): { startUtc: Date; endUtc: Date } {
  // Ancla al mediodía UTC: para cualquier huso horario real (UTC-12 a
  // UTC+14) esto sigue cayendo en la misma fecha de calendario que
  // `dateStr`, así que clinicDayRangeUtc calcula el día local correcto.
  const { startUtc, endUtc } = clinicDayRangeUtc(new Date(`${dateStr}T12:00:00Z`), timeZone)
  return { startUtc, endUtc }
}

/**
 * Suma días de calendario a un string 'YYYY-MM-DD'. Aritmética pura sobre
 * componentes de fecha (ancla a mediodía UTC), no se ve afectada por DST.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const anchor = new Date(`${dateStr}T12:00:00Z`)
  anchor.setUTCDate(anchor.getUTCDate() + days)
  return anchor.toISOString().slice(0, 10)
}

/**
 * Día de la semana en la fecha local de la clínica, convención 0=Lunes..
 * 6=Domingo (adenda V2.1, hallazgo A-6 — misma convención que documenta
 * `supabase/migrations/007_create_doctors_system.sql` para
 * `doctor_schedules.dia_semana`).
 *
 * Nunca usar `Date.getDay()`/`Date.getUTCDay()` crudo contra esa columna:
 * ahí 0=Domingo, y además operan sobre el día UTC/local del proceso, no
 * sobre el día calendario de la clínica.
 */
export function diaSemanaClinica(date: Date, timeZone: string = DEFAULT_CLINIC_TIMEZONE): number {
  const localDate = dateStringInTimezone(date, timeZone)
  // Mismo truco de ancla a mediodía UTC: getUTCDay() sobre esa fecha da el
  // día de la semana real de `localDate` sin volver a pasar por ninguna
  // conversión de huso horario (0=Domingo..6=Sábado, convención JS).
  const jsDay = new Date(`${localDate}T12:00:00Z`).getUTCDay()
  return (jsDay + 6) % 7
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
