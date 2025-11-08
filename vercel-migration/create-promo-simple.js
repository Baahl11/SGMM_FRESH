#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

async function createCodes() {
  console.log('🎫 Creando códigos promocionales...\n');

  try {
    // TRIAL7
    console.log('1️⃣ TRIAL7...');
    const c1 = await stripe.coupons.create({
      name: 'Trial 7 Días',
      percent_off: 100,
      duration: 'once',
    });
    const p1 = await stripe.promotionCodes.create({
      coupon: c1.id,
      code: 'TRIAL7',
    });
    console.log('✅ TRIAL7 creado:', p1.id);

    // BIENVENIDO50
    console.log('\n2️⃣ BIENVENIDO50...');
    const c2 = await stripe.coupons.create({
      name: 'Bienvenida 50%',
      percent_off: 50,
      duration: 'once',
    });
    const p2 = await stripe.promotionCodes.create({
      coupon: c2.id,
      code: 'BIENVENIDO50',
    });
    console.log('✅ BIENVENIDO50 creado:', p2.id);

    // DEMO14
    console.log('\n3️⃣ DEMO14...');
    const c3 = await stripe.coupons.create({
      name: 'Demo 14 Días',
      percent_off: 100,
      duration: 'once',
    });
    const p3 = await stripe.promotionCodes.create({
      coupon: c3.id,
      code: 'DEMO14',
    });
    console.log('✅ DEMO14 creado:', p3.id);

    console.log('\n✨ Todos los códigos creados exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'resource_already_exists') {
      console.log('\n⚠️  Los códigos ya existen.');
      console.log('Ve a: https://dashboard.stripe.com/coupons');
      console.log('Elimina trial7-coupon, bienvenido50-coupon, demo14-coupon');
      console.log('Y vuelve a ejecutar el script.');
    }
  }
}

createCodes();
