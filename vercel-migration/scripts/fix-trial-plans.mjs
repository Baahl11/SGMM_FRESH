#!/usr/bin/env node

/**
 * Script para corregir suscripciones en trial que tienen plan_tier incorrecto
 * 
 * Problema: Usuarios con trial de PRO pero tienen plan_tier='basico' en la BD
 * Resultado: Se les aplican límites de BÁSICO (2 doctores) en lugar de PRO (10 doctores)
 * 
 * Uso: node scripts/fix-trial-plans.mjs [email]
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const PLAN_LIMITS = {
  basico: { max_doctors: 2, max_locations: 1 },
  pro: { max_doctors: 10, max_locations: 5 },
  enterprise: { max_doctors: 999, max_locations: 999 }
}

async function fixUserTrialPlan(email) {
  console.log(`\n🔍 Buscando usuario: ${email}`)
  
  // 1. Buscar usuario
  const { data: user, error: userError } = await supabase.auth.admin.listUsers()
  const foundUser = user?.users.find(u => u.email === email)
  
  if (userError || !foundUser) {
    console.error('❌ Usuario no encontrado')
    return
  }

  console.log(`✅ Usuario encontrado: ${foundUser.email} (${foundUser.id})`)

  // 2. Obtener suscripción
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', foundUser.id)
    .single()

  if (subError || !subscription) {
    console.log('⚠️  No se encontró suscripción')
    return
  }

  console.log('\n📊 Suscripción actual:')
  console.log(`   Plan Tier: ${subscription.plan_tier}`)
  console.log(`   Status: ${subscription.status}`)
  console.log(`   Max Doctors: ${subscription.max_doctors}`)
  console.log(`   Max Locations: ${subscription.max_locations}`)
  console.log(`   Stripe Price ID: ${subscription.stripe_price_id || 'N/A'}`)
  
  if (subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end)
    const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
    console.log(`   Trial End: ${trialEnd.toLocaleString('es-MX')} (${daysLeft} días restantes)`)
  }

  // 3. Analizar Stripe Price ID para determinar el plan correcto
  let correctPlan = subscription.plan_tier
  const priceId = subscription.stripe_price_id

  if (priceId) {
    if (priceId.includes('pro') || priceId.includes('PRO')) {
      correctPlan = 'pro'
    } else if (priceId.includes('enterprise') || priceId.includes('ENTERPRISE')) {
      correctPlan = 'enterprise'
    } else if (priceId.includes('basico') || priceId.includes('BASICO') || priceId.includes('basic')) {
      correctPlan = 'basico'
    }
  }

  console.log(`\n🎯 Plan determinado por Stripe Price ID: ${correctPlan}`)

  // 4. Verificar si necesita corrección
  const needsFixing = 
    subscription.plan_tier !== correctPlan ||
    subscription.max_doctors !== PLAN_LIMITS[correctPlan].max_doctors ||
    subscription.max_locations !== PLAN_LIMITS[correctPlan].max_locations

  if (!needsFixing) {
    console.log('\n✅ La suscripción ya tiene los límites correctos. No requiere corrección.')
    return
  }

  console.log('\n⚠️  CORRECCIÓN NECESARIA:')
  console.log(`   Plan actual: ${subscription.plan_tier} (${subscription.max_doctors} doctores)`)
  console.log(`   Plan correcto: ${correctPlan} (${PLAN_LIMITS[correctPlan].max_doctors} doctores)`)

  // 5. Confirmar corrección
  console.log('\n❓ ¿Deseas corregir la suscripción? (presiona ENTER para continuar, CTRL+C para cancelar)')
  await new Promise(resolve => {
    process.stdin.once('data', resolve)
  })

  // 6. Aplicar corrección
  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      plan_tier: correctPlan,
      max_doctors: PLAN_LIMITS[correctPlan].max_doctors,
      max_locations: PLAN_LIMITS[correctPlan].max_locations,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', foundUser.id)
    .select()
    .single()

  if (updateError) {
    console.error('\n❌ Error al actualizar:', updateError)
    return
  }

  console.log('\n✅ SUSCRIPCIÓN CORREGIDA:')
  console.log(`   Plan Tier: ${updated.plan_tier}`)
  console.log(`   Max Doctors: ${updated.max_doctors}`)
  console.log(`   Max Locations: ${updated.max_locations}`)
  console.log('\n🎉 El usuario ahora puede agregar hasta', updated.max_doctors, 'doctores')
}

async function listTrialUsers() {
  console.log('\n📋 Listando todos los usuarios en trial...\n')

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('user_id, plan_tier, max_doctors, max_locations, status, stripe_price_id, trial_end')
    .eq('status', 'trialing')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No hay usuarios en trial')
    return
  }

  // Obtener información de usuarios
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const userMap = new Map(authUsers.users.map(u => [u.id, u]))

  console.log(`Total: ${subscriptions.length} usuarios en trial\n`)

  for (const sub of subscriptions) {
    const user = userMap.get(sub.user_id)
    const email = user?.email || 'N/A'
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null
    const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0

    // Detectar inconsistencias
    const priceIdSuggestsPro = sub.stripe_price_id?.toLowerCase().includes('pro')
    const planIsPro = sub.plan_tier === 'pro'
    const hasCorrectLimits = sub.max_doctors === PLAN_LIMITS[sub.plan_tier]?.max_doctors

    const warning = (priceIdSuggestsPro && !planIsPro) || !hasCorrectLimits ? '⚠️ ' : ''

    console.log(`${warning}${email}`)
    console.log(`  Plan: ${sub.plan_tier} | Límites: ${sub.max_doctors} docs, ${sub.max_locations} locs`)
    console.log(`  Price ID: ${sub.stripe_price_id || 'N/A'}`)
    console.log(`  Trial: ${daysLeft} días restantes`)
    console.log()
  }
}

// Main
const email = process.argv[2]

if (!email) {
  // Si no se proporciona email, listar todos los usuarios en trial
  listTrialUsers()
} else {
  fixUserTrialPlan(email)
}
