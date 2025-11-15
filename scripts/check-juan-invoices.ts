/**
 * Verificar facturas de Juan después del cambio de billing cycle
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  console.log('\n🧾 VERIFICANDO FACTURAS DE JUAN\n');
  
  const customerId = 'cus_TNJR4FrB18TbhM';
  
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });

  console.log(`Total facturas: ${invoices.data.length}\n`);

  for (const inv of invoices.data) {
    const date = new Date(inv.created * 1000);
    console.log(`${inv.id}`);
    console.log(`  Date: ${date.toLocaleString()}`);
    console.log(`  Amount: $${(inv.amount_due / 100).toFixed(2)} ${inv.currency.toUpperCase()}`);
    console.log(`  Status: ${inv.status}`);
    console.log(`  Paid: ${inv.paid ? '✅ Sí' : '❌ No'}`);
    if (inv.hosted_invoice_url) {
      console.log(`  URL: ${inv.hosted_invoice_url}`);
    }
    console.log('');
  }

  //  Ver próxima factura
  try {
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });

    console.log('📅 PRÓXIMA FACTURA:');
    console.log(`  Amount: $${(upcomingInvoice.amount_due / 100).toFixed(2)} ${upcomingInvoice.currency.toUpperCase()}`);
    console.log(`  Period: ${new Date(upcomingInvoice.period_start * 1000).toLocaleDateString()} → ${new Date(upcomingInvoice.period_end * 1000).toLocaleDateString()}`);
    console.log(`  Next payment attempt: ${upcomingInvoice.next_payment_attempt ? new Date(upcomingInvoice.next_payment_attempt * 1000).toLocaleString() : 'N/A'}\n`);
  } catch (e: any) {
    console.log('⚠️  No hay próxima factura programada\n');
  }
}

main();
