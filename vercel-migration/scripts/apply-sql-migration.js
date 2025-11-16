// Aplicar migración SQL usando Supabase client
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔧 Aplicando migración SQL...\n');

  const sql = `
    -- Add encryption fields
    ALTER TABLE facturama_config
      ADD COLUMN IF NOT EXISTS api_password_iv TEXT,
      ADD COLUMN IF NOT EXISTS api_password_tag TEXT,
      ADD COLUMN IF NOT EXISTS certificate_password_iv TEXT,
      ADD COLUMN IF NOT EXISTS certificate_password_tag TEXT,
      ADD COLUMN IF NOT EXISTS encryption_migrated BOOLEAN DEFAULT false;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_facturama_config_encryption_migrated
      ON facturama_config(encryption_migrated)
      WHERE encryption_migrated = false;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n⚠️  La función exec_sql no existe. Por favor ejecuta el SQL manualmente en:');
      console.log('https://supabase.com/dashboard/project/bpxppzgsgwjlqaykxgmb/sql/new\n');
      console.log('SQL a ejecutar:');
      console.log('═'.repeat(60));
      console.log(sql);
      console.log('═'.repeat(60));
      return false;
    }

    console.log('✅ Migración SQL aplicada exitosamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    return false;
  }
}

runMigration();
