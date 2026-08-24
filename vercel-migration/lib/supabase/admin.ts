import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente admin de Supabase (service role).
 *
 * REGLAS (auditoría fable 2026-06-11, hallazgo C7):
 * - Este módulo es SERVER-ONLY. Importarlo desde un client component rompe el
 *   build a propósito (paquete `server-only`).
 * - El cliente se crea de forma perezosa: nunca al evaluar el módulo, para que
 *   el build no exija secretos y para fallar con un mensaje claro en runtime.
 * - En producción NUNCA se usan claves ficticias: si falta el secreto se lanza
 *   un error (fail-closed). El fallback silencioso anterior queda eliminado.
 */

let adminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminInstance) return adminInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[supabase/admin] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
          'El cliente admin no puede inicializarse en producción sin secretos.'
      )
    }
     
    console.warn(
      '[supabase/admin] Variables de entorno ausentes; usando cliente no funcional de desarrollo.'
    )
  }

  adminInstance = createSupabaseClient(url ?? 'http://localhost', serviceKey ?? 'dev-only-missing-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return adminInstance
}

/**
 * Export de compatibilidad para el código existente que usa `supabaseAdmin`
 * como objeto. Internamente delega en getSupabaseAdmin() de forma perezosa.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
