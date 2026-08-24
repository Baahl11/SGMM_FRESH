#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

function readArg(flag, fallback = null) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return fallback
  return process.argv[idx + 1] || fallback
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanEnvValue(value, fallback) {
  if (!value) return fallback
  return value
    .replace(/^["']|["']$/g, '')
    .replace(/\r\n|\n|\r/g, '')
    .trim()
}

const userId = readArg('--user')
if (!userId || !isUuid(userId)) {
  console.error('Uso: node scripts/set-demo-enterprise.mjs --user <UUID>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const enterprisePrice = cleanEnvValue(
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY,
  'price_enterprise_demo_default'
)

async function main() {
  const now = new Date()
  const nowIso = now.toISOString()
  const periodEndIso = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()

  const { data: demoConfig, error: demoConfigError } = await supabase
    .from('demo_mode_config')
    .select('is_demo_account')
    .eq('user_id', userId)
    .maybeSingle()

  if (demoConfigError) {
    throw new Error(`No se pudo leer demo_mode_config: ${demoConfigError.message}`)
  }

  if (!demoConfig?.is_demo_account) {
    throw new Error('El usuario indicado no tiene demo_mode_config activo (is_demo_account=true)')
  }

  const { data: existingSub, error: subReadError } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subReadError) {
    throw new Error(`No se pudo leer suscripcion: ${subReadError.message}`)
  }

  const subscriptionId =
    existingSub?.stripe_subscription_id && existingSub.stripe_subscription_id.startsWith('sub_')
      ? existingSub.stripe_subscription_id
      : 'sub_demo_enterprise_manual'

  const subscriptionPayload = {
    plan_tier: 'enterprise',
    status: 'active',
    max_doctors: 999,
    max_locations: 999,
    stripe_price_id: enterprisePrice,
    stripe_subscription_id: subscriptionId,
    trial_start: null,
    trial_end: null,
    current_period_start: nowIso,
    current_period_end: periodEndIso,
    updated_at: nowIso,
  }

  if (existingSub?.id) {
    const { error: subUpdateError } = await supabase
      .from('subscriptions')
      .update(subscriptionPayload)
      .eq('id', existingSub.id)

    if (subUpdateError) {
      throw new Error(`No se pudo actualizar suscripcion: ${subUpdateError.message}`)
    }
  } else {
    const { error: subInsertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        ...subscriptionPayload,
        created_at: nowIso,
      })

    if (subInsertError) {
      throw new Error(`No se pudo crear suscripcion enterprise: ${subInsertError.message}`)
    }
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'enterprise',
      updated_at: nowIso,
    })
    .eq('id', userId)

  if (userUpdateError) {
    console.warn(`Aviso: no se pudo actualizar users.subscription_tier (${userUpdateError.message})`)
  }

  const { data: verifiedSub, error: verifySubError } = await supabase
    .from('subscriptions')
    .select('plan_tier, status, max_doctors, max_locations, stripe_price_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (verifySubError) {
    throw new Error(`No se pudo verificar suscripcion actualizada: ${verifySubError.message}`)
  }

  const { data: verifiedUser, error: verifyUserError } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  if (verifyUserError) {
    console.warn(`Aviso: no se pudo verificar users.subscription_tier (${verifyUserError.message})`)
  }

  console.log('Demo actualizada a Enterprise correctamente')
  console.log(`user_id: ${userId}`)
  console.log(`subscriptions.plan_tier: ${verifiedSub?.plan_tier}`)
  console.log(`subscriptions.status: ${verifiedSub?.status}`)
  console.log(`subscriptions.max_doctors: ${verifiedSub?.max_doctors}`)
  console.log(`subscriptions.max_locations: ${verifiedSub?.max_locations}`)
  console.log(`users.subscription_tier: ${verifiedUser?.subscription_tier}`)
  console.log(`users.subscription_tier: ${verifiedUser?.subscription_tier ?? 'n/a'}`)
}

main().catch((error) => {
  console.error('Error:', error.message || error)
  process.exit(1)
})
