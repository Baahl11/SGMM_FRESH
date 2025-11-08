/**
 * Script para crear códigos promocionales en Stripe
 * 
 * Ejecutar: node create_promo_codes.js
 * 
 * Requisito: Tener STRIPE_SECRET_KEY en .env
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPromoCodes() {
  try {
    console.log('🎯 Creando códigos promocionales en Stripe...\n');

    // 1. Crear cupón de 100% descuento para trial sin tarjeta
    console.log('📌 Cupón 1: Trial 7 días SIN tarjeta (100% descuento)');
    const trialCoupon = await stripe.coupons.create({
      name: 'Trial 7 Días Sin Tarjeta',
      percent_off: 100,
      duration: 'repeating',
      duration_in_months: 1, // 100% off durante 1 mes
      max_redemptions: 100, // Máximo 100 usos
    });
    console.log(`✅ Cupón creado: ${trialCoupon.id}`);

    // Crear código promocional para el cupón
    const trialPromo = await stripe.promotionCodes.create({
      coupon: trialCoupon.id,
      code: 'TRIAL7',
      max_redemptions: 100,
    });
    console.log(`✅ Código: TRIAL7 (100 usos disponibles)\n`);

    // 2. Crear cupón de 50% descuento primer mes
    console.log('📌 Cupón 2: 50% OFF Primer Mes');
    const welcomeCoupon = await stripe.coupons.create({
      name: 'Bienvenida 50% OFF',
      percent_off: 50,
      duration: 'once', // Solo se aplica al primer pago
      max_redemptions: 500,
    });
    console.log(`✅ Cupón creado: ${welcomeCoupon.id}`);

    const welcomePromo = await stripe.promotionCodes.create({
      coupon: welcomeCoupon.id,
      code: 'BIENVENIDO50',
      max_redemptions: 500,
    });
    console.log(`✅ Código: BIENVENIDO50 (500 usos)\n`);

    // 3. Crear cupón VIP para demos
    console.log('📌 Cupón 3: Demo 14 días 100% OFF');
    const demoCoupon = await stripe.coupons.create({
      name: 'Demo 14 Días VIP',
      percent_off: 100,
      duration: 'repeating',
      duration_in_months: 1,
      max_redemptions: 50,
    });
    console.log(`✅ Cupón creado: ${demoCoupon.id}`);

    const demoPromo = await stripe.promotionCodes.create({
      coupon: demoCoupon.id,
      code: 'DEMO14',
      max_redemptions: 50,
    });
    console.log(`✅ Código: DEMO14 (50 usos)\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ CÓDIGOS CREADOS EXITOSAMENTE\n');
    console.log('📋 Resumen de códigos:');
    console.log('');
    console.log('1️⃣  TRIAL7');
    console.log('   • 100% OFF durante 1 mes');
    console.log('   • Para usuarios nuevos sin tarjeta');
    console.log('   • Máximo 100 usos');
    console.log('');
    console.log('2️⃣  BIENVENIDO50');
    console.log('   • 50% OFF en el primer pago');
    console.log('   • Descuento único');
    console.log('   • Máximo 500 usos');
    console.log('');
    console.log('3️⃣  DEMO14');
    console.log('   • 100% OFF durante 1 mes');
    console.log('   • Para demos y clientes VIP');
    console.log('   • Máximo 50 usos');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Los usuarios pueden ingresar estos códigos');
    console.log('   en el checkout de Stripe automáticamente.');
    console.log('');
    console.log('📊 Monitorea el uso en:');
    console.log('   https://dashboard.stripe.com/coupons');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'resource_already_exists') {
      console.log('\n⚠️  Los códigos ya existen. Para ver/editar:');
      console.log('   https://dashboard.stripe.com/coupons');
    }
  }
}

// Ejecutar
createPromoCodes();
