/**
 * FORZAR COBRO INMEDIATO A JUAN CAMARILLO
 * El trial terminó pero Stripe cobró $0.00
 * Necesitamos crear una factura inmediata por $999 MXN
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function forceChargeJuan() {
  console.log('\n💰 FORZAR COBRO A JUAN CAMARILLO\n');
  console.log('='.repeat(70));

  const subscriptionId = 'sub_1SQYowCpe9CE4d2laNm6C3nA';
  const customerId = 'cus_TNJR4FrB18TbhM';

  try {
    // 1. Obtener suscripción actual
    console.log('\n📋 Obteniendo suscripción actual...');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log(`✅ Suscripción: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Trial end: ${new Date(subscription.trial_end! * 1000).toLocaleString()}`);
    console.log(`   Current period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} → ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    
    // 2. Verificar facturas
    console.log('\n🧾 Facturas recientes:');
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 5,
    });

    for (const invoice of invoices.data) {
      console.log(`   • ${invoice.id}`);
      console.log(`     Amount: $${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`);
      console.log(`     Status: ${invoice.status}`);
      console.log(`     Created: ${new Date(invoice.created * 1000).toLocaleString()}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 OPCIONES PARA COBRAR AHORA:\n');

    console.log('OPCIÓN 1: Crear factura inmediata (RECOMENDADO)');
    console.log('─'.repeat(70));
    console.log('Esto creará una factura por $999 MXN que se cobrará inmediatamente\n');
    
    console.log('💳 Creando factura...');
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Auto-finalizar y cobrar
      collection_method: 'charge_automatically',
      description: 'Cobro por término de periodo de prueba - Plan Pro',
    });

    // Agregar item de factura
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      price: 'price_1SPCEeCpe9CE4d2lVOu5pTIP', // Plan Pro Monthly $999 (LIVE MODE)
      description: 'Plan Pro - Noviembre 2025',
    });

    // Finalizar y cobrar
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(`✅ Factura creada: ${finalizedInvoice.id}`);
    console.log(`   Amount: $${(finalizedInvoice.amount_due / 100).toFixed(2)} MXN`);
    console.log(`   Status: ${finalizedInvoice.status}`);
    console.log(`   Hosted URL: ${finalizedInvoice.hosted_invoice_url}`);

    console.log('\nOPCIÓN 2: Acortar el periodo actual');
    console.log('─'.repeat(70));
    console.log('Esto cambiará la fecha de renovación del 13 dic al 17 nov\n');
    console.log('¿Ejecutar? (Descomenta el código abajo)\n');

    // DESCOMENTAR PARA EJECUTAR:
    /*
    const targetDate = new Date('2025-11-17T16:47:37Z'); // 17 nov según Supabase
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

    console.log('📅 Actualizando periodo de suscripción...');
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      billing_cycle_anchor: targetTimestamp,
      proration_behavior: 'create_prorations', // Crear prorratas
    });

    console.log(`✅ Suscripción actualizada`);
    console.log(`   Nuevo billing cycle: ${new Date(updatedSub.billing_cycle_anchor * 1000).toLocaleString()}`);
    console.log(`   Se generará factura automáticamente el 17 nov`);
    */

    console.log('OPCIÓN 3: Cancelar trial inmediatamente y cobrar');
    console.log('─'.repeat(70));
    console.log('Esto termina el trial AHORA y genera factura inmediata de $999 MXN\n');
    
    console.log('⏰ Terminando trial y forzando cobro...');
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      trial_end: 'now',
      proration_behavior: 'create_prorations',
    });

    console.log(`✅ Trial terminado`);
    console.log(`   Status: ${updatedSub.status}`);
    console.log(`   Current period: ${new Date(updatedSub.current_period_start * 1000).toLocaleDateString()} → ${new Date(updatedSub.current_period_end * 1000).toLocaleDateString()}`);
    
    // Esperar un momento y verificar factura
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 1,
    });
    
    if (invoices.data.length > 0) {
      const latestInvoice = invoices.data[0];
      console.log(`\n🧾 Factura generada:`);
      console.log(`   ID: ${latestInvoice.id}`);
      console.log(`   Amount: $${(latestInvoice.amount_due / 100).toFixed(2)} MXN`);
      console.log(`   Status: ${latestInvoice.status}`);
      console.log(`   Hosted URL: ${latestInvoice.hosted_invoice_url || 'N/A'}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n⚠️  IMPORTANTE: Descomenta una de las opciones arriba y vuelve a ejecutar');
  console.log('    Recomendación: OPCIÓN 1 (crear factura inmediata)\n');
}

forceChargeJuan()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
