/**
 * Verificación rápida de suscripciones activas en Stripe
 * Fecha: 14 Nov 2025
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  console.log('\n🔍 VERIFICACIÓN DE SUSCRIPCIONES ACTIVAS EN STRIPE\n');
  console.log('='.repeat(70));

  const activeSubscriptions: any[] = [];
  
  // Obtener todas las suscripciones activas
  for await (const subscription of stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  })) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const email = (customer as any).email || 'N/A';
    const amount = subscription.items.data[0]?.price.unit_amount || 0;
    
    activeSubscriptions.push({
      id: subscription.id,
      email,
      amount,
      status: subscription.status,
      created: new Date(subscription.created * 1000).toLocaleDateString(),
      periodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    });
  }

  console.log(`\n📊 Total suscripciones ACTIVAS: ${activeSubscriptions.length}\n`);

  if (activeSubscriptions.length === 0) {
    console.log('❌ No hay suscripciones activas en Stripe\n');
    return;
  }

  // Mostrar detalles
  for (const sub of activeSubscriptions) {
    console.log(`✅ ${sub.email}`);
    console.log(`   Sub ID: ${sub.id}`);
    console.log(`   Plan: $${(sub.amount / 100).toFixed(2)} MXN/mes`);
    console.log(`   Creada: ${sub.created}`);
    console.log(`   Próximo cobro: ${sub.periodEnd}\n`);
  }

  console.log('='.repeat(70));
  
  // Buscar usuarios específicos
  const targets = [
    'camarillojuan@hotmail.com',
    'gmelgarejom@gmail.com',
    'balancewck@gmail.com'
  ];

  console.log('\n🎯 USUARIOS ESPECÍFICOS:\n');
  
  for (const targetEmail of targets) {
    const found = activeSubscriptions.find(s => s.email === targetEmail);
    if (found) {
      console.log(`✅ ${targetEmail}: TIENE SUSCRIPCIÓN ACTIVA`);
      console.log(`   ${found.id} - $${(found.amount / 100).toFixed(2)}\n`);
    } else {
      console.log(`❌ ${targetEmail}: SIN SUSCRIPCIÓN ACTIVA\n`);
    }
  }

  console.log('='.repeat(70));
  console.log('\n✅ Ahora ejecuta este SQL en Supabase para verificar sincronización:\n');
  console.log(`
SELECT 
  u.email,
  s.stripe_subscription_id,
  s.plan_tier,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end < NOW() THEN '⚠️ VENCIDA'
    WHEN s.current_period_end > NOW() THEN '✅ ACTIVA'
  END as estado
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email IN (
  'camarillojuan@hotmail.com',
  'gmelgarejom@gmail.com', 
  'balancewck@gmail.com'
)
ORDER BY u.email;
  `);
}

main()
  .then(() => {
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
