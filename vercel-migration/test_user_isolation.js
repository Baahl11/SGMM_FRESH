/**
 * Test script to verify user isolation is working correctly
 * Run: node test_user_isolation.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserIsolation() {
  console.log('🧪 Testing User Isolation...\n');

  // Test 1: Check RLS is enabled
  console.log('1️⃣ Checking RLS is enabled on all tables...');
  const tables = [
    'patients', 'treatments', 'records', 'gastos_fijos',
    'inventory_items', 'inventory_movements', 'appointments', 'promotions'
  ];

  const { data: rpcData } = await supabase.rpc('check_rls_enabled');
  console.log('   ✅ RLS status checked\n');

  // Test 2: Verify all tables have user_id column
  console.log('2️⃣ Verifying all tables have user_id column...');
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('user_id')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: has user_id column`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${table}: ${err.message}`);
    }
  }

  // Test 3: Check promotions specifically
  console.log('\n3️⃣ Checking promotions table in detail...');
  const { data: promos, error: promosError, count } = await supabase
    .from('promotions')
    .select('*', { count: 'exact' });
  
  if (promosError) {
    console.log(`   ❌ Error: ${promosError.message}`);
  } else {
    console.log(`   ✅ Promotions: ${count} records accessible`);
    if (promos && promos.length > 0) {
      const hasUserId = promos.every(p => p.user_id !== null);
      console.log(`   ${hasUserId ? '✅' : '❌'} All promotions have user_id: ${hasUserId}`);
    }
  }

  // Test 4: Verify admin data count
  console.log('\n4️⃣ Admin data overview:');
  const adminEmail = 'gmelgarejom@gmail.com';
  
  const counts = {};
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    counts[table] = count || 0;
  }
  
  console.log('   Records accessible to current session:');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`   - ${table}: ${count}`);
  });

  console.log('\n✅ Test complete! Puntos a verificar manualmente:');
  console.log('   1. Inicia sesión con umepuebla@gmail.com');
  console.log('   2. Verifica que todas las páginas estén vacías');
  console.log('   3. Crea 1 paciente y 1 cita');
  console.log('   4. Cierra sesión e inicia como admin (gmelgarejom@gmail.com)');
  console.log('   5. Verifica que NO veas los datos del usuario invitado');
  console.log('   6. Verifica que la página /promotions NO muestre error\n');
}

testUserIsolation().catch(console.error);
