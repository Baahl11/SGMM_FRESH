#!/usr/bin/env node

/**
 * Script para verificar el estado del trial de un usuario
 * Uso: node scripts/check-trial-status.js <email>
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTrialStatus(email) {
  try {
    console.log(`\n🔍 Buscando usuario: ${email}\n`)

    // Buscar usuario por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ Usuario no encontrado')
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.name || 'N/A'}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'N/A'}`)
    console.log(`   Legacy Tier: ${user.subscription_tier || 'free'}`)
    console.log(`   Legacy Status: ${user.subscription_status || 'N/A'}`)

    // Buscar suscripción activa
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      console.log('\n⚠️  No se encontró suscripción en la tabla subscriptions')
      return
    }

    console.log('\n✅ Suscripción encontrada:')
    console.log(`   Plan Tier: ${subscription.plan_tier}`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Stripe Subscription ID: ${subscription.stripe_subscription_id || 'N/A'}`)
    console.log(`   Stripe Price ID: ${subscription.stripe_price_id || 'N/A'}`)
    
    if (subscription.trial_start) {
      console.log(`\n🎉 TRIAL ACTIVO:`)
      console.log(`   Inicio: ${new Date(subscription.trial_start).toLocaleString('es-MX')}`)
      console.log(`   Fin: ${new Date(subscription.trial_end).toLocaleString('es-MX')}`)
      
      const now = new Date()
      const trialEnd = new Date(subscription.trial_end)
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
      console.log(`   Días restantes: ${daysRemaining}`)
    } else {
      console.log('\n⚠️  No hay trial activo')
    }

    if (subscription.current_period_start) {
      console.log(`\n💳 Período de facturación:`)
      console.log(`   Inicio: ${new Date(subscription.current_period_start).toLocaleString('es-MX')}`)
      console.log(`   Fin: ${new Date(subscription.current_period_end).toLocaleString('es-MX')}`)
    }

    console.log(`\n📊 Límites:`)
    console.log(`   Máximo doctores: ${subscription.max_doctors}`)
    console.log(`   Máximo ubicaciones: ${subscription.max_locations}`)

    console.log('\n✅ Verificación completada\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Main
const email = process.argv[2]

if (!email) {
  console.error('❌ Error: Debes proporcionar un email')
  console.error('Uso: node scripts/check-trial-status.js <email>')
  process.exit(1)
}

checkTrialStatus(email)
