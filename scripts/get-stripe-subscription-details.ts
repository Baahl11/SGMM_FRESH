/**
 * Script para obtener detalles exactos de suscripciones Stripe
 * Fecha: 14 Nov 2025
 * Uso: npx tsx scripts/get-stripe-subscription-details.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Cargar .env.local desde vercel-migration
config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  customerEmail: string;
  planTier: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

async function getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer'],
    });

    const customer = subscription.customer as Stripe.Customer;
    const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
    const currency = subscription.items.data[0]?.price.currency || 'mxn';

    // Determinar plan tier por precio
    let planTier = 'basico';
    if (priceAmount >= 99900) { // $999 MXN
      planTier = 'pro';
    } else if (priceAmount >= 59900) { // $599 MXN
      planTier = 'basico';
    }

    return {
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerEmail: customer.email || 'N/A',
      planTier,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      amount: priceAmount,
      currency: currency.toUpperCase(),
    };
  } catch (error: any) {
    console.error(`❌ Error obteniendo suscripción ${subscriptionId}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Obteniendo detalles de suscripciones huérfanas...\n');

  // Suscripciones a verificar
  const orphanedSubs = [
    { id: 'sub_1SQYowCpe9CE4d2laNm6C3nA', user: 'Juan Camarillo - MANTENER' },
    { id: 'sub_1SQYaOCpe9CE4d2luZTbzd5L', user: 'Juan Camarillo - CANCELAR' },
    { id: 'sub_1SJ4LyCpe9CE4d2lkHcbdgRl', user: 'gmelgarejom@gmail.com - SINCRONIZAR' },
  ];

  const results: { [key: string]: SubscriptionDetails | null } = {};

  for (const sub of orphanedSubs) {
    console.log(`📋 ${sub.user}`);
    console.log(`   ID: ${sub.id}`);
    
    const details = await getSubscriptionDetails(sub.id);
    results[sub.id] = details;

    if (details) {
      console.log(`   ✅ Customer: ${details.customerId}`);
      console.log(`   📧 Email: ${details.customerEmail}`);
      console.log(`   💳 Plan: ${details.planTier.toUpperCase()}`);
      console.log(`   📊 Status: ${details.status}`);
      console.log(`   💰 Precio: $${(details.amount / 100).toFixed(2)} ${details.currency}`);
      console.log(`   📅 Periodo: ${details.currentPeriodStart.toISOString().split('T')[0]} → ${details.currentPeriodEnd.toISOString().split('T')[0]}`);
      console.log(`   🚫 Cancel at end: ${details.cancelAtPeriodEnd ? 'Sí' : 'No'}\n`);
    } else {
      console.log(`   ❌ No se pudo obtener información\n`);
    }
  }

  // Generar SQL para gmelgarejom
  console.log('\n' + '='.repeat(70));
  console.log('📝 SQL PARA SINCRONIZAR gmelgarejom@gmail.com');
  console.log('='.repeat(70) + '\n');

  const gmelgarejomSub = results['sub_1SJ4LyCpe9CE4d2lkHcbdgRl'];
  if (gmelgarejomSub) {
    console.log(`-- Primero obtener user_id:`);
    console.log(`SELECT id FROM auth.users WHERE email = 'gmelgarejom@gmail.com';\n`);
    console.log(`-- Luego insertar suscripción:`);
    console.log(`INSERT INTO subscriptions (`);
    console.log(`  user_id,`);
    console.log(`  stripe_subscription_id,`);
    console.log(`  stripe_customer_id,`);
    console.log(`  plan_tier,`);
    console.log(`  status,`);
    console.log(`  current_period_start,`);
    console.log(`  current_period_end,`);
    console.log(`  cancel_at_period_end,`);
    console.log(`  created_at,`);
    console.log(`  updated_at`);
    console.log(`) VALUES (`);
    console.log(`  'REEMPLAZAR_CON_USER_ID', -- Del SELECT anterior`);
    console.log(`  '${gmelgarejomSub.subscriptionId}',`);
    console.log(`  '${gmelgarejomSub.customerId}',`);
    console.log(`  '${gmelgarejomSub.planTier}',`);
    console.log(`  '${gmelgarejomSub.status}',`);
    console.log(`  '${gmelgarejomSub.currentPeriodStart.toISOString()}',`);
    console.log(`  '${gmelgarejomSub.currentPeriodEnd.toISOString()}',`);
    console.log(`  ${gmelgarejomSub.cancelAtPeriodEnd},`);
    console.log(`  NOW(),`);
    console.log(`  NOW()`);
    console.log(`) ON CONFLICT (stripe_subscription_id) DO NOTHING;`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('⚠️  ACCIONES MANUALES REQUERIDAS EN STRIPE DASHBOARD');
  console.log('='.repeat(70) + '\n');

  const duplicatedSub = results['sub_1SQYaOCpe9CE4d2luZTbzd5L'];
  if (duplicatedSub) {
    console.log(`1. CANCELAR suscripción duplicada de Juan:`);
    console.log(`   - Ir a: https://dashboard.stripe.com/subscriptions/${duplicatedSub.subscriptionId}`);
    console.log(`   - Customer: ${duplicatedSub.customerEmail}`);
    console.log(`   - Plan: ${duplicatedSub.planTier.toUpperCase()} - $${(duplicatedSub.amount / 100).toFixed(2)} ${duplicatedSub.currency}`);
    console.log(`   - Click "Cancel subscription"`);
    console.log(`   - Seleccionar "Cancel immediately"`);
    console.log(`   - Confirmar cancelación\n`);
  }

  const maintainSub = results['sub_1SQYowCpe9CE4d2laNm6C3nA'];
  if (maintainSub) {
    console.log(`2. VERIFICAR suscripción correcta de Juan (mantener):`);
    console.log(`   - Ir a: https://dashboard.stripe.com/subscriptions/${maintainSub.subscriptionId}`);
    console.log(`   - Customer: ${maintainSub.customerEmail}`);
    console.log(`   - Plan: ${maintainSub.planTier.toUpperCase()} - $${(maintainSub.amount / 100).toFixed(2)} ${maintainSub.currency}`);
    console.log(`   - Status: ${maintainSub.status}`);
    console.log(`   - Esta debe coincidir con la de Supabase\n`);
  }

  console.log(`3. Verificar webhooks:`);
  console.log(`   - Ir a: https://dashboard.stripe.com/webhooks`);
  console.log(`   - Verificar que agendamedpro.com/api/stripe/webhook muestre 200 OK`);
  console.log(`   - El % de errores debe estar bajando\n`);
}

main()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
