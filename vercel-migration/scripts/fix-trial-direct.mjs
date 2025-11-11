#!/usr/bin/env node

/**
 * Script directo usando pg para evitar problemas de fetch
 */

import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import readline from 'readline'

const { Client } = pg

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

async function listTrialUsers() {
  let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  // Si no hay connection string, construirla desde componentes individuales
  if (!connectionString && process.env.POSTGRES_HOST) {
    const { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD } = process.env
    connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
  }
  
  if (!connectionString) {
    console.error('❌ Error: No se encontró configuración de base de datos')
    return
  }

  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('📋 Listando todos los usuarios en trial...\n')

    const result = await client.query(`
      SELECT 
        s.id,
        s.user_id,
        u.email,
        s.plan_tier,
        s.stripe_price_id,
        s.max_doctors,
        s.max_locations,
        s.status,
        s.trial_end
      FROM subscriptions s
      JOIN auth.users u ON s.user_id = u.id
      WHERE s.status = 'trialing'
      ORDER BY s.created_at DESC
    `)

    if (result.rows.length === 0) {
      console.log('✓ No hay usuarios en trial actualmente')
      return
    }

    console.log(`Encontrados ${result.rows.length} usuarios en trial:\n`)

    for (const sub of result.rows) {
      const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id)
      const expectedLimits = PLAN_LIMITS[inferredPlan]
      const hasIssue = sub.plan_tier !== inferredPlan || 
                       sub.max_doctors !== expectedLimits.max_doctors

      console.log(`${hasIssue ? '⚠️ ' : '✓ '} ${sub.email}`)
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
  } finally {
    await client.end()
  }
}

async function fixUserTrialPlan(email) {
  let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  // Si no hay connection string, construirla desde componentes individuales
  if (!connectionString && process.env.POSTGRES_HOST) {
    const { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD } = process.env
    connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
  }
  
  if (!connectionString) {
    console.error('❌ Error: No se encontró configuración de base de datos')
    return
  }

  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log(`🔍 Buscando usuario: ${email}\n`)

    // Buscar usuario y su suscripción
    const userResult = await client.query(`
      SELECT 
        s.id,
        s.user_id,
        u.email,
        s.plan_tier,
        s.stripe_price_id,
        s.max_doctors,
        s.max_locations,
        s.status
      FROM subscriptions s
      JOIN auth.users u ON s.user_id = u.id
      WHERE u.email = $1 AND s.status = 'trialing'
    `, [email])

    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró usuario en trial con ese email')
      return
    }

    const sub = userResult.rows[0]
    const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id)
    const expectedLimits = PLAN_LIMITS[inferredPlan]

    console.log('📊 Situación actual:')
    console.log(`   Email: ${sub.email}`)
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

    if (answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's') {
      console.log('❌ Operación cancelada')
      return
    }

    // Actualizar suscripción
    const updateResult = await client.query(`
      UPDATE subscriptions
      SET 
        plan_tier = $1,
        max_doctors = $2,
        max_locations = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [inferredPlan, expectedLimits.max_doctors, expectedLimits.max_locations, sub.id])

    console.log('\n✅ Suscripción actualizada exitosamente:')
    const updated = updateResult.rows[0]
    console.log(`   Plan: ${updated.plan_tier}`)
    console.log(`   Límites: ${updated.max_doctors} doctores, ${updated.max_locations} ubicaciones`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

// Main
const email = process.argv[2]

if (email) {
  fixUserTrialPlan(email)
} else {
  listTrialUsers()
}
