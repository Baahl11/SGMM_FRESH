import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Allow local dev to boot without secrets; use placeholders if envs are missing
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const envService = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseUrl = envUrl ?? 'http://localhost'
const supabaseKey = envAnon ?? 'anon-dev-key'

if (!envUrl || !envAnon) {
  // eslint-disable-next-line no-console
  console.warn('[SGMM][Vercel Migration] Supabase env not set. Using placeholders for local boot. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for real data.')
}

// Singleton instances to avoid multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Singleton client instance
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
})()

// Para operaciones que requieren privilegios de administrador (solo en server)
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createSupabaseClient(
      supabaseUrl,
      envService ?? 'service-role-dev-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseAdminInstance
})()

// Function to create client instance for API routes (returns singleton)
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export function isSupabaseConfigured() {
  return Boolean(envUrl && envAnon)
}