import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase ANON compartido (browser-safe).
 *
 * Auditoría fable 2026-06-11 (C7): este módulo creaba también el cliente admin
 * con SUPABASE_SERVICE_ROLE_KEY y era importado desde client components.
 * El cliente admin vive ahora EXCLUSIVAMENTE en `lib/supabase/admin.ts`
 * (server-only). Importar `supabaseAdmin` desde aquí ya no es posible.
 */

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!envUrl || !envAnon) {
   
  console.error(
    '[AgendaMedPro] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no configuradas. ' +
      'La app no podrá conectarse a Supabase. Configure .env.local (ver .env.example).'
  )
}

const supabaseUrl = envUrl ?? 'http://localhost'
const supabaseKey = envAnon ?? 'anon-dev-key'

let supabaseInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
})()

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export function isSupabaseConfigured() {
  return Boolean(envUrl && envAnon)
}
