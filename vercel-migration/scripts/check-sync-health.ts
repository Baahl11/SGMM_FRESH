import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSyncHealth() {
  console.log('🔍 Verificando sincronización Stripe ↔ Supabase...\n')

  // Obtener todas las suscripciones activas de Stripe
  const stripeSubscriptions = await stripe.subscriptions.list({
    status: 'all',
    limit: 100
  })

  // Obtener todas las suscripciones de Supabase
  const { data: supabaseSubscriptions } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, user_id, plan_tier, status')

  const supabaseSubIds = new Set(
    supabaseSubscriptions?.map(s => s.stripe_subscription_id).filter(Boolean) || []
  )

  console.log(`📊 Stripe: ${stripeSubscriptions.data.length} suscripciones`)
  console.log(`📊 Supabase: ${supabaseSubscriptions?.length || 0} suscripciones\n`)

  // Buscar suscripciones huérfanas (en Stripe pero no en Supabase)
  const orphaned = stripeSubscriptions.data.filter(sub => 
    !supabaseSubIds.has(sub.id)
  )

  if (orphaned.length === 0) {
    console.log('✅ ¡Todo sincronizado! No hay suscripciones huérfanas.\n')
  } else {
    console.log(`⚠️ ${orphaned.length} suscripciones huérfanas encontradas:\n`)
    
    for (const sub of orphaned) {
      const customer = await stripe.customers.retrieve(sub.customer as string)
      console.log(`❌ ${sub.id}`)
      console.log(`   Customer: ${(customer as any).email}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Created: ${new Date(sub.created * 1000).toLocaleString()}`)
      console.log(`   Amount: ${sub.items.data[0].price.unit_amount} ${sub.items.data[0].price.currency}`)
      console.log()
    }
  }
}

checkSyncHealth().catch(console.error)
