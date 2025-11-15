/**
 * ACORTAR CICLO DE FACTURACIÓN - Cobrar el 17 nov en vez del 13 dic
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  console.log('\n📅 ACORTAR CICLO DE FACTURACIÓN DE JUAN\n');
  console.log('='.repeat(70));
  console.log('\nCambiar próximo cobro de 13 dic → 17 nov (HOY)\n');

  const subscriptionId = 'sub_1SQYowCpe9CE4d2laNm6C3nA';

  try {
    // Fecha objetivo: 17 nov 2025 (según Supabase trial_end)
    const targetDate = new Date('2025-11-17T16:47:37Z');
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

    console.log(`🎯 Fecha objetivo: ${targetDate.toLocaleString()}`);
    console.log(`   Unix timestamp: ${targetTimestamp}\n`);

    console.log('📅 Reiniciando ciclo de facturación AHORA...');
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      billing_cycle_anchor: 'now',
      proration_behavior: 'create_prorations',
    });

    console.log(`✅ Suscripción actualizada!`);
    console.log(`   Status: ${updatedSub.status}`);
    console.log(`   Billing cycle anchor: ${new Date(updatedSub.billing_cycle_anchor * 1000).toLocaleString()}`);
    console.log(`   Current period: ${new Date(updatedSub.current_period_start * 1000).toLocaleDateString()} → ${new Date(updatedSub.current_period_end * 1000).toLocaleDateString()}`);

    console.log('\n⏳ Esperando generación de factura...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Ver facturas
    const invoicesList = await stripe.invoices.list({
      customer: updatedSub.customer as string,
      limit: 3,
    });

    console.log('\n🧾 FACTURAS RECIENTES:\n');
    for (const inv of invoicesList.data) {
      console.log(`   ${inv.id}`);
      console.log(`   Amount: $${(inv.amount_due / 100).toFixed(2)} MXN`);
      console.log(`   Status: ${inv.status}`);
      if (inv.amount_due > 0) {
        console.log(`   🔗 URL: ${inv.hosted_invoice_url || 'N/A'}`);
      }
      console.log('');
    }

    console.log('='.repeat(70));
    if (targetDate < new Date()) {
      console.log('\n⚠️  La fecha objetivo ya pasó!');
      console.log('   Stripe debería generar factura inmediatamente');
    } else {
      console.log(`\n✅ Próximo cobro programado para: ${targetDate.toLocaleDateString()}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.raw) {
      console.error('   Detalles:', JSON.stringify(error.raw, null, 2));
    }
  }
}

main()
  .then(() => {
    console.log('\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
