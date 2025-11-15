/**
 * FORZAR COBRO INMEDIATO A JUAN - Terminar trial ahora
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  console.log('\n💰 TERMINANDO TRIAL DE JUAN Y COBRANDO $999 MXN\n');
  console.log('='.repeat(70));

  const subscriptionId = 'sub_1SQYowCpe9CE4d2laNm6C3nA';
  const customerId = 'cus_TNJR4FrB18TbhM';

  try {
    console.log('\n⏰ Terminando trial inmediatamente...');
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      trial_end: 'now',
      proration_behavior: 'create_prorations',
    });

    console.log(`✅ Trial terminado!`);
    console.log(`   Status: ${updatedSub.status}`);
    
    // Esperar a que Stripe genere la factura
    console.log('\n⏳ Esperando generación de factura...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Obtener última factura
    const invoicesList = await stripe.invoices.list({
      customer: customerId,
      limit: 3,
    });
    
    console.log('\n🧾 FACTURAS:\n');
    for (const inv of invoicesList.data) {
      console.log(`   ${inv.id}`);
      console.log(`   Amount: $${(inv.amount_due / 100).toFixed(2)} MXN`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Created: ${new Date(inv.created * 1000).toLocaleString()}`);
      if (inv.amount_due > 0) {
        console.log(`   🔗 URL: ${inv.hosted_invoice_url || 'N/A'}`);
      }
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('\n✅ LISTO! Juan ahora debe pagar $999 MXN');
    console.log('   Stripe cobrará automáticamente a su tarjeta');
    console.log('   Próximo cobro: 13 dic 2025\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
