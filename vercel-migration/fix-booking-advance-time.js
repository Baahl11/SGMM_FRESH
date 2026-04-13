require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBookingAdvanceTime() {
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e';
  
  console.log('🔧 ACTUALIZANDO CONFIGURACIÓN DE BOOKING\n');
  
  const { data, error } = await supabase
    .from('booking_settings')
    .update({
      min_advance_hours: 1  // Cambiar de 2 horas a 1 hora
    })
    .eq('user_id', userId)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Configuración actualizada exitosamente!');
    console.log('   min_advance_hours: 2 → 1 hora');
    console.log('\n💡 Ahora los pacientes podrán reservar con 1 hora de anticipación');
    console.log('   Ejemplo: Si son las 10:00 AM, podrán reservar desde las 11:00 AM en adelante');
  }
}

updateBookingAdvanceTime().catch(console.error);
