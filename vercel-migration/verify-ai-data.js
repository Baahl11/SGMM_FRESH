// Script para verificar los datos que el AI debería estar viendo
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyData() {
  console.log('🔍 Verificando datos del AI...\n');

  // Obtener TODOS los usuarios
  const { data: users } = await supabase
    .from('users')
    .select('id, email');

  if (!users || users.length === 0) {
    console.error('❌ No hay usuarios en la BD');
    return;
  }

  console.log(`📋 USUARIOS ENCONTRADOS: ${users.length}\n`);
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} - ID: ${u.id}`);
  });
  console.log('\n' + '='.repeat(80) + '\n');

  // Verificar datos para CADA usuario
  for (const user of users) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`👤 USUARIO: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log('='.repeat(80) + '\n');
    
    const userId = user.id;

  // 1. VERIFICAR INVENTARIO
  console.log('📦 INVENTARIO:');
  const { data: inventory, error: invError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('nombre');

  if (invError) {
    console.error('❌ Error:', invError.message);
  } else if (!inventory || inventory.length === 0) {
    console.log('⚠️  No hay productos en inventario');
  } else {
    console.log(`Total productos: ${inventory.length}\n`);
    inventory.forEach((item, i) => {
      const stock = item.cantidad_actual ?? 'NULL';
      const minStock = item.stock_minimo ?? 'NULL';
      const price = item.precio_unitario ?? 'NULL';
      console.log(`${i + 1}. ${item.nombre}`);
      console.log(`   Stock actual: ${stock} ${item.unidad || 'unidades'}`);
      console.log(`   Stock mínimo: ${minStock}`);
      console.log(`   Precio unitario: $${price}`);
      console.log(`   Categoría: ${item.categoria || 'Sin categoría'}`);
      console.log('');
    });
  }

  // 2. VERIFICAR GASTOS FIJOS
  console.log('\n💰 GASTOS FIJOS:');
  const { data: gastos, error: gastosError } = await supabase
    .from('gastos_fijos')
    .select('*')
    .eq('user_id', userId)
    .order('monto', { ascending: false });

  if (gastosError) {
    console.error('❌ Error:', gastosError.message);
  } else if (!gastos || gastos.length === 0) {
    console.log('⚠️  No hay gastos fijos registrados');
  } else {
    console.log(`Total conceptos: ${gastos.length}\n`);
    let total = 0;
    gastos.forEach((g, i) => {
      console.log(`${i + 1}. ${g.concepto}`);
      console.log(`   Monto: $${g.monto || 0}`);
      console.log(`   Frecuencia: ${g.frecuencia || 'mensual'}`);
      console.log(`   Día de pago: ${g.dia_pago || 'N/A'}`);
      console.log(`   Activo: ${g.activo ? 'Sí' : 'No'}`);
      console.log('');
      total += g.monto || 0;
    });
    console.log(`TOTAL MENSUAL: $${total.toLocaleString('es-MX')} MXN`);
  }

  // 3. VERIFICAR CITAS DE HOY
  console.log('\n📅 CITAS DE HOY:');
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments, error: appError } = await supabase
    .from('appointments')
    .select('id, fecha_hora, duracion_minutos, estado, precio_acordado, patient:patients(nombre, apellido)')
    .eq('user_id', userId)
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
      const startDate = new Date(a.fecha_hora);
      const endDate = new Date(startDate.getTime() + (a.duracion_minutos || 30) * 60000);
      const time = startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const endTime = endDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const patientName = a.patient ? `${a.patient.nombre} ${a.patient.apellido}` : 'Sin nombre';

      console.log(`Cita #${i + 1}:`);
      console.log(`  - Hora: ${time} a ${endTime}`);
      console.log(`  - Paciente: ${patientName}`);
      console.log(`  - Estado: ${a.estado}`);
      console.log(`  - Precio: $${a.precio_acordado || 0}`);
      console.log('');
    });
  }
  }
}

verifyData().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
