import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

async function checkPaymentMethod() {
  console.log('\n🔍 VERIFICANDO MÉTODO DE PAGO DE JUAN\n');
  console.log('======================================================================\n');

  try {
    const customerId = 'cus_TNJR4FrB18TbhM';
    
    // Obtener el customer
    const customer = await stripe.customers.retrieve(customerId);
    
    console.log('DATOS DEL CLIENTE:');
    console.log('------------------');
    console.log(`ID: ${customer.id}`);
    console.log(`Email: ${'email' in customer ? customer.email : 'N/A'}`);
    console.log(`Default payment method: ${'invoice_settings' in customer ? customer.invoice_settings?.default_payment_method || '❌ NINGUNO' : 'N/A'}`);
    console.log(`Default source: ${'default_source' in customer ? customer.default_source || '❌ NINGUNO' : 'N/A'}\n`);

    // Listar métodos de pago
    console.log('MÉTODOS DE PAGO DISPONIBLES:');
    console.log('----------------------------');
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 10,
    });

    if (paymentMethods.data.length === 0) {
      console.log('❌ NO TIENE MÉTODOS DE PAGO CONFIGURADOS\n');
      console.log('⚠️  ESTE ES EL PROBLEMA: No se puede cobrar sin método de pago!\n');
    } else {
      paymentMethods.data.forEach((pm, i) => {
        console.log(`\n${i + 1}. ${pm.id}`);
        console.log(`   Tipo: ${pm.type}`);
        if (pm.card) {
          console.log(`   Tarjeta: **** **** **** ${pm.card.last4}`);
          console.log(`   Marca: ${pm.card.brand}`);
          console.log(`   Expira: ${pm.card.exp_month}/${pm.card.exp_year}`);
        }
      });
    }

    // Verificar la suscripción
    console.log('\n\nSUSCRIPCIÓN:');
    console.log('------------');
    const subscription = await stripe.subscriptions.retrieve('sub_1SQYowCpe9CE4d2laNm6C3nA');
    console.log(`ID: ${subscription.id}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Default payment method: ${subscription.default_payment_method || '❌ NINGUNO'}`);
    console.log(`Collection method: ${subscription.collection_method}\n`);

    console.log('\n======================================================================\n');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }
}

checkPaymentMethod();
