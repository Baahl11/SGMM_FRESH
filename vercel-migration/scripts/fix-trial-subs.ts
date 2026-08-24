/**
 * Script para corregir suscripciones en trial que tienen plan_tier incorrecto
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

// Cargar .env.local desde el directorio raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

type PlanTier = 'basico' | 'pro' | 'enterprise'

interface PlanLimits {
  max_doctors: number
  max_locations: number
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  basico: { max_doctors: 2, max_locations: 1 },
  pro: { max_doctors: 10, max_locations: 5 },
  enterprise: { max_doctors: 999, max_locations: 999 }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function inferPlanFromPriceId(priceId: string | null): PlanTier {
  if (!priceId) return 'basico'
  if (priceId.includes('pro')) return 'pro'
  if (priceId.includes('enterprise')) return 'enterprise'
  return 'basico'
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan credenciales de Supabase')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listTrialUsers() {
  console.log('📋 Listando todos los usuarios en trial...\n')

  try {
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

    for (const sub of subscriptions) {
      const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id)
      const email = userData?.user?.email || 'Email no disponible'
      
      const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id as string | null)
      const expectedLimits = PLAN_LIMITS[inferredPlan]
      const hasIssue = sub.plan_tier !== inferredPlan || 
                       sub.max_doctors !== expectedLimits.max_doctors

      console.log(`${hasIssue ? '⚠️ ' : '✓ '} ${email}`)
      console.log(`   Plan actual: ${sub.plan_tier} (${sub.max_doctors} doctores, ${sub.max_locations} ubicaciones)`)
      console.log(`   Stripe Price: ${sub.stripe_price_id || 'N/A'}`)
      console.log(`   Plan inferido: ${inferredPlan} (debería tener ${expectedLimits.max_doctors} doctores)`)
      console.log(`   Trial termina: ${sub.trial_end || 'N/A'}`)
      if (hasIssue) {
        console.log('   🔧 NECESITA CORRECCIÓN')
      }
      console.log()
    }
  } catch (error: unknown) {
    console.error('❌ Error:', getErrorMessage(error))
    console.error(error)
  }
}

async function fixUserTrialPlan(email: string) {
  console.log(`🔍 Buscando usuario: ${email}\n`)

  try {
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const user = usersData?.users?.find((candidate) => candidate.email === email)

    if (!user) {
      console.log('❌ No se encontró usuario con ese email')
      return
    }

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
    const inferredPlan = inferPlanFromPriceId(sub.stripe_price_id as string | null)
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

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise<string>((resolve) => {
      rl.question('¿Actualizar suscripción? (si/no): ', resolve)
    })
    rl.close()

    if (!['si', 's', 'yes', 'y'].includes(answer.toLowerCase())) {
      console.log('❌ Operación cancelada')
      return
    }

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

    const updatedSub = updated[0]
    console.log('\n✅ Suscripción actualizada exitosamente:')
    console.log(`   Plan: ${updatedSub.plan_tier}`)
    console.log(`   Límites: ${updatedSub.max_doctors} doctores, ${updatedSub.max_locations} ubicaciones`)

  } catch (error: unknown) {
    console.error('❌ Error:', getErrorMessage(error))
    console.error(error)
  }
}

// Main
const email = process.argv[2]

if (email) {
  fixUserTrialPlan(email).then(() => process.exit(0))
} else {
  listTrialUsers().then(() => process.exit(0))
}
