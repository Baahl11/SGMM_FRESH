/**
 * Script para investigar las 3 suscripciones huérfanas de Stripe
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

if (!stripeSecretKey) {
  console.error('❌ Missing Stripe secret key')
  process.exit(1)
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })

const ORPHANED_SUBS = [
  'sub_1SQYowCpe9CE4d2laNm6C3nA', // 6 nov
  'sub_1SQYaOCpe9CE4d2luZTbzd5L', // 6 nov
  'sub_1SJ4LyCpe9CE4d2lkHcbdgRl'  // 16 oct
]

async function investigateSubscription(subId: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`🔍 Investigando suscripción: ${subId}`)
  console.log('='.repeat(80) + '\n')

  try {
    const subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ['customer', 'latest_invoice', 'default_payment_method']
    })

    const customer = subscription.customer as Stripe.Customer
    
    console.log('📋 INFORMACIÓN DE SUSCRIPCIÓN:')
    console.log(`  ID: ${subscription.id}`)
    console.log(`  Status: ${subscription.status}`)
    console.log(`  Created: ${new Date(subscription.created * 1000).toLocaleString()}`)
    console.log(`  Current period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`)
    
    if (subscription.trial_start && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end * 1000)
      const now = new Date()
      const daysSinceTrialEnd = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`\n⏰ TRIAL INFO:`)
      console.log(`  Trial start: ${new Date(subscription.trial_start * 1000).toLocaleString()}`)
      console.log(`  Trial end: ${trialEnd.toLocaleString()}`)
      console.log(`  Days since trial end: ${daysSinceTrialEnd}`)
    }

    console.log(`\n👤 CUSTOMER INFO:`)
    console.log(`  ID: ${customer.id}`)
    console.log(`  Email: ${customer.email}`)
    console.log(`  Name: ${customer.name || 'N/A'}`)

    console.log(`\n💳 PAYMENT INFO:`)
    const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod | null
    if (paymentMethod) {
      console.log(`  Payment method: ${paymentMethod.type}`)
      if (paymentMethod.card) {
        console.log(`  Card: ${paymentMethod.card.brand} •••• ${paymentMethod.card.last4}`)
        console.log(`  Expires: ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`)
      }
    } else {
      console.log(`  ⚠️  NO TIENE MÉTODO DE PAGO REGISTRADO`)
    }

    // Obtener facturas
    console.log(`\n🧾 FACTURAS:`)
    const invoices = await stripe.invoices.list({
      subscription: subId,
      limit: 10
    })

    if (invoices.data.length === 0) {
      console.log(`  ⚠️  No hay facturas generadas`)
    } else {
      for (const invoice of invoices.data) {
        console.log(`\n  Invoice ${invoice.id}:`)
        console.log(`    Amount: $${(invoice.total / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`)
        console.log(`    Status: ${invoice.status}`)
        console.log(`    Paid: ${invoice.paid ? '✅ Sí' : '❌ No'}`)
        console.log(`    Date: ${new Date(invoice.created * 1000).toLocaleString()}`)
        if (invoice.charge) {
          console.log(`    Charge ID: ${invoice.charge}`)
        }
      }
    }

    // Obtener eventos relacionados
    console.log(`\n📡 EVENTOS DE WEBHOOK RECIENTES:`)
    const events = await stripe.events.list({
      type: '*subscription*',
      limit: 20
    })

    const relatedEvents = events.data.filter(e => {
      const eventSub = e.data.object as any
      return eventSub.id === subId
    })

    if (relatedEvents.length === 0) {
      console.log(`  ℹ️  No hay eventos recientes para esta suscripción`)
    } else {
      for (const event of relatedEvents.slice(0, 5)) {
        console.log(`\n  ${event.type}:`)
        console.log(`    ID: ${event.id}`)
        console.log(`    Created: ${new Date(event.created * 1000).toLocaleString()}`)
        console.log(`    Webhook delivered: ${event.request?.id ? '✅ Sí' : '❌ No (simulado)'  }`)
      }
    }

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`)
  }
}

async function checkWebhookEndpoints() {
  console.log('\n' + '='.repeat(80))
  console.log('🌐 VERIFICANDO WEBHOOKS CONFIGURADOS')
  console.log('='.repeat(80) + '\n')

  try {
    const endpoints = await stripe.webhookEndpoints.list()

    if (endpoints.data.length === 0) {
      console.log('❌ NO HAY WEBHOOKS CONFIGURADOS EN STRIPE\n')
      console.log('Esto explica por qué no se sincronizan las suscripciones.\n')
    } else {
      console.log(`📍 Endpoints configurados: ${endpoints.data.length}\n`)
      
      for (const endpoint of endpoints.data) {
        console.log(`  URL: ${endpoint.url}`)
        console.log(`  Status: ${endpoint.status}`)
        console.log(`  Enabled events: ${endpoint.enabled_events.length}`)
        console.log(`  Eventos clave:`)
        
        const keyEvents = [
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.paid',
          'invoice.payment_failed'
        ]
        
        for (const event of keyEvents) {
          const hasEvent = endpoint.enabled_events.includes(event as any)
          console.log(`    ${hasEvent ? '✅' : '❌'} ${event}`)
        }
        console.log('')
      }
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`)
  }
}

async function main() {
  console.log('\n🔍 INVESTIGACIÓN DE SUSCRIPCIONES HUÉRFANAS\n')
  
  for (const subId of ORPHANED_SUBS) {
    await investigateSubscription(subId)
  }

  await checkWebhookEndpoints()

  console.log('\n' + '='.repeat(80))
  console.log('✅ Investigación completada')
  console.log('='.repeat(80) + '\n')

  console.log('📝 RECOMENDACIONES:\n')
  console.log('1. Si no hay webhooks configurados: Configurarlos en Stripe Dashboard')
  console.log('2. Si hay webhooks pero no funcionan: Verificar STRIPE_WEBHOOK_SECRET en .env')
  console.log('3. Migrar manualmente las 3 suscripciones a Supabase con script de sincronización')
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
