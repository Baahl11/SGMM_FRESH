#!/usr/bin/env node

/**
 * Apply Team Members Migration to Supabase
 * 
 * This script applies the team_members migration to enable
 * multi-user collaboration in AgendaMedPro.
 * 
 * Usage:
 *   node apply-team-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Applying Team Members Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251111_team_members.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    // Execute migration
    console.log('⚙️  Executing SQL migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try alternative method - direct SQL execution
      console.log('⚠️  RPC failed, trying direct execution...');
      
      // Split migration into statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { 
          query: statement + ';' 
        });
        
        if (stmtError) {
          console.error('❌ Error executing statement:', stmtError);
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'team_members');

    if (verifyError) {
      console.log('⚠️  Could not verify (but migration may have succeeded)');
    } else if (tables && tables.length > 0) {
      console.log('✅ Table "team_members" exists');
    } else {
      console.log('⚠️  Table "team_members" not found');
    }

    // Check RLS
    console.log('\n🔒 Checking RLS policies...');
    const { data: policies } = await supabase
      .rpc('get_policies', { table_name: 'team_members' })
      .then(res => res.data);

    if (policies && policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies`);
    }

    console.log('\n✨ Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. Deploy frontend changes: npx vercel --prod');
    console.log('  2. Test at: /dashboard/settings/team');
    console.log('  3. Try inviting a team member\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n💡 Manual steps:');
    console.error('  1. Go to Supabase Dashboard → SQL Editor');
    console.error('  2. Copy contents of: supabase/migrations/20251111_team_members.sql');
    console.error('  3. Paste and execute\n');
    process.exit(1);
  }
}

applyMigration();
