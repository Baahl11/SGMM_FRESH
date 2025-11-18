/**
 * Script para crear el producto Lifetime en Stripe Live Mode
 * Ejecutar con: node scripts/create-lifetime-product.js
 */

const Stripe = require('stripe')

// Leer la clave de Stripe desde variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY?.trim(), {
  apiVersion: '2025-09-30.clover',
})

async function createLifetimeProduct() {
  try {
    console.log('🚀 Creando producto Lifetime en Stripe...\n')

    // 1. Crear el producto
    const product = await stripe.products.create({
      name: 'AgendaMedPro Lifetime',
      description: 'Licencia de por vida - Todas las funcionalidades del plan Enterprise sin renovaciones',
      metadata: {
        plan_tier: 'enterprise',
        billing_type: 'lifetime',
      },
    })

    console.log('✅ Producto creado:')
    console.log(`   ID: ${product.id}`)
    console.log(`   Nombre: ${product.name}`)
    console.log()

    // 2. Crear el precio (one-time payment)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1999000, // $19,990 MXN en centavos
      currency: 'mxn',
      billing_scheme: 'per_unit',
      metadata: {
        plan_tier: 'enterprise',
        billing_cycle: 'lifetime',
      },
    })

    console.log('✅ Precio creado:')
    console.log(`   ID: ${price.id}`)
    console.log(`   Monto: $${(price.unit_amount / 100).toLocaleString('es-MX')} MXN`)
    console.log(`   Tipo: One-time payment`)
    console.log()

    console.log('📋 PRÓXIMOS PASOS:')
    console.log('1. Ve a Vercel Dashboard → Settings → Environment Variables')
    console.log('2. Agrega o actualiza esta variable:')
    console.log()
    console.log(`   NEXT_PUBLIC_STRIPE_PRICE_LIFETIME = ${price.id}`)
    console.log()
    console.log('3. Redeploy automático se ejecutará')
    console.log()
    console.log('✅ ¡Listo! El producto Lifetime está creado en Stripe Live Mode')

  } catch (error) {
    console.error('❌ Error creando producto Lifetime:', error.message)
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Verifica que STRIPE_SECRET_KEY esté configurada correctamente')
      console.error('   Debe ser tu clave de LIVE mode (sk_live_...)')
    }
    
    process.exit(1)
  }
}

// Ejecutar
createLifetimeProduct()
