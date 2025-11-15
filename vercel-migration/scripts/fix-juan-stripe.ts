import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

async function fixJuanSubscriptions() {
  const customerID = 'cus_RKCnYiMD22hfWC'
  const userID = '35b8c48e-44a2-4d7d-beb9-767b8a35b8db'
  
  console.log('🔍 Analizando suscripciones de Juan Camarillo...\n')
  
  // 1. Listar todas las suscripciones del cliente
  const subscriptions = await stripe.subscriptions.list({
    customer: customerID,
    limit: 10
  })
  
  console.log(`📋 Cliente tiene ${subscriptions.data.length} suscripciones:\n`)
  
  subscriptions.data.forEach((sub, i) => {
    console.log(`${i + 1}. ID: ${sub.id}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Plan: ${sub.items.data[0].price.nickname || sub.items.data[0].price.id}`)
    console.log(`   Monto: ${sub.items.data[0].price.unit_amount} ${sub.items.data[0].price.currency}`)
    console.log(`   Trial end: ${sub.trial_end ? new Date(sub.trial_end * 1000).toLocaleString() : 'No trial'}`)
    console.log()
  })
  
  // 2. Cancelar las suscripciones Básicas
  console.log('❌ Cancelando suscripciones Básicas...\n')
  
  const basicSubs = [
    'sub_1SQYowCpe9CE4d2laNm6C3nA',
    'sub_1SQYaOCpe9CE4d2luZTbzd5L'
  ]
  
  for (const subId of basicSubs) {
    try {
      const canceled = await stripe.subscriptions.cancel(subId)
      console.log(`✅ Cancelada: ${subId} - Status: ${canceled.status}`)
    } catch (error: any) {
      console.log(`⚠️ Error cancelando ${subId}: ${error.message}`)
    }
  }
  
  console.log('\n✨ Creando nueva suscripción Plan Pro...\n')
  
  // 3. Crear nueva suscripción Plan Pro
  const proPriceId = 'price_1SJ3dDCpe9CE4d2lqT0oNxHm' // Plan Pro $999 MXN
  
  const newSub = await stripe.subscriptions.create({
    customer: customerID,
    items: [{ price: proPriceId }],
    trial_period_days: 7,
    metadata: {
      supabase_user_id: userID
    }
  })
  
  console.log(`✅ Suscripción Pro creada:`)
  console.log(`   ID: ${newSub.id}`)
  console.log(`   Status: ${newSub.status}`)
  console.log(`   Trial hasta: ${new Date(newSub.trial_end! * 1000).toLocaleString()}`)
  console.log(`   Siguiente cobro: ${new Date(newSub.current_period_end * 1000).toLocaleString()}`)
  
  console.log('\n📝 SQL para actualizar Supabase:\n')
  console.log(`UPDATE subscriptions SET`)
  console.log(`  stripe_subscription_id = '${newSub.id}',`)
  console.log(`  stripe_customer_id = '${customerID}',`)
  console.log(`  stripe_price_id = '${proPriceId}',`)
  console.log(`  status = '${newSub.status}',`)
  console.log(`  plan_tier = 'pro',`)
  console.log(`  max_locations = 5,`)
  console.log(`  max_doctors = 10,`)
  console.log(`  current_period_start = to_timestamp(${newSub.current_period_start}),`)
  console.log(`  current_period_end = to_timestamp(${newSub.current_period_end}),`)
  console.log(`  updated_at = NOW()`)
  console.log(`WHERE user_id = '${userID}';`)
}

fixJuanSubscriptions().catch(console.error)
