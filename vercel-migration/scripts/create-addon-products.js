#!/usr/bin/env node
/**
 * Create Add-on Products in Stripe Live Mode
 * 
 * Creates:
 * 1. Ubicación Extra - $499 MXN/mes (recurring)
 * 2. Doctor Adicional - $199 MXN/mes (recurring)
 * 
 * Usage: node scripts/create-addon-products.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ADDONS = [
  {
    name: 'Ubicación Extra',
    description: 'Agrega una ubicación adicional a tu plan',
    type: 'extra_location',
    price: 49900, // $499 MXN in centavos
    currency: 'mxn',
    interval: 'month'
  },
  {
    name: 'Doctor Adicional',
    description: 'Agrega un doctor/colaborador adicional a tu plan',
    type: 'extra_doctor',
    price: 19900, // $199 MXN in centavos
    currency: 'mxn',
    interval: 'month'
  }
];

async function createAddonProducts() {
  console.log('🎯 Creating Add-on Products in Stripe Live Mode\n');
  console.log('='.repeat(60));

  const results = [];

  for (const addon of ADDONS) {
    try {
      console.log(`\n📦 Creating: ${addon.name}`);
      
      // 1. Create Product
      const product = await stripe.products.create({
        name: addon.name,
        description: addon.description,
        metadata: {
          addon_type: addon.type,
          category: 'addon'
        }
      });
      
      console.log(`✅ Product created: ${product.id}`);
      
      // 2. Create Price (recurring)
      const price = await stripe.prices.create({
        product: product.id,
        currency: addon.currency,
        unit_amount: addon.price,
        recurring: {
          interval: addon.interval
        },
        metadata: {
          addon_type: addon.type
        }
      });
      
      console.log(`💰 Price created: ${price.id}`);
      console.log(`   Amount: $${(addon.price / 100).toFixed(2)} ${addon.currency.toUpperCase()}/${addon.interval}`);
      
      results.push({
        addon_type: addon.type,
        product_id: product.id,
        price_id: price.id,
        amount: addon.price,
        currency: addon.currency
      });
      
    } catch (error) {
      console.error(`❌ Error creating ${addon.name}:`, error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY - Add to your .env.local:\n');
  
  results.forEach(result => {
    const envVarName = `NEXT_PUBLIC_STRIPE_PRICE_ADDON_${result.addon_type.toUpperCase()}`;
    console.log(`${envVarName}=${result.price_id}`);
  });
  
  console.log('\n📋 Full Details:\n');
  console.log(JSON.stringify(results, null, 2));
  
  console.log('\n✅ Done! Add the price IDs to your Vercel environment variables.');
  console.log('   Vercel Dashboard → Settings → Environment Variables');
}

// Run
createAddonProducts().catch(console.error);
