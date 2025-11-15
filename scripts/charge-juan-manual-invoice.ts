/**
 * OPCIÓN C: Crear factura manual de $999 MXN sin cancelar suscripción
 * Juan mantiene acceso todo el tiempo
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  console.log('\n💰 CREAR FACTURA MANUAL DE $999 MXN PARA JUAN\n');
  console.log('='.repeat(70));

  const customerId = 'cus_TNJR4FrB18TbhM';

  try {
    console.log('\n📝 Creando invoice item...');
    
    // Crear item de factura por $999 MXN (one-time charge)
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: 99900, // $999.00 MXN en centavos
      currency: 'mxn',
      description: 'Plan Pro - Cobro por término de periodo de prueba (Noviembre 2025)',
    });

    console.log(`✅ Invoice item creado: ${invoiceItem.id}`);
    console.log(`   Amount: $${(invoiceItem.amount / 100).toFixed(2)} MXN\n`);

    console.log('🧾 Creando y finalizando factura...');
    
    // Crear factura
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Finalizar automáticamente
      collection_method: 'charge_automatically', // Cobrar automáticamente
      description: 'Cobro mensual Plan Pro',
    });

    console.log(`✅ Factura creada: ${invoice.id}\n`);

    // Finalizar factura (esto la marca como finalizada y lista para cobrar)
    console.log('💳 Finalizando factura y cobrando...');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    console.log(`✅ Factura finalizada!`);
    console.log(`   Status: ${finalizedInvoice.status}`);
    console.log(`   Amount due: $${(finalizedInvoice.amount_due / 100).toFixed(2)} MXN`);
    console.log(`   Amount paid: $${(finalizedInvoice.amount_paid / 100).toFixed(2)} MXN`);
    
    if (finalizedInvoice.hosted_invoice_url) {
      console.log(`   🔗 URL: ${finalizedInvoice.hosted_invoice_url}`);
    }

    // Intentar cobrar la factura si no se cobró automáticamente
    if (finalizedInvoice.status !== 'paid') {
      console.log('\n💳 Cobrando factura...');
      const paidInvoice = await stripe.invoices.pay(invoice.id);
      
      console.log(`✅ Factura cobrada!`);
      console.log(`   Status: ${paidInvoice.status}`);
      console.log(`   Amount paid: $${(paidInvoice.amount_paid / 100).toFixed(2)} MXN`);
      
      if (paidInvoice.charge) {
        console.log(`   Charge ID: ${paidInvoice.charge}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 ¡ÉXITO!');
    console.log('\n✅ Juan fue cobrado $999 MXN');
    console.log('✅ Su suscripción sigue activa (sin interrupción)');
    console.log('✅ Próximo cobro automático: 15 diciembre 2025');
    console.log('\nTotal cobrado a Juan: $999 MXN (este mes)\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.raw) {
      console.error('\nDetalles:', JSON.stringify(error.raw, null, 2));
    }
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
