// Verificar gastos fijos específicamente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '86cbe61c-8829-41a2-aa29-81e11844f83e';

async function checkGastos() {
  console.log('🔍 Verificando gastos fijos...\n');

  // Query exacta que usa el AI
  const { data, error } = await supabase
    .from('gastos_fijos')
    .select('id, concepto, monto, frecuencia, dia_pago, activo')
    .eq('user_id', USER_ID)
    .eq('activo', true)
    .order('monto', { ascending: false });

  console.log('Query result:');
  console.log('- Error:', error);
  console.log('- Data length:', data?.length || 0);
  console.log('- Data:', JSON.stringify(data, null, 2));

  // También probar sin filtro de activo
  const { data: data2, error: error2 } = await supabase
    .from('gastos_fijos')
    .select('*')
    .eq('user_id', USER_ID);

  console.log('\n\nSin filtro de activo:');
  console.log('- Error:', error2);
  console.log('- Data length:', data2?.length || 0);
  if (data2) {
    data2.forEach(g => {
      console.log(`  ${g.concepto}: activo=${g.activo} (tipo: ${typeof g.activo})`);
    });
  }
}

checkGastos().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
