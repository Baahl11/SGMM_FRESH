/**
 * Apply messaging config migrations to Supabase
 * Run with: npx tsx scripts/apply-messaging-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://sbwpqtrxhiuucwlbozet.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid3BxdHJ4aGl1dWN3bGJvemV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1MDkwMCwiZXhwIjoyMDc0MzI2OTAwfQ.6qrtlq12xGkSXWXZeP5L7bEPNnhzHuEW1c2cvN5oGsE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  console.log('🔨 Applying messaging config migrations...\n');

  // Step 1: Check if table exists
  console.log('Step 1: Checking if messaging_config table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('messaging_config')
    .select('id')
    .limit(1);

  if (tableError && tableError.message.includes('relation "public.messaging_config" does not exist')) {
    console.log('⚠️  Table does not exist. Please apply base migration first.\n');
    console.log('Copy and paste this SQL in Supabase Dashboard → SQL Editor:');
    console.log('🔗 https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/sql/new\n');
    console.log('=' .repeat(80));
    
    const baseMigration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '20251027_messaging_config.sql'),
      'utf-8'
    );
    console.log(baseMigration);
    console.log('=' .repeat(80));
    return;
  }

  console.log('✅ Table exists\n');

  // Step 2: Check if personalization fields exist
  console.log('Step 2: Checking if personalization fields exist...');
  const { data: fieldCheck, error: fieldError } = await supabase
    .from('messaging_config')
    .select('doctor_name, clinic_name, clinic_address, clinic_phone, custom_message_signature')
    .limit(1);

  if (fieldError) {
    console.log('⚠️  Personalization fields do not exist. Please apply this migration:\n');
    console.log('Copy and paste this SQL in Supabase Dashboard → SQL Editor:');
    console.log('🔗 https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/sql/new\n');
    console.log('=' .repeat(80));
    
    const personalMigration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '20251113_add_messaging_personalization.sql'),
      'utf-8'
    );
    console.log(personalMigration);
    console.log('=' .repeat(80));
    return;
  }

  console.log('✅ All fields exist\n');
  console.log('🎉 Messaging config is fully set up and ready to use!');
}

applyMigrations().catch(console.error);
