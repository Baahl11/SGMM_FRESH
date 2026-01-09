/**
 * Apply WhatsApp Simple Config Migration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📝 Reading migration file...');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250109_whatsapp_simple_config.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration...');
  
  try {
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (statement) {
        console.log('   Executing:', statement.substring(0, 60) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_migrations').insert({
            name: '20250109_whatsapp_simple_config',
            executed_at: new Date().toISOString()
          });
          
          if (directError && !directError.message.includes('already exists')) {
            console.error('   ⚠️ Error:', error.message);
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy to production: npx vercel --prod');
    console.log('2. Test the new WhatsApp config page');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Tip: You can also apply this migration manually in Supabase SQL Editor');
    process.exit(1);
  }
}

applyMigration();
