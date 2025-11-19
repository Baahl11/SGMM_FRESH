#!/usr/bin/env node

/**
 * Script para crear precios de Enterprise en Stripe (modo producción)
 * Ejecutar: node scripts/create-enterprise-prices.js
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
})

async function createEnterprisePrices() {
  console.log('\n🚀 CREANDO PRECIOS DE ENTERPRISE EN STRIPE (PRODUCCIÓN)\n')
  console.log('=' .repeat(70))

  try {
    // 1. Buscar o crear producto Enterprise
    console.log('\n1️⃣  Buscando producto Enterprise...')
    
    const products = await stripe.products.list({ limit: 100 })
    let enterpriseProduct = products.data.find(p => 
      p.name.toLowerCase().includes('enterprise') || 
      p.metadata?.tier === 'enterprise'
    )

    if (!enterpriseProduct) {
      console.log('   ⚠️  Producto Enterprise no existe, creando...')
      enterpriseProduct = await stripe.products.create({
        name: 'Enterprise Plan - AgendaMedPro',
        description: 'Para grupos médicos grandes con necesidades avanzadas',
        metadata: {
          tier: 'enterprise',
          max_doctors: '999',
          max_locations: '999',
        },
      })
      console.log(`   ✅ Producto creado: ${enterpriseProduct.id}`)
    } else {
      console.log(`   ✅ Producto encontrado: ${enterpriseProduct.id} - ${enterpriseProduct.name}`)
    }

    // 2. Crear precio mensual
    console.log('\n2️⃣  Creando precio mensual Enterprise...')
    const monthlyPrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      currency: 'mxn',
      unit_amount: 299900, // $2,999 MXN
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
      metadata: {
        tier: 'enterprise',
        billing_cycle: 'monthly',
      },
    })
    console.log(`   ✅ Precio mensual creado: ${monthlyPrice.id}`)
    console.log(`   💰 Precio: $2,999 MXN/mes + 7 días de prueba`)

    // 3. Crear precio anual
    console.log('\n3️⃣  Creando precio anual Enterprise...')
    const annualPrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      currency: 'mxn',
      unit_amount: 2999000, // $29,990 MXN
      recurring: {
        interval: 'year',
        trial_period_days: 7,
      },
      metadata: {
        tier: 'enterprise',
        billing_cycle: 'annual',
      },
    })
    console.log(`   ✅ Precio anual creado: ${annualPrice.id}`)
    console.log(`   💰 Precio: $29,990 MXN/año + 7 días de prueba`)

    // 4. Mostrar resumen
    console.log('\n' + '=' .repeat(70))
    console.log('\n✅ PRECIOS CREADOS EXITOSAMENTE\n')
    console.log('📋 Copia estos valores a tus variables de entorno:\n')
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=${monthlyPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL=${annualPrice.id}`)
    
    console.log('\n🔧 Comando para actualizar Vercel:\n')
    console.log(`vercel env add NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY production`)
    console.log(`# Cuando te pida el valor, pega: ${monthlyPrice.id}\n`)
    console.log(`vercel env add NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL production`)
    console.log(`# Cuando te pida el valor, pega: ${annualPrice.id}\n`)

    return {
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Verifica que STRIPE_SECRET_KEY en .env.local sea la clave de PRODUCCIÓN (sk_live_xxx)')
      console.error('   Las claves de test (sk_test_xxx) no funcionarán aquí.')
    }
    
    throw error
  }
}

// Ejecutar
if (require.main === module) {
  createEnterprisePrices()
    .then(prices => {
      console.log('\n✨ Script completado exitosamente\n')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Script falló:', error.message)
      process.exit(1)
    })
}

module.exports = { createEnterprisePrices }
