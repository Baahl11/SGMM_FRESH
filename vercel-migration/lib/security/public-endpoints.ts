import 'server-only'
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { checkRateLimit, clientIpFromHeaders, rateLimitHeaders } from './rate-limit'
import { createLogger } from '@/lib/log'

const log = createLogger('public-endpoint')

/**
 * Endurecimiento de endpoints públicos (auditoría fable 2026-06-11, C13).
 *
 * Los recursos públicos (documentos para firma, intake forms, encuestas NPS)
 * se exponían por UUID directo, con service role, aceptando patient_id y
 * appointment_id arbitrarios del navegador (asociación cross-tenant, spam,
 * replay). Este módulo aporta:
 *
 * 1. Rate limit por IP (mejor esfuerzo en serverless; ver OD-4).
 * 2. Validación de asociaciones: un patient_id/appointment_id enviado por el
 *    cliente sólo se persiste si pertenece al MISMO tenant (user_id) dueño del
 *    recurso; si no, se descarta a null y se registra el intento.
 * 3. Búsqueda por `public_token` (migración 20260611150000) con compatibilidad
 *    con el UUID legacy mientras los enlaces antiguos sigan circulando.
 *    Decisión OD-7: tras migrar los enlaces, deshabilitar el lookup por id.
 */

export const PUBLIC_GET_LIMIT = { limit: 60, windowMs: 60_000 }
export const PUBLIC_POST_LIMIT = { limit: 8, windowMs: 60_000 }

export function publicRateLimit(req: NextRequest | Request, scope: string, kind: 'get' | 'post') {
  const ip = clientIpFromHeaders(req.headers)
  const cfg = kind === 'get' ? PUBLIC_GET_LIMIT : PUBLIC_POST_LIMIT
  const result = checkRateLimit(`pub:${scope}:${kind}:${ip}`, cfg)
  return { result, headers: rateLimitHeaders(result) }
}

export const uuidSchema = z.string().uuid()

/**
 * Busca un recurso público por public_token, con fallback legacy por id.
 * Tolera bases donde la columna public_token aún no existe (migración pendiente).
 */
export async function findPublicResource<T extends Record<string, unknown>>(
  admin: SupabaseClient,
  table: string,
  idOrToken: string,
  columns: string
): Promise<T | null> {
  if (!uuidSchema.safeParse(idOrToken).success) return null

  const byToken = await admin
    .from(table)
    .select(columns)
    .eq('public_token', idOrToken)
    .maybeSingle()
  if (byToken.data) return byToken.data as unknown as T
  // 42703 = columna inexistente (migración aún no aplicada): seguir al fallback.
  if (byToken.error && byToken.error.code !== '42703') {
    // PGRST116 (0 filas con single) no aplica con maybeSingle; otros errores → log.
    log.warn('lookup por token falló', { table, code: byToken.error.code })
  }

  const byId = await admin.from(table).select(columns).eq('id', idOrToken).maybeSingle()
  return (byId.data as unknown as T) ?? null
}

export interface AssociationInput {
  patient_id?: string | null
  appointment_id?: string | null
}

/**
 * Devuelve asociaciones saneadas: sólo conserva IDs que pertenecen al tenant
 * dueño del recurso. Los IDs ajenos o inválidos se descartan (null) y se
 * registra el intento sin PII.
 */
export async function sanitizeAssociations(
  admin: SupabaseClient,
  ownerUserId: string,
  input: AssociationInput,
  scope: string
): Promise<{ patient_id: string | null; appointment_id: string | null }> {
  let patient_id: string | null = null
  let appointment_id: string | null = null

  if (input.patient_id && uuidSchema.safeParse(input.patient_id).success) {
    const { data } = await admin
      .from('patients')
      .select('id')
      .eq('id', input.patient_id)
      .eq('user_id', ownerUserId)
      .maybeSingle()
    if (data) {
      patient_id = input.patient_id
    } else {
      log.warn('patient_id descartado: no pertenece al tenant del recurso', { scope })
    }
  }

  if (input.appointment_id && uuidSchema.safeParse(input.appointment_id).success) {
    const { data } = await admin
      .from('appointments')
      .select('id')
      .eq('id', input.appointment_id)
      .eq('user_id', ownerUserId)
      .maybeSingle()
    if (data) {
      appointment_id = input.appointment_id
    } else {
      log.warn('appointment_id descartado: no pertenece al tenant del recurso', { scope })
    }
  }

  return { patient_id, appointment_id }
}

export async function readJsonBody(
  req: NextRequest | Request,
  maxBytes = 256_000
): Promise<{ body: unknown } | { error: string; status: number }> {
  const raw = await req.text()
  if (raw.length > maxBytes) return { error: 'Payload too large', status: 413 }
  try {
    return { body: JSON.parse(raw) }
  } catch {
    return { error: 'Invalid JSON', status: 400 }
  }
}
