#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const PLAN_LIMITS = {
  basico: { max_doctors: 2, max_locations: 1 },
  pro: { max_doctors: 10, max_locations: 5 },
  enterprise: { max_doctors: 999, max_locations: 999 }
}

function inferPlanFromPriceId(priceId) {
  if (!priceId) return 'basico'
  if (priceId.includes('pro')) return 'pro'
  if (priceId.includes('enterprise')) return 'enterprise'
  return 'basico'
}

// Usar cliente admin con la service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan credenciales de Supabase')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Crear cliente admin
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'apikey': serviceRoleKey
    }
  }
})

async function listTrialUsers() {
  console.log('📋 Listando todos los usuarios en trial...\n')

  try {
    // Consulta directa a la tabla de suscripciones
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'trialing')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error al consultar suscripciones:', error.message)
      return
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✓ No hay usuarios en trial actualmente')
      return
    }

    console.log(`Encontrados ${subscriptions.length} usuarios en trial:\n`)

    // Para cada suscripción, obtener el email del usuario
    for (const sub of subscriptions) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(sub.user_id)
      
      const email = userData?.user?.email || 'Email no disponible'
      const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id)
      const expectedLimits = PLAN_LIMITS[inferredPlan]
      const hasIssue = sub.plan_tier !== inferredPlan || 
                       sub.max_doctors !== expectedLimits.max_doctors

      console.log(`${hasIssue ? '⚠️ ' : '✓ '} ${email}`)
      console.log(`   Plan actual: ${sub.plan_tier} (${sub.max_doctors} doctores, ${sub.max_locations} ubicaciones)`)
      console.log(`   Stripe Price: ${sub.stripe_price_id || 'N/A'}`)
      console.log(`   Plan inferido: ${inferredPlan} (debería tener ${expectedLimits.max_doctors} doctores)`)
      console.log(`   Trial termina: ${sub.trial_end ? new Date(sub.trial_end).toLocaleDateString() : 'N/A'}`)
      if (hasIssue) {
        console.log(`   🔧 NECESITA CORRECCIÓN`)
      }
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  }
}

async function fixUserTrialPlan(email) {
  console.log(`🔍 Buscando usuario: ${email}\n`)

  try {
    // Buscar usuario por email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error al buscar usuario:', userError.message)
      return
    }

    const user = userData.users.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ No se encontró usuario con ese email')
      return
    }

    // Buscar suscripción en trial
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'trialing')

    if (subError) {
      console.error('❌ Error al buscar suscripción:', subError.message)
      return
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('❌ No se encontró suscripción en trial para este usuario')
      return
    }

    const sub = subscriptions[0]
    const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id)
    const expectedLimits = PLAN_LIMITS[inferredPlan]

    console.log('📊 Situación actual:')
    console.log(`   Email: ${email}`)
    console.log(`   Plan actual: ${sub.plan_tier}`)
    console.log(`   Límites actuales: ${sub.max_doctors} doctores, ${sub.max_locations} ubicaciones`)
    console.log(`   Stripe Price ID: ${sub.stripe_price_id || 'N/A'}`)
    console.log()
    console.log('🎯 Plan correcto inferido:')
    console.log(`   Plan: ${inferredPlan}`)
    console.log(`   Límites correctos: ${expectedLimits.max_doctors} doctores, ${expectedLimits.max_locations} ubicaciones`)
    console.log()

    if (sub.plan_tier === inferredPlan && 
        sub.max_doctors === expectedLimits.max_doctors &&
        sub.max_locations === expectedLimits.max_locations) {
      console.log('✓ El usuario ya tiene el plan correcto. No se necesitan cambios.')
      return
    }

    // Pedir confirmación
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question('¿Actualizar suscripción? (si/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Operación cancelada')
      return
    }

    // Actualizar suscripción
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_tier: inferredPlan,
        max_doctors: expectedLimits.max_doctors,
        max_locations: expectedLimits.max_locations,
        updated_at: new Date().toISOString()
      })
      .eq('id', sub.id)
      .select()

    if (updateError) {
      console.error('❌ Error al actualizar:', updateError.message)
      return
    }

    console.log('\n✅ Suscripción actualizada exitosamente:')
    const updatedSub = updated[0]
    console.log(`   Plan: ${updatedSub.plan_tier}`)
    console.log(`   Límites: ${updatedSub.max_doctors} doctores, ${updatedSub.max_locations} ubicaciones`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  }
}

// Main
const email = process.argv[2]

if (email) {
  await fixUserTrialPlan(email)
} else {
  await listTrialUsers()
}

process.exit(0)
