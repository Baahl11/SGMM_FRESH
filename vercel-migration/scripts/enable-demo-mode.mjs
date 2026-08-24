#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local'), quiet: true })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function readArg(flag, fallback = null) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return fallback
  return process.argv[idx + 1] || fallback
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

const userId = readArg('--user')
const profile = (readArg('--profile', 'STANDARD') || 'STANDARD').toUpperCase()
const expiresDaysRaw = readArg('--days', '30')
const createdBy = readArg('--by', 'sales-ops')

const expiresDays = Number(expiresDaysRaw)
if (!userId) {
  console.error('❌ Debes indicar --user <UUID>.')
  console.error('Ejemplo: npm run demo:enable -- --user 86cbe61c-8829-41a2-aa29-81e11844f83e --profile STANDARD --days 30')
  process.exit(1)
}

if (!isUuid(userId)) {
  console.error('❌ --user debe ser un UUID válido (auth.users.id).')
  process.exit(1)
}

if (!['LIGHT', 'STANDARD', 'ENTERPRISE'].includes(profile)) {
  console.error('❌ --profile inválido. Usa LIGHT, STANDARD o ENTERPRISE.')
  process.exit(1)
}

if (!Number.isFinite(expiresDays) || expiresDays <= 0) {
  console.error('❌ --days debe ser un número mayor a 0.')
  process.exit(1)
}

const integrations = {
  email: { enabled: false, mock: true },
  whatsapp: { enabled: false, mock: true },
  sms: { enabled: false, mock: true },
  stripe: { enabled: false, mock: true },
  facturama: { enabled: false, mock: true },
  google_calendar: { enabled: false, mock: true },
  mercadopago: { enabled: false, mock: true },
}

const demoExpiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()

async function main() {
  const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId)

  if (authUserError || !authUser?.user) {
    console.error('❌ Usuario no encontrado en auth.users:', authUserError?.message || userId)
    process.exit(1)
  }

  const payload = {
    user_id: userId,
    is_demo_account: true,
    audit_label: 'DEMO',
    seed_profile: profile,
    created_by: createdBy,
    notes: `Demo habilitada desde script (${new Date().toISOString()})`,
    integrations,
    demo_created_at: new Date().toISOString(),
    demo_expires_at: demoExpiresAt,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('demo_mode_config').upsert(payload, {
    onConflict: 'user_id',
  })

  if (error) {
    console.error('❌ Error habilitando demo mode:', error.message)
    process.exit(1)
  }

  console.log('✅ Demo mode habilitado correctamente')
  console.log(`   user_id: ${userId}`)
  console.log(`   email: ${authUser.user.email}`)
  console.log(`   profile: ${profile}`)
  console.log(`   expires_at: ${demoExpiresAt}`)
}

main().catch((error) => {
  console.error('❌ Error inesperado:', error)
  process.exit(1)
})
