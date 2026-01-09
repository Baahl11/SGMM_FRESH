/**
 * Script to verify messaging_config table exists in production
 * Run with: node scripts/check-messaging-config-table.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkMessagingConfigTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl ? '✅' : '❌');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
  }

  console.log('🔍 Connecting to Supabase...');
  console.log('   URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test 1: Check if table exists by querying it
  console.log('\n📋 Test 1: Checking if messaging_config table exists...');
  try {
    const { data, error, count } = await supabase
      .from('messaging_config')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error querying messaging_config table:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      if (error.code === '42P01') {
        console.error('\n⚠️  TABLE DOES NOT EXIST!');
        console.error('   You need to run the migration: supabase/migrations/20251027_messaging_config.sql');
      }
    } else {
      console.log('✅ Table exists! Row count:', count);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }

  // Test 2: Try to get RLS policies
  console.log('\n📋 Test 2: Checking RLS policies...');
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled', {
      table_name: 'messaging_config'
    });

    if (error) {
      console.log('⚠️  Could not check RLS (function may not exist):', error.message);
    } else {
      console.log('✅ RLS check result:', data);
    }
  } catch (err) {
    console.log('⚠️  Could not check RLS:', err.message);
  }

  // Test 3: List all tables
  console.log('\n📋 Test 3: Listing all tables in public schema...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.log('⚠️  Could not list tables:', error.message);
    } else if (data) {
      const tableNames = data.map(t => t.table_name);
      console.log('📊 Found', tableNames.length, 'tables:');
      
      const hasMessagingConfig = tableNames.includes('messaging_config');
      const hasWhatsappMessages = tableNames.includes('whatsapp_messages');
      
      console.log('   messaging_config:', hasMessagingConfig ? '✅' : '❌');
      console.log('   whatsapp_messages:', hasWhatsappMessages ? '✅' : '❌');
      
      if (!hasMessagingConfig) {
        console.log('\n⚠️  MISSING TABLE: messaging_config');
        console.log('   Run this command to apply the migration:');
        console.log('   npx supabase db push');
      }
    }
  } catch (err) {
    console.log('⚠️  Could not list tables:', err.message);
  }

  console.log('\n✅ Diagnostic complete!');
}

checkMessagingConfigTable().catch(console.error);
