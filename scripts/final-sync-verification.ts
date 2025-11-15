/**
 * Script final de verificación - Stripe
 * Fecha: 14 Nov 2025
 * Uso: npx tsx scripts/final-sync-verification.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Cargar .env.local
config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface StripeSubData {
  id: string;
  customer_email: string;
  status: string;
  plan_amount: number;
}

interface SupabaseSubData {
  stripe_subscription_id: string;
  user_email: string;
  plan_tier: string;
  status: string;
}

async function main() {
  console.log('\n🔍 VERIFICACIÓN FINAL DE SINCRONIZACIÓN\n');
  console.log('='.repeat(70));

  // 1. Obtener todas las suscripciones activas de Stripe
  console.log('\n📡 Obteniendo suscripciones de Stripe...');
  const stripeSubscriptions: StripeSubData[] = [];
  
  for await (const subscription of stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  })) {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const email = (customer as any).email || 'N/A';
    const amount = subscription.items.data[0]?.price.unit_amount || 0;
    
    stripeSubscriptions.push({
      id: subscription.id,
      customer_email: email,
      status: subscription.status,
      plan_amount: amount,
    });
  }

  console.log(`✅ Encontradas ${stripeSubscriptions.length} suscripciones activas en Stripe\n`);

  // 2. Obtener todas las suscripciones de Supabase
  console.log('💾 Obteniendo suscripciones de Supabase...');
  const { data: supabaseSubs, error } = await supabase
    .from('subscriptions')
    .select(`
      stripe_subscription_id,
      plan_tier,
      status,
      user_id,
      current_period_end
    `);

  if (error) {
    console.error('❌ Error obteniendo suscripciones de Supabase:', error.message);
    return;
  }

  // Obtener emails de usuarios
  const userIds = supabaseSubs?.map(s => s.user_id) || [];
  const { data: users } = await supabase.auth.admin.listUsers();
  
  const userEmailMap = new Map(
    users.users.map(u => [u.id, u.email])
  );

  const supabaseSubscriptions: SupabaseSubData[] = (supabaseSubs || []).map(sub => ({
    stripe_subscription_id: sub.stripe_subscription_id,
    user_email: userEmailMap.get(sub.user_id) || 'N/A',
    plan_tier: sub.plan_tier,
    status: sub.status,
  }));

  console.log(`✅ Encontradas ${supabaseSubscriptions.length} suscripciones en Supabase\n`);

  // 3. Comparar
  console.log('='.repeat(70));
  console.log('🔄 COMPARACIÓN\n');

  const stripeIds = new Set(stripeSubscriptions.map(s => s.id));
  const supabaseIds = new Set(supabaseSubscriptions.map(s => s.stripe_subscription_id));

  // Encontrar huérfanas (en Stripe pero no en Supabase)
  const orphaned = stripeSubscriptions.filter(s => !supabaseIds.has(s.id));

  // Encontrar fantasmas (en Supabase pero no en Stripe activas)
  const ghosts = supabaseSubscriptions.filter(s => !stripeIds.has(s.stripe_subscription_id));

  console.log(`📊 Suscripciones en Stripe: ${stripeSubscriptions.length}`);
  console.log(`📊 Suscripciones en Supabase: ${supabaseSubscriptions.length}`);
  console.log(`⚠️  Huérfanas (Stripe sin Supabase): ${orphaned.length}`);
  console.log(`👻 Fantasmas (Supabase sin Stripe activa): ${ghosts.length}\n`);

  if (orphaned.length > 0) {
    console.log('❌ SUSCRIPCIONES HUÉRFANAS:\n');
    for (const sub of orphaned) {
      console.log(`   • ${sub.id}`);
      console.log(`     Email: ${sub.customer_email}`);
      console.log(`     Plan: $${(sub.plan_amount / 100).toFixed(2)} MXN`);
      console.log(`     Status: ${sub.status}\n`);
    }
  }

  if (ghosts.length > 0) {
    console.log('👻 SUSCRIPCIONES FANTASMA:\n');
    for (const sub of ghosts) {
      console.log(`   • ${sub.stripe_subscription_id}`);
      console.log(`     Email: ${sub.user_email}`);
      console.log(`     Plan: ${sub.plan_tier}`);
      console.log(`     Status: ${sub.status}\n`);
    }
  }

  if (orphaned.length === 0 && ghosts.length === 0) {
    console.log('✅ ¡PERFECTO! Todas las suscripciones están sincronizadas\n');
  }

  // 4. Detalles de suscripciones específicas
  console.log('='.repeat(70));
  console.log('📋 SUSCRIPCIONES ESPECÍFICAS\n');

  const targetEmails = [
    'camarillojuan@hotmail.com',
    'gmelgarejom@gmail.com',
    'balancewck@gmail.com'
  ];

  for (const email of targetEmails) {
    console.log(`\n👤 ${email}:`);
    
    // En Stripe
    const stripeSub = stripeSubscriptions.find(s => s.customer_email === email);
    if (stripeSub) {
      console.log(`   ✅ Stripe: ${stripeSub.id} - $${(stripeSub.plan_amount / 100).toFixed(2)} - ${stripeSub.status}`);
    } else {
      console.log(`   ❌ Stripe: No encontrado`);
    }
    
    // En Supabase
    const supabaseSub = supabaseSubscriptions.find(s => s.user_email === email);
    if (supabaseSub) {
      console.log(`   ✅ Supabase: ${supabaseSub.stripe_subscription_id} - ${supabaseSub.plan_tier} - ${supabaseSub.status}`);
    } else {
      console.log(`   ❌ Supabase: No encontrado`);
    }
  }

  console.log('\n' + '='.repeat(70));
  
  if (orphaned.length === 0) {
    console.log('🎉 ¡SINCRONIZACIÓN EXITOSA! 🎉');
  } else {
    console.log('⚠️  AÚN HAY TRABAJO POR HACER');
  }
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
