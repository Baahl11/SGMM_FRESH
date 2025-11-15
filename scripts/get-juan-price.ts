/**
 * Ver price ID real de la suscripción de Juan
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(__dirname, '../vercel-migration/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function main() {
  const subscription = await stripe.subscriptions.retrieve('sub_1SQYowCpe9CE4d2laNm6C3nA');
  
  console.log('\n📋 PRECIO ACTUAL DE JUAN:');
  console.log(`   Price ID: ${subscription.items.data[0].price.id}`);
  console.log(`   Amount: $${(subscription.items.data[0].price.unit_amount! / 100).toFixed(2)} ${subscription.items.data[0].price.currency.toUpperCase()}`);
  console.log(`   Interval: ${subscription.items.data[0].price.recurring?.interval}\n`);
}

main();
