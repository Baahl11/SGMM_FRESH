import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde vercel-migration/.env.local
dotenv.config({ path: path.resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function verifyJuanPayment() {
  console.log('\n🔍 VERIFICANDO PAGO DE JUAN EN STRIPE\n');
  console.log('======================================================================\n');

  try {
    // Obtener la factura recién creada
    const invoiceId = 'in_1STcrsCpe9CE4d2lPpnsyEP5';
    
    console.log(`📋 Buscando factura ${invoiceId}...\n`);
    const invoice = await stripe.invoices.retrieve(invoiceId);

    console.log('DETALLES DE LA FACTURA:');
    console.log('------------------------');
    console.log(`ID: ${invoice.id}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Amount due: $${(invoice.amount_due / 100).toFixed(2)} MXN`);
    console.log(`Amount paid: $${(invoice.amount_paid / 100).toFixed(2)} MXN`);
    console.log(`Amount remaining: $${(invoice.amount_remaining / 100).toFixed(2)} MXN`);
    console.log(`Total: $${(invoice.total / 100).toFixed(2)} MXN`);
    console.log(`Subtotal: $${(invoice.subtotal / 100).toFixed(2)} MXN`);
    console.log(`Currency: ${invoice.currency.toUpperCase()}`);
    console.log(`Created: ${new Date(invoice.created * 1000).toLocaleString('es-MX')}`);
    console.log(`Paid: ${invoice.paid ? '✅ Sí' : '❌ No'}`);
    console.log(`Collection method: ${invoice.collection_method}`);
    console.log(`Billing reason: ${invoice.billing_reason}`);
    
    if (invoice.charge) {
      console.log(`\n💳 CARGO ASOCIADO:`);
      const charge = await stripe.charges.retrieve(invoice.charge as string);
      console.log(`  ID: ${charge.id}`);
      console.log(`  Amount: $${(charge.amount / 100).toFixed(2)} MXN`);
      console.log(`  Status: ${charge.status}`);
      console.log(`  Paid: ${charge.paid ? '✅ Sí' : '❌ No'}`);
      console.log(`  Captured: ${charge.captured ? '✅ Sí' : '❌ No'}`);
      console.log(`  Payment method: ${charge.payment_method}`);
    } else {
      console.log(`\n⚠️  NO HAY CARGO ASOCIADO A ESTA FACTURA`);
    }

    console.log(`\n📋 LÍNEAS DE LA FACTURA:`);
    invoice.lines.data.forEach((line, i) => {
      console.log(`\n  Línea ${i + 1}:`);
      console.log(`    Description: ${line.description}`);
      console.log(`    Amount: $${(line.amount / 100).toFixed(2)} MXN`);
      console.log(`    Quantity: ${line.quantity}`);
      console.log(`    Type: ${line.type}`);
    });

    // Verificar la suscripción también
    console.log(`\n\n🔍 VERIFICANDO SUSCRIPCIÓN DE JUAN\n`);
    const subscription = await stripe.subscriptions.retrieve('sub_1SQYowCpe9CE4d2laNm6C3nA');
    
    console.log('DETALLES DE SUSCRIPCIÓN:');
    console.log('------------------------');
    console.log(`ID: ${subscription.id}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Customer: ${subscription.customer}`);
    console.log(`Current period: ${new Date(subscription.current_period_start * 1000).toLocaleDateString()} → ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`);
    console.log(`Latest invoice: ${subscription.latest_invoice}`);
    
    if (subscription.latest_invoice) {
      const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      console.log(`\n💰 ÚLTIMA FACTURA DE LA SUSCRIPCIÓN:`);
      console.log(`  ID: ${latestInvoice.id}`);
      console.log(`  Amount: $${(latestInvoice.amount_paid / 100).toFixed(2)} MXN`);
      console.log(`  Status: ${latestInvoice.status}`);
      console.log(`  Paid: ${latestInvoice.paid ? '✅ Sí' : '❌ No'}`);
    }

    console.log('\n======================================================================\n');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }
}

verifyJuanPayment();
