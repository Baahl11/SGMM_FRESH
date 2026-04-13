// Script para arreglar datos vía API de Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '86cbe61c-8829-41a2-aa29-81e11844f83e'; // gmelgarejom@gmail.com

async function fixData() {
  console.log('🔧 Arreglando datos...\n');

  // 1. ARREGLAR INVENTARIO - Convertir NULL a valores reales de la imagen
  console.log('📦 Actualizando inventario...');
  
  const inventoryUpdates = [
    { nombre: 'Acido Hialuronico (Deep)', cantidad_actual: 15 },
    { nombre: 'Acido Hialuronico (Dip)', cantidad_actual: 12 },
    { nombre: 'Anestesia local', cantidad_actual: 25 },
    { nombre: 'Guantes desechables', cantidad_actual: 500 },
    { nombre: 'Mascarillas desechables', cantidad_actual: 200 }
  ];

  for (const item of inventoryUpdates) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ cantidad_actual: item.cantidad_actual })
      .eq('user_id', USER_ID)
      .eq('nombre', item.nombre)
      .select();

    if (error) {
      console.error(`❌ Error actualizando ${item.nombre}:`, error.message);
    } else {
      console.log(`✅ ${item.nombre}: cantidad_actual = ${item.cantidad_actual}`);
    }
  }

  // 2. VERIFICAR CITAS Y TIMEZONE
  console.log('\n📅 Verificando citas de hoy...');
  
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments, error: appError } = await supabase
    .from('appointments')
    .select('id, fecha_hora, duracion_minutos, estado, patient:patients(nombre, apellido)')
    .eq('user_id', USER_ID)
    .gte('fecha_hora', `${today}T00:00:00.000Z`)
    .lt('fecha_hora', `${today}T23:59:59.999Z`)
    .order('fecha_hora');

  if (appError) {
    console.error('❌ Error:', appError.message);
  } else if (!appointments || appointments.length === 0) {
    console.log('⚠️  No hay citas para hoy');
  } else {
    console.log(`Total citas: ${appointments.length}\n`);
    appointments.forEach((a, i) => {
      const dateUTC = new Date(a.fecha_hora);
      console.log(`Cita #${i + 1}:`);
      console.log(`  - fecha_hora (UTC): ${a.fecha_hora}`);
      console.log(`  - fecha_hora (objeto Date): ${dateUTC.toString()}`);
      console.log(`  - Paciente: ${a.patient.nombre} ${a.patient.apellido}`);
      console.log('');
    });
  }

  // 3. VERIFICAR INVENTARIO ACTUALIZADO
  console.log('\n📦 Verificando inventario actualizado...');
  const { data: inventory } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', USER_ID)
    .order('nombre');

  if (inventory) {
    inventory.forEach((item, i) => {
      const stock = item.cantidad_actual ?? 'NULL';
      const warning = (item.cantidad_actual ?? 0) <= (item.stock_minimo ?? 0) ? ' ⚠️' : ' ✅';
      console.log(`${i + 1}. ${item.nombre}: ${stock} / ${item.stock_minimo}${warning}`);
    });
  }
}

fixData().then(() => {
  console.log('\n✅ Datos arreglados');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
