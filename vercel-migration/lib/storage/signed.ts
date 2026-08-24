import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Firmado de objetos de Storage (auditoría fable 2026-06-11, C4).
 *
 * Contexto: los buckets `invoices` y `gastos-facturas` eran públicos y el
 * código guardaba getPublicUrl() en la base. La migración
 * 20260611130000_private_storage_buckets.sql los vuelve privados; este helper
 * permite que las filas HISTÓRICAS (con URL pública completa) y las NUEVAS
 * (que guardan sólo la ruta del objeto) sigan funcionando: en lectura se
 * extrae la ruta y se genera una signed URL de corta duración.
 */

export const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hora

/**
 * Acepta una ruta de objeto ("uid/archivo.pdf") o una URL completa de Supabase
 * (pública o firmada) y devuelve la ruta dentro del bucket, o null si el valor
 * no corresponde a ese bucket.
 */
export function extractStoragePath(bucket: string, stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!/^https?:\/\//i.test(stored)) {
    return stored.replace(/^\/+/, '')
  }
  try {
    const url = new URL(stored)
    const marker = new RegExp(`/storage/v1/object/(?:public|sign|authenticated)/${bucket}/(.+)$`)
    const match = url.pathname.match(marker)
    if (!match) return null
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

/**
 * Devuelve una signed URL para el valor almacenado (ruta o URL legacy).
 * Si no se puede firmar, devuelve null — nunca la URL pública original.
 */
export async function signStoredObject(
  admin: SupabaseClient,
  bucket: string,
  stored: string | null | undefined,
  expiresIn: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const path = extractStoragePath(bucket, stored)
  if (!path) return null
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
