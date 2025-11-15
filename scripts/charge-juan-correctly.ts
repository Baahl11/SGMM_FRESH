import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function chargeJuanCorrectly() {
  console.log('\n💰 COBRAR $999 MXN A JUAN - MÉTODO CORRECTO\n');
  console.log('======================================================================\n');

  try {
    const customerId = 'cus_TNJR4FrB18TbhM';
    const amount = 99900; // $999 MXN en centavos

    // Método 1: Crear invoice item Y crear factura en un solo paso
    console.log('📝 Creando factura con invoice item...\n');

    // Primero crear el invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amount,
      currency: 'mxn',
      description: 'Plan Pro - Cobro manual (Nov 2025)',
    });

    console.log(`✅ Invoice item creado: ${invoiceItem.id}`);
    console.log(`   Amount: $${(invoiceItem.amount / 100).toFixed(2)} MXN\n`);

    // Ahora crear la factura
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Esto la finaliza automáticamente
      collection_method: 'charge_automatically',
      description: 'Plan Pro - Pago mensual',
    });

    console.log(`✅ Factura creada: ${invoice.id}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Amount due: $${(invoice.amount_due / 100).toFixed(2)} MXN\n`);

    // Finalizar y pagar
    console.log('💳 Finalizando y cobrando...\n');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    });

    console.log('RESULTADO FINAL:');
    console.log('----------------');
    console.log(`ID: ${finalizedInvoice.id}`);
    console.log(`Status: ${finalizedInvoice.status}`);
    console.log(`Amount due: $${(finalizedInvoice.amount_due / 100).toFixed(2)} MXN`);
    console.log(`Amount paid: $${(finalizedInvoice.amount_paid / 100).toFixed(2)} MXN`);
    console.log(`Amount remaining: $${(finalizedInvoice.amount_remaining / 100).toFixed(2)} MXN`);
    console.log(`Total: $${(finalizedInvoice.total / 100).toFixed(2)} MXN`);
    console.log(`Paid: ${finalizedInvoice.paid ? '✅ Sí' : '❌ No'}`);
    console.log(`Charge: ${finalizedInvoice.charge || '⚠️  No charge'}`);
    console.log(`URL: ${finalizedInvoice.hosted_invoice_url}\n`);

    if (finalizedInvoice.charge) {
      const charge = await stripe.charges.retrieve(finalizedInvoice.charge as string);
      console.log('💳 DETALLES DEL CARGO:');
      console.log(`   ID: ${charge.id}`);
      console.log(`   Amount: $${(charge.amount / 100).toFixed(2)} MXN`);
      console.log(`   Status: ${charge.status}`);
      console.log(`   Paid: ${charge.paid ? '✅ Sí' : '❌ No'}`);
      console.log(`   Captured: ${charge.captured ? '✅ Sí' : '❌ No'}`);
    }

    console.log('\n======================================================================\n');
    console.log(finalizedInvoice.paid ? '✅ ¡COBRO EXITOSO!' : '❌ COBRO FALLÓ');
    console.log('\n======================================================================\n');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.raw) {
      console.error('Detalles:', error.raw.message);
    }
  }
}

chargeJuanCorrectly();
