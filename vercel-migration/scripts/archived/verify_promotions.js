/**
 * Verify promotions table structure
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyPromotions() {
  console.log('🔍 Verificando estructura de tabla promotions...\n');

  // Get all promotions with all columns
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Encontradas ${data.length} promociones\n`);
  
  if (data.length > 0) {
    console.log('📋 Columnas disponibles:');
    const columns = Object.keys(data[0]);
    columns.forEach(col => {
      console.log(`   - ${col}: ${typeof data[0][col]}`);
    });
    
    console.log('\n📊 Primera promoción:');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Check if user_id exists
    const hasUserId = data.every(p => 'user_id' in p);
    console.log(`\n${hasUserId ? '✅' : '❌'} Columna user_id existe: ${hasUserId}`);
    
    // Check if user_id is populated
    const allHaveUserId = data.every(p => p.user_id !== null);
    console.log(`${allHaveUserId ? '✅' : '❌'} Todas tienen user_id asignado: ${allHaveUserId}`);
  } else {
    console.log('⚠️  No hay promociones en la base de datos');
  }
}

verifyPromotions().catch(console.error);
