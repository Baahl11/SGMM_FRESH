/**
 * Script para sincronizar manualmente suscripciones de Stripe a Supabase
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })

async function syncSubscriptionToSupabase(stripeSubId: string, dryRun: boolean = true) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔄 Sincronizando: ${stripeSubId}`)
  console.log(`${'='.repeat(80)}\n`)

  try {
    // 1. Obtener datos de Stripe
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
      expand: ['customer']
    })

    const customer = stripeSub.customer as Stripe.Customer
    console.log(`📧 Email: ${customer.email}`)

    // 2. Buscar usuario en Supabase por email
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, users:user_id(email)')
      .eq('user_id', customer.metadata?.supabase_user_id || '')
      .single()

    let userId: string | null = null

    if (userError || !users) {
      // Buscar por email en auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error(`❌ Error buscando usuario: ${authError.message}`)
        return
      }

      const matchedUser = authUsers.users.find(u => u.email === customer.email)
      
      if (!matchedUser) {
        console.error(`❌ No se encontró usuario con email ${customer.email}`)
        console.log(`   Opciones:`)
        console.log(`   1. El usuario se registró con otro email`)
        console.log(`   2. La suscripción fue creada manualmente en Stripe`)
        console.log(`   3. El usuario fue eliminado de Supabase`)
        return
      }

      userId = matchedUser.id
      console.log(`✅ Usuario encontrado: ${matchedUser.id}`)
    } else {
      userId = users.user_id
      console.log(`✅ Usuario encontrado: ${userId}`)
    }

    // 3. Determinar plan_tier basado en price
    let planTier = 'basico'
    const priceId = stripeSub.items.data[0]?.price?.id

    if (priceId) {
      if (priceId.includes('pro') || stripeSub.items.data[0]?.price?.unit_amount === 99900) {
        planTier = 'pro'
      } else if (priceId.includes('enterprise') || stripeSub.items.data[0]?.price?.unit_amount === 199900) {
        planTier = 'enterprise'
      }
    }

    console.log(`📦 Plan detectado: ${planTier}`)

    // 4. Preparar datos para insertar
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: stripeSub.id,
      stripe_customer_id: customer.id,
      status: stripeSub.status,
      plan_tier: planTier,
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
      trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
      max_doctors: planTier === 'basico' ? 2 : planTier === 'pro' ? 10 : 999,
      max_locations: planTier === 'basico' ? 1 : planTier === 'pro' ? 5 : 999,
      created_at: new Date(stripeSub.created * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log(`\n📋 Datos a insertar:`)
    console.log(JSON.stringify(subscriptionData, null, 2))

    if (dryRun) {
      console.log(`\n🔵 DRY RUN - No se insertará en la base de datos`)
      console.log(`   Para aplicar cambios, ejecuta: npm run sync-subs -- --apply`)
    } else {
      // 5. Verificar si ya existe
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', stripeSub.id)
        .single()

      if (existing) {
        console.log(`\n⚠️  La suscripción ya existe en Supabase (ID: ${existing.id})`)
        console.log(`   Actualizando...`)
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existing.id)

        if (updateError) {
          console.error(`❌ Error al actualizar: ${updateError.message}`)
        } else {
          console.log(`✅ Suscripción actualizada exitosamente`)
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (insertError) {
          console.error(`❌ Error al insertar: ${insertError.message}`)
          console.error(`   Detalles:`, insertError)
        } else {
          console.log(`✅ Suscripción sincronizada exitosamente`)
          console.log(`   ID en Supabase: ${inserted.id}`)
        }
      }
    }

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')

  console.log(`\n🔄 SINCRONIZACIÓN DE SUSCRIPCIONES STRIPE → SUPABASE\n`)
  
  if (dryRun) {
    console.log(`🔵 MODO DRY RUN - No se modificará la base de datos`)
    console.log(`   Para aplicar cambios reales, ejecuta: npm run sync-subs -- --apply\n`)
  } else {
    console.log(`🔴 MODO APLICACIÓN - Se modificará la base de datos\n`)
  }

  const ORPHANED_SUBS = [
    'sub_1SQYowCpe9CE4d2laNm6C3nA', // Juan Camarillo #1
    'sub_1SQYaOCpe9CE4d2luZTbzd5L', // Juan Camarillo #2 (DUPLICADO)
    'sub_1SJ4LyCpe9CE4d2lkHcbdgRl'  // Guillermo (gmelgarejom@gmail.com)
  ]

  for (const subId of ORPHANED_SUBS) {
    await syncSubscriptionToSupabase(subId, dryRun)
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`✅ Sincronización completada`)
  console.log(`${'='.repeat(80)}\n`)

  if (dryRun) {
    console.log(`📝 PRÓXIMOS PASOS:\n`)
    console.log(`1. Revisar los datos arriba`)
    console.log(`2. Si todo se ve correcto, ejecutar: npx tsx scripts/sync-orphaned-subs.ts --apply`)
    console.log(`3. Verificar en Supabase que las suscripciones se crearon correctamente`)
    console.log(`4. IMPORTANTE: Configurar webhook 'invoice.paid' en Stripe Dashboard\n`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
