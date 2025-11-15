import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function chargeJuanDirectly() {
  console.log('\n💰 COBRAR $999 MXN A JUAN - PAYMENT INTENT DIRECTO\n');
  console.log('======================================================================\n');

  try {
    const customerId = 'cus_TNJR4FrB18TbhM';
    const paymentMethodId = 'pm_1SQYosCpe9CE4d2ldNqmQiqp'; // Su tarjeta AMEX
    const amount = 99900; // $999 MXN en centavos

    console.log('💳 Creando Payment Intent y cobrando...\n');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'mxn',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Permite cobrar sin que el cliente esté presente
      confirm: true, // Confirma y cobra inmediatamente
      description: 'Plan Pro - Pago mensual (Nov 2025)',
      metadata: {
        subscription_id: 'sub_1SQYowCpe9CE4d2laNm6C3nA',
        plan: 'Pro',
        billing_reason: 'subscription_cycle',
      },
    });

    console.log('RESULTADO DEL PAGO:');
    console.log('-------------------');
    console.log(`ID: ${paymentIntent.id}`);
    console.log(`Status: ${paymentIntent.status}`);
    console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)} MXN`);
    console.log(`Currency: ${paymentIntent.currency.toUpperCase()}`);
    console.log(`Customer: ${paymentIntent.customer}`);
    console.log(`Payment method: ${paymentIntent.payment_method}`);
    
    if (paymentIntent.latest_charge) {
      console.log(`Charge ID: ${paymentIntent.latest_charge}`);
      
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
      console.log(`\n💳 DETALLES DEL CARGO:`);
      console.log(`   Amount: $${(charge.amount / 100).toFixed(2)} MXN`);
      console.log(`   Status: ${charge.status}`);
      console.log(`   Paid: ${charge.paid ? '✅ Sí' : '❌ No'}`);
      console.log(`   Receipt URL: ${charge.receipt_url}`);
    }

    console.log('\n======================================================================');
    
    if (paymentIntent.status === 'succeeded') {
      console.log('\n✅ ¡ÉXITO! Juan fue cobrado $999 MXN');
      console.log('\n🎯 PRÓXIMOS PASOS:');
      console.log('   1. Este cobro NO está vinculado a una factura de Stripe');
      console.log('   2. Es un pago único por el mes actual');
      console.log('   3. La suscripción seguirá cobrando automáticamente el 15 de cada mes');
      console.log('   4. Verificar en Stripe Dashboard → Payments');
    } else {
      console.log(`\n❌ PAGO FALLÓ - Status: ${paymentIntent.status}`);
      if (paymentIntent.last_payment_error) {
        console.log(`   Error: ${paymentIntent.last_payment_error.message}`);
      }
    }
    
    console.log('======================================================================\n');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.raw) {
      console.error('Detalles:', error.raw.message);
      console.error('Type:', error.type);
      console.error('Code:', error.code);
    }
  }
}

chargeJuanDirectly();
