/**
 * Apply user profiles extension migration to Supabase
 * Run with: npx tsx scripts/apply-profile-migration.ts
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

async function applyProfileMigration() {
  console.log('🔨 Checking user_profiles table...\n');

  // Check if extended fields exist
  console.log('Step 1: Checking if extended profile fields exist...');
  const { data: fieldCheck, error: fieldError } = await supabase
    .from('user_profiles')
    .select('avatar_url, phone, specialty, clinic_name, bio')
    .limit(1);

  if (fieldError) {
    console.log('⚠️  Extended profile fields do not exist. Please apply this migration:\n');
    console.log('Copy and paste this SQL in Supabase Dashboard → SQL Editor:');
    console.log('🔗 https://supabase.com/dashboard/project/sbwpqtrxhiuucwlbozet/sql/new\n');
    console.log('=' .repeat(80));
    
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '20251113_extend_user_profiles.sql'),
      'utf-8'
    );
    console.log(migration);
    console.log('=' .repeat(80));
    return;
  }

  console.log('✅ All extended profile fields exist\n');
  console.log('🎉 User profiles are fully set up and ready to use!');
}

applyProfileMigration().catch(console.error);
