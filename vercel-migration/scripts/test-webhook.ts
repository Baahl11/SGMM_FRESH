import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

async function testWebhook() {
  console.log('🧪 Enviando webhook de prueba...\n')
  
  const webhookEndpointId = 'we_1SIzjMCpe9CE4d2l' // Tu webhook ID (búscalo en Stripe Dashboard si es diferente)
  
  try {
    // Crear un evento de prueba
    const testEvent = await stripe.webhookEndpoints.createTestEvent(webhookEndpointId, {
      event: 'customer.subscription.created'
    })
    
    console.log('✅ Webhook de prueba enviado!')
    console.log(`📬 Event ID: ${testEvent.id}`)
    console.log('\n📝 Ve a Stripe Dashboard → Webhooks → AgendaMedPro → Recent events')
    console.log('Deberías ver el evento con status 200 (exitoso)')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Alternativamente, crea una suscripción de prueba en:')
    console.log('https://dashboard.stripe.com/test/subscriptions/create')
  }
}

testWebhook()
