/**
 * Utilidades de zona horaria por clínica (adenda V2.1, hallazgo A-5).
 *
 * Duplicado deliberado de la lógica en `vercel-migration/lib/timezone.ts`:
 * mcp-server es un paquete independiente (su propio package.json, sin
 * node_modules compartido con vercel-migration), así que no puede
 * importar ese módulo directamente. Si esa lógica cambia, replicar el
 * cambio aquí.
 */
export const DEFAULT_CLINIC_TIMEZONE = process.env.DEFAULT_CLINIC_TIMEZONE ?? 'America/Mexico_City';

/** Devuelve 'YYYY-MM-DD' del instante dado en la zona indicada. */
export function dateStringInTimezone(date: Date, timeZone: string = DEFAULT_CLINIC_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Offset (minutos que la zona está adelante de UTC) en el instante dado. */
function timezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '00' : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/**
 * Rango UTC del día local de la clínica para un string 'YYYY-MM-DD', listo
 * para usar en `.gte(startUtc.toISOString()).lt(endUtc.toISOString())`
 * contra una columna timestamptz.
 *
 * Reemplaza el patrón de interpolar un string de fecha seguido de la hora
 * sin offset (00:00:00 / 23:59:59), que Postgres interpreta como UTC y
 * corre la ventana del día seis horas en México.
 */
export function clinicDateStringRangeUtc(
  dateStr: string,
  timeZone: string = DEFAULT_CLINIC_TIMEZONE
): { startUtc: Date; endUtc: Date } {
  const offsetMinutes = timezoneOffsetMinutes(new Date(`${dateStr}T12:00:00Z`), timeZone);
  const startUtc = new Date(Date.parse(`${dateStr}T00:00:00Z`) - offsetMinutes * 60_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60_000);
  return { startUtc, endUtc };
}
