/**
 * Script para buscar suscripciones de un email específico en Stripe
 * Uso: npx tsx scripts/search-customer-by-email.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Cargar .env.local desde vercel-migration
config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function searchCustomerByEmail(email: string) {
  console.log(`\n🔍 Buscando cliente con email: ${email}\n`);
  
  try {
    // Buscar customers por email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log(`❌ No se encontró ningún cliente con email: ${email}`);
      return;
    }

    console.log(`✅ Encontrados ${customers.data.length} cliente(s):\n`);

    for (const customer of customers.data) {
      console.log('━'.repeat(70));
      console.log(`👤 CUSTOMER: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Name: ${customer.name || 'N/A'}`);
      console.log(`   Created: ${new Date(customer.created * 1000).toLocaleString()}`);
      console.log(`   Balance: $${(customer.balance / 100).toFixed(2)}`);
      
      // Buscar suscripciones del customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      if (subscriptions.data.length === 0) {
        console.log(`   📭 Sin suscripciones activas\n`);
        continue;
      }

      console.log(`\n   📋 SUSCRIPCIONES (${subscriptions.data.length}):\n`);

      for (const sub of subscriptions.data) {
        const price = sub.items.data[0]?.price;
        const amount = price?.unit_amount || 0;
        const currency = price?.currency?.toUpperCase() || 'MXN';
        
        console.log(`   ┌─ ${sub.id}`);
        console.log(`   │  Status: ${sub.status}`);
        console.log(`   │  Plan: $${(amount / 100).toFixed(2)} ${currency}`);
        console.log(`   │  Created: ${new Date(sub.created * 1000).toLocaleDateString()}`);
        console.log(`   │  Current period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} → ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);
        
        if (sub.trial_start && sub.trial_end) {
          console.log(`   │  Trial: ${new Date(sub.trial_start * 1000).toLocaleDateString()} → ${new Date(sub.trial_end * 1000).toLocaleDateString()}`);
        }
        
        if (sub.canceled_at) {
          console.log(`   │  ❌ Cancelada: ${new Date(sub.canceled_at * 1000).toLocaleString()}`);
        }
        
        console.log(`   └─`);
      }
      
      // Buscar facturas recientes
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 3,
      });

      if (invoices.data.length > 0) {
        console.log(`\n   🧾 FACTURAS RECIENTES:\n`);
        for (const invoice of invoices.data) {
          console.log(`   • ${invoice.id}`);
          console.log(`     Amount: $${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency.toUpperCase()}`);
          console.log(`     Status: ${invoice.status}`);
          console.log(`     Date: ${new Date(invoice.created * 1000).toLocaleDateString()}`);
        }
      }
      
      console.log('');
    }

  } catch (error: any) {
    console.error(`❌ Error buscando cliente:`, error.message);
  }
}

async function main() {
  const emailToSearch = process.argv[2] || 'balancewck@gmail.com';
  
  console.log('🔎 BÚSQUEDA DE CLIENTE EN STRIPE');
  console.log('='.repeat(70));
  
  await searchCustomerByEmail(emailToSearch);
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Búsqueda completada');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
