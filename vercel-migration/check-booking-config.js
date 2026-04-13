require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBookingSettings() {
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e';
  
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DE BOOKING\n');
  
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (settings) {
    console.log('⚙️ Configuración actual:');
    console.log('   min_advance_hours:', settings.min_advance_hours, 'horas');
    console.log('   max_advance_days:', settings.max_advance_days, 'días');
    console.log('   slot_duration_minutes:', settings.slot_duration_minutes, 'min');
    console.log('   buffer_time_minutes:', settings.buffer_time_minutes, 'min');
    console.log('   available_days:', settings.available_days);
    console.log('   time_ranges:', JSON.stringify(settings.time_ranges, null, 2));
    
    console.log('\n⚠️ PROBLEMA ENCONTRADO:');
    console.log(`   Con min_advance_hours = ${settings.min_advance_hours}`);
    console.log(`   Si ahora son las ${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`);
    const minTime = new Date();
    minTime.setHours(minTime.getHours() + settings.min_advance_hours);
    console.log(`   Solo mostrará horarios después de las ${minTime.getHours()}:${minTime.getMinutes().toString().padStart(2, '0')}`);
    
    console.log('\n💡 SOLUCIÓN:');
    console.log('   Reducir min_advance_hours a 0 o 1 hora');
  } else {
    console.log('❌ No hay configuración de booking');
  }
}

checkBookingSettings().catch(console.error);
