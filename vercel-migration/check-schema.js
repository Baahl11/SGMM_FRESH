// Verificar el esquema real de inventory_items
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columnas disponibles en inventory_items:');
    console.log(Object.keys(data[0]));
    console.log('\nPrimer registro:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema().then(() => process.exit(0));
