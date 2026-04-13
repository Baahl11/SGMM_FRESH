/**
 * Audit data without user_id
 * Find all orphaned data that needs cleanup
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function auditOrphanedData() {
  console.log('🔍 Auditing data without user_id...\n');

  const tables = [
    'patients',
    'appointments', 
    'patient_records',
    'treatments',
    'records',
    'invoices',
    'certificates',
    'promotions',
    'gastos_fijos',
    'inventory_items',
    'inventory_movements'
  ];

  const results = {};

  for (const table of tables) {
    try {
      // Check if table exists and has user_id column
      const { data, error } = await supabase
        .from(table)
        .select('id, user_id')
        .is('user_id', null)
        .limit(100);

      if (error) {
        results[table] = { error: error.message, count: 0 };
      } else {
        results[table] = { count: data?.length || 0, sample: data?.slice(0, 5) };
      }
    } catch (err) {
      results[table] = { error: err.message, count: 0 };
    }
  }

  console.log('📊 Results:\n');
  
  let totalOrphaned = 0;
  const problematicTables = [];

  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`⚠️  ${table}: ${result.error}`);
    } else if (result.count > 0) {
      console.log(`❌ ${table}: ${result.count} records without user_id`);
      totalOrphaned += result.count;
      problematicTables.push(table);
      if (result.sample && result.sample.length > 0) {
        console.log(`   Sample IDs: ${result.sample.map(r => r.id).join(', ')}`);
      }
    } else {
      console.log(`✅ ${table}: All records have user_id`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Total orphaned records: ${totalOrphaned}`);
  console.log(`   Problematic tables: ${problematicTables.join(', ') || 'None'}\n`);

  if (totalOrphaned > 0) {
    console.log('🔧 Next steps:');
    console.log('   1. Run assign_orphaned_data.js to assign to admin');
    console.log('   2. Or delete orphaned data if not needed\n');
  }
}

auditOrphanedData();
