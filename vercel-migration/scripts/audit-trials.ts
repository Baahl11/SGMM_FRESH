/**
 * Script para auditar el estado de trials y suscripciones
 * Detecta trials vencidos, suscripciones sin cobro, etc.
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

if (!stripeSecretKey) {
  console.error('❌ Missing Stripe secret key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })

interface SubscriptionIssue {
  user_email: string
  subscription_id: string
  issue: string
  trial_start?: string
  trial_end?: string
  status: string
  stripe_subscription_id?: string
  days_since_trial_end?: number
}

async function auditAllSubscriptions() {
  console.log('🔍 Auditando todas las suscripciones...\n')
  
  const issues: SubscriptionIssue[] = []
  const now = new Date()

  try {
    // Obtener todas las suscripciones
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      return
    }

    console.log(`📊 Total suscripciones: ${subscriptions?.length || 0}\n`)

    for (const sub of subscriptions || []) {
      const userEmail = (sub.users as any)?.email || 'Unknown'
      
      // ISSUE 1: Trial vencido pero aún en status 'trialing'
      if (sub.status === 'trialing' && sub.trial_end) {
        const trialEndDate = new Date(sub.trial_end)
        const daysSinceEnd = Math.floor((now.getTime() - trialEndDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (trialEndDate < now) {
          issues.push({
            user_email: userEmail,
            subscription_id: sub.id,
            issue: `❌ TRIAL VENCIDO hace ${daysSinceEnd} días pero status='trialing'`,
            trial_start: sub.trial_start,
            trial_end: sub.trial_end,
            status: sub.status,
            stripe_subscription_id: sub.stripe_subscription_id,
            days_since_trial_end: daysSinceEnd
          })
        }
      }

      // ISSUE 2: Suscripción sin stripe_subscription_id después del trial
      if (!sub.stripe_subscription_id && sub.status !== 'trialing') {
        issues.push({
          user_email: userEmail,
          subscription_id: sub.id,
          issue: '⚠️ Sin Stripe subscription_id en status activo/cancelado',
          status: sub.status
        })
      }

      // ISSUE 3: Verificar en Stripe si existe
      if (sub.stripe_subscription_id) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
          
          // Comparar status
          const stripeStatus = stripeSub.status
          const dbStatus = sub.status
          
          if (stripeStatus !== dbStatus) {
            issues.push({
              user_email: userEmail,
              subscription_id: sub.id,
              issue: `🔄 Status desincronizado: DB='${dbStatus}' vs Stripe='${stripeStatus}'`,
              status: dbStatus,
              stripe_subscription_id: sub.stripe_subscription_id
            })
          }

          // Verificar si trial debería haber terminado
          if (stripeSub.status === 'trialing' && stripeSub.trial_end) {
            const stripeTrialEnd = new Date(stripeSub.trial_end * 1000)
            if (stripeTrialEnd < now) {
              const daysSinceEnd = Math.floor((now.getTime() - stripeTrialEnd.getTime()) / (1000 * 60 * 60 * 24))
              issues.push({
                user_email: userEmail,
                subscription_id: sub.id,
                issue: `⏰ Trial vencido en STRIPE hace ${daysSinceEnd} días - posible falta de método de pago`,
                trial_end: stripeTrialEnd.toISOString(),
                status: stripeSub.status,
                stripe_subscription_id: sub.stripe_subscription_id,
                days_since_trial_end: daysSinceEnd
              })
            }
          }
        } catch (stripeError: any) {
          if (stripeError.code === 'resource_missing') {
            issues.push({
              user_email: userEmail,
              subscription_id: sub.id,
              issue: '❌ Stripe subscription NO EXISTE (eliminada manualmente?)',
              stripe_subscription_id: sub.stripe_subscription_id,
              status: sub.status
            })
          }
        }
      }
    }

    // Reporte de issues
    console.log('\n' + '='.repeat(80))
    console.log('📋 REPORTE DE PROBLEMAS ENCONTRADOS')
    console.log('='.repeat(80) + '\n')

    if (issues.length === 0) {
      console.log('✅ No se encontraron problemas. Todas las suscripciones están correctas.\n')
    } else {
      console.log(`❌ Se encontraron ${issues.length} problemas:\n`)

      // Agrupar por tipo de issue
      const groupedIssues = issues.reduce((acc, issue) => {
        const key = issue.issue.split(':')[0] || issue.issue
        if (!acc[key]) acc[key] = []
        acc[key].push(issue)
        return acc
      }, {} as Record<string, SubscriptionIssue[]>)

      for (const [issueType, issueList] of Object.entries(groupedIssues)) {
        console.log(`\n${issueType} (${issueList.length})`)
        console.log('-'.repeat(80))
        
        for (const issue of issueList) {
          console.log(`\n  Usuario: ${issue.user_email}`)
          console.log(`  Subscription ID: ${issue.subscription_id}`)
          console.log(`  Issue: ${issue.issue}`)
          console.log(`  Status: ${issue.status}`)
          if (issue.stripe_subscription_id) {
            console.log(`  Stripe ID: ${issue.stripe_subscription_id}`)
          }
          if (issue.trial_end) {
            console.log(`  Trial terminó: ${new Date(issue.trial_end).toLocaleDateString()}`)
          }
          if (issue.days_since_trial_end) {
            console.log(`  Días desde fin de trial: ${issue.days_since_trial_end}`)
          }
        }
      }
    }

    // Resumen de trials activos
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN DE TRIALS ACTIVOS')
    console.log('='.repeat(80) + '\n')

    const activeTrials = subscriptions?.filter(s => s.status === 'trialing' && s.trial_end) || []
    
    if (activeTrials.length === 0) {
      console.log('ℹ️  No hay trials activos actualmente.\n')
    } else {
      console.log(`Total trials activos: ${activeTrials.length}\n`)
      
      for (const trial of activeTrials) {
        const userEmail = (trial.users as any)?.email || 'Unknown'
        const trialEnd = new Date(trial.trial_end!)
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        console.log(`  • ${userEmail}`)
        console.log(`    Termina: ${trialEnd.toLocaleDateString()} (${daysRemaining} días)`)
        console.log(`    Stripe ID: ${trial.stripe_subscription_id || 'Sin Stripe ID'}`)
        console.log(`    Plan: ${trial.plan_tier}`)
        console.log('')
      }
    }

  } catch (error) {
    console.error('❌ Error durante auditoría:', error)
  }
}

// Función para listar suscripciones de Stripe que no están en DB
async function auditOrphanedStripeSubscriptions() {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 BUSCANDO SUSCRIPCIONES DE STRIPE SIN REGISTRO EN DB')
  console.log('='.repeat(80) + '\n')

  try {
    // Obtener todos los stripe_subscription_id de la DB
    const { data: dbSubs } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null)

    const dbStripeIds = new Set(dbSubs?.map(s => s.stripe_subscription_id) || [])

    // Listar suscripciones activas en Stripe
    const stripeSubs = await stripe.subscriptions.list({
      limit: 100,
      status: 'all'
    })

    const orphaned = stripeSubs.data.filter(s => !dbStripeIds.has(s.id))

    if (orphaned.length === 0) {
      console.log('✅ Todas las suscripciones de Stripe están registradas en DB.\n')
    } else {
      console.log(`⚠️  Encontradas ${orphaned.length} suscripciones en Stripe sin registro en DB:\n`)
      
      for (const sub of orphaned) {
        console.log(`  • Stripe ID: ${sub.id}`)
        console.log(`    Status: ${sub.status}`)
        console.log(`    Customer: ${sub.customer}`)
        console.log(`    Created: ${new Date(sub.created * 1000).toLocaleDateString()}`)
        console.log('')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Main execution
async function main() {
  console.log('\n' + '🔍 AUDITORÍA DE TRIALS Y SUSCRIPCIONES'.padStart(50) + '\n')
  console.log('Fecha: ' + new Date().toLocaleString())
  console.log('='.repeat(80) + '\n')

  await auditAllSubscriptions()
  await auditOrphanedStripeSubscriptions()

  console.log('\n' + '='.repeat(80))
  console.log('✅ Auditoría completada')
  console.log('='.repeat(80) + '\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
