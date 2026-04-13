#!/usr/bin/env node

/**
 * Script para crear códigos promocionales en Stripe
 * Uso: node create-promo-codes.js
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function createPromoCodes() {
  console.log('🎫 Creando códigos promocionales en Stripe...\n');

  try {
    // 1. TRIAL7 - Trial de 7 días sin tarjeta (100% OFF)
    console.log('1️⃣ Creando código TRIAL7...');
    
    let coupon1;
    try {
      coupon1 = await stripe.coupons.create({
        id: 'trial7-coupon',
        name: 'Trial 7 Días Gratis',
        percent_off: 100,
        duration: 'once',
        max_redemptions: 1000,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Cupón ya existe, usando existente...');
        coupon1 = await stripe.coupons.retrieve('trial7-coupon');
      } else {
        throw error;
      }
    }

    let promo1;
    try {
      promo1 = await stripe.promotionCodes.create({
        coupon: 'trial7-coupon',
        code: 'TRIAL7',
        max_redemptions: 1000,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Código promocional ya existe...');
        const codes = await stripe.promotionCodes.list({ code: 'TRIAL7' });
        promo1 = codes.data[0];
      } else {
        throw error;
      }
    }

    console.log('   ✅ Código TRIAL7 creado exitosamente');
    console.log('   📋 ID:', promo1.id);
    console.log('   💯 Descuento: 100% OFF en primer pago');
    console.log('   🎯 Uso: Sin tarjeta requerida inicialmente');
    console.log('   ⏰ Duración: 7 días\n');

    // 2. BIENVENIDO50 - 50% descuento en primer mes
    console.log('2️⃣ Creando código BIENVENIDO50...');
    
    let coupon2;
    try {
      coupon2 = await stripe.coupons.create({
        id: 'bienvenido50-coupon',
        name: 'Bienvenida 50% Descuento',
        percent_off: 50,
        duration: 'once',
        max_redemptions: 500,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Cupón ya existe, usando existente...');
        coupon2 = await stripe.coupons.retrieve('bienvenido50-coupon');
      } else {
        throw error;
      }
    }

    let promo2;
    try {
      promo2 = await stripe.promotionCodes.create({
        coupon: 'bienvenido50-coupon',
        code: 'BIENVENIDO50',
        max_redemptions: 500,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Código promocional ya existe...');
        const codes = await stripe.promotionCodes.list({ code: 'BIENVENIDO50' });
        promo2 = codes.data[0];
      } else {
        throw error;
      }
    }

    console.log('   ✅ Código BIENVENIDO50 creado exitosamente');
    console.log('   📋 ID:', promo2.id);
    console.log('   💰 Descuento: 50% OFF en primer pago');
    console.log('   🎯 Uso: Tarjeta requerida');
    console.log('   ⏰ Duración: Solo primer mes\n');

    // 3. DEMO14 - Trial extendido para clientes VIP
    console.log('3️⃣ Creando código DEMO14...');
    
    let coupon3;
    try {
      coupon3 = await stripe.coupons.create({
        id: 'demo14-coupon',
        name: 'Demo Extendida 14 Días',
        percent_off: 100,
        duration: 'once',
        max_redemptions: 50,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Cupón ya existe, usando existente...');
        coupon3 = await stripe.coupons.retrieve('demo14-coupon');
      } else {
        throw error;
      }
    }

    let promo3;
    try {
      promo3 = await stripe.promotionCodes.create({
        coupon: 'demo14-coupon',
        code: 'DEMO14',
        max_redemptions: 50,
      });
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log('   ℹ️  Código promocional ya existe...');
        const codes = await stripe.promotionCodes.list({ code: 'DEMO14' });
        promo3 = codes.data[0];
      } else {
        throw error;
      }
    }

    console.log('   ✅ Código DEMO14 creado exitosamente');
    console.log('   📋 ID:', promo3.id);
    console.log('   💯 Descuento: 100% OFF');
    console.log('   🎯 Uso: Para clientes VIP');
    console.log('   ⏰ Duración: 14 días\n');

    console.log('✨ ¡Todos los códigos creados exitosamente!\n');
    console.log('📝 Instrucciones de uso:');
    console.log('   1. Los usuarios van a /select-trial-plan');
    console.log('   2. Seleccionan un plan');
    console.log('   3. En Stripe Checkout aparece "¿Tienes un código promocional?"');
    console.log('   4. Ingresan TRIAL7, BIENVENIDO50, o DEMO14');
    console.log('   5. Con TRIAL7: NO se pide tarjeta (100% descuento)');
    console.log('   6. Día 8: Sistema pide agregar tarjeta para continuar\n');

  } catch (error) {
    console.error('❌ Error creando códigos:', error.message);
    process.exit(1);
  }
}

// Ejecutar
createPromoCodes();
