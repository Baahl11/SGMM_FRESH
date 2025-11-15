import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function chargeJuanWithPaymentMethod() {
  console.log('\n💰 COBRAR $999 MXN A JUAN CON SU TARJETA AMEX\n');
  console.log('======================================================================\n');

  try {
    const customerId = 'cus_TNJR4FrB18TbhM';
    const paymentMethodId = 'pm_1SQYosCpe9CE4d2ldNqmQiqp'; // Su tarjeta AMEX
    const amount = 99900; // $999 MXN en centavos

    console.log('📝 Paso 1: Crear invoice item...\n');
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amount,
      currency: 'mxn',
      description: 'Plan Pro - Pago mensual (Nov 2025)',
    });

    console.log(`✅ Invoice item creado: ${invoiceItem.id}`);
    console.log(`   Amount: $${(invoiceItem.amount / 100).toFixed(2)} MXN\n`);

    console.log('📋 Paso 2: Crear factura con método de pago...\n');
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'charge_automatically',
      default_payment_method: paymentMethodId, // ← ESTO ES LA CLAVE
      auto_advance: false, // La finalizamos manualmente
      description: 'Plan Pro - Pago mensual',
    });

    console.log(`✅ Factura creada: ${invoice.id}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Amount due: $${(invoice.amount_due / 100).toFixed(2)} MXN\n`);

    console.log('💳 Paso 3: Finalizar factura y cobrar...\n');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    console.log('RESULTADO DESPUÉS DE FINALIZAR:');
    console.log('--------------------------------');
    console.log(`Status: ${finalizedInvoice.status}`);
    console.log(`Amount due: $${(finalizedInvoice.amount_due / 100).toFixed(2)} MXN`);
    console.log(`Amount paid: $${(finalizedInvoice.amount_paid / 100).toFixed(2)} MXN`);
    console.log(`Total: $${(finalizedInvoice.total / 100).toFixed(2)} MXN`);
    console.log(`Paid: ${finalizedInvoice.paid ? '✅ Sí' : '❌ No'}`);
    console.log(`Charge: ${finalizedInvoice.charge || '⚠️  No charge'}\n`);

    if (finalizedInvoice.status === 'open' && !finalizedInvoice.paid) {
      console.log('🔄 Paso 4: Intentar pagar la factura manualmente...\n');
      const paidInvoice = await stripe.invoices.pay(invoice.id);
      
      console.log('RESULTADO DESPUÉS DE PAGAR:');
      console.log('----------------------------');
      console.log(`Status: ${paidInvoice.status}`);
      console.log(`Amount paid: $${(paidInvoice.amount_paid / 100).toFixed(2)} MXN`);
      console.log(`Paid: ${paidInvoice.paid ? '✅ Sí' : '❌ No'}`);
      console.log(`Charge: ${paidInvoice.charge}\n`);

      if (paidInvoice.charge) {
        const charge = await stripe.charges.retrieve(paidInvoice.charge as string);
        console.log('💳 DETALLES DEL CARGO:');
        console.log('----------------------');
        console.log(`ID: ${charge.id}`);
        console.log(`Amount: $${(charge.amount / 100).toFixed(2)} MXN`);
        console.log(`Status: ${charge.status}`);
        console.log(`Paid: ${charge.paid ? '✅ Sí' : '❌ No'}`);
        console.log(`Payment method: ${charge.payment_method}`);
        console.log(`Receipt URL: ${charge.receipt_url}\n`);
      }

      console.log('======================================================================');
      console.log(paidInvoice.paid ? '\n✅ ¡COBRO EXITOSO! Juan fue cargado $999 MXN' : '\n❌ COBRO FALLÓ');
      console.log('======================================================================\n');
    } else if (finalizedInvoice.paid) {
      console.log('======================================================================');
      console.log('\n✅ ¡COBRO EXITOSO! La factura se pagó automáticamente');
      console.log('======================================================================\n');
    }

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.raw) {
      console.error('Detalles:', error.raw.message);
    }
  }
}

chargeJuanWithPaymentMethod();
