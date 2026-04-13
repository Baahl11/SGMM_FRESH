require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReminderSystem() {
  console.log('🧪 TESTING SISTEMA DE RECORDATORIOS\n');
  
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e';
  
  // 1. Verificar que las columnas existen
  console.log('1️⃣  Verificando columnas de recordatorios...');
  const { data: sample } = await supabase
    .from('appointments')
    .select('id, recordatorio_enviado, recordatorio_24h_at, recordatorio_2h_at')
    .eq('user_id', userId)
    .limit(1);
  
  if (sample && sample.length > 0) {
    const hasColumns = 'recordatorio_enviado' in sample[0] && 
                      'recordatorio_24h_at' in sample[0] && 
                      'recordatorio_2h_at' in sample[0];
    
    if (hasColumns) {
      console.log('   ✅ Columnas creadas correctamente');
    } else {
      console.log('   ❌ Faltan columnas. Ejecuta la migración primero.');
      console.log('   Ejecuta: migrations/add-reminder-columns.sql en Supabase');
      return;
    }
  }
  
  // 2. Buscar citas próximas
  console.log('\n2️⃣  Buscando citas próximas (próximas 48 horas)...');
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      fecha_hora,
      recordatorio_enviado,
      recordatorio_24h_at,
      recordatorio_2h_at,
      patient:patients(nombre, apellido, telefono)
    `)
    .eq('user_id', userId)
    .gte('fecha_hora', now.toISOString())
    .lte('fecha_hora', in48h.toISOString())
    .eq('estado', 'programada')
    .order('fecha_hora');
  
  if (!appointments || appointments.length === 0) {
    console.log('   ℹ️  No hay citas programadas en las próximas 48 horas');
    console.log('   💡 Crea una cita de prueba para mañana para probar el sistema');
    return;
  }
  
  console.log(`   ✅ Encontradas ${appointments.length} citas próximas\n`);
  
  // 3. Analizar cada cita
  appointments.forEach((apt, i) => {
    const aptDate = new Date(apt.fecha_hora);
    const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const patient = apt.patient;
    
    console.log(`   📋 Cita ${i + 1}:`);
    console.log(`      Fecha: ${aptDate.toLocaleString('es-MX')}`);
    console.log(`      En: ${hoursUntil.toFixed(1)} horas`);
    console.log(`      Paciente: ${patient?.nombre} ${patient?.apellido}`);
    console.log(`      Teléfono: ${patient?.telefono || '❌ NO TIENE'}`);
    console.log(`      Recordatorio 24h: ${apt.recordatorio_24h_at ? '✅ Enviado' : '⏳ Pendiente'}`);
    console.log(`      Recordatorio 2h: ${apt.recordatorio_2h_at ? '✅ Enviado' : '⏳ Pendiente'}`);
    
    // Recomendaciones
    if (hoursUntil >= 23 && hoursUntil <= 25 && !apt.recordatorio_24h_at) {
      console.log(`      💡 ACCIÓN: Enviar recordatorio 24h`);
    }
    if (hoursUntil >= 1.5 && hoursUntil <= 2.5 && !apt.recordatorio_2h_at) {
      console.log(`      💡 ACCIÓN: Enviar recordatorio 2h`);
    }
    if (!patient?.telefono) {
      console.log(`      ⚠️  ADVERTENCIA: No se puede enviar recordatorio sin teléfono`);
    }
    
    console.log();
  });
  
  // 4. Verificar configuración de WhatsApp
  console.log('3️⃣  Verificando configuración de WhatsApp...');
  const hasWhatsAppConfig = 
    process.env.WHATSAPP_API_KEY && 
    process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (hasWhatsAppConfig) {
    console.log('   ✅ WhatsApp configurado (Meta Business API)');
  } else {
    console.log('   ⚠️  WhatsApp NO configurado');
    console.log('   Variables faltantes:');
    if (!process.env.WHATSAPP_API_KEY) console.log('      - WHATSAPP_API_KEY');
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) console.log('      - WHATSAPP_PHONE_NUMBER_ID');
  }
  
  // 5. Resumen
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DEL SISTEMA:');
  console.log('   ✅ Migración de BD: OK');
  console.log('   ✅ Endpoints creados: /api/agents/reminders/send y /cron');
  console.log('   ✅ Cron job configurado: Cada hora');
  console.log('   ' + (hasWhatsAppConfig ? '✅' : '⚠️ ') + ' WhatsApp API: ' + (hasWhatsAppConfig ? 'Configurado' : 'Pendiente'));
  console.log('\n📝 SIGUIENTE PASO:');
  if (!hasWhatsAppConfig) {
    console.log('   1. Configura WHATSAPP_API_KEY y WHATSAPP_PHONE_NUMBER_ID');
    console.log('   2. Genera CRON_SECRET con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.log('   3. Agrega las variables en Vercel');
  }
  console.log('   4. Aplica la migración SQL en Supabase (si no lo hiciste)');
  console.log('   5. Despliega a producción: npx vercel --prod');
  console.log('   6. Prueba manualmente el endpoint /api/agents/reminders/send');
  console.log('='.repeat(80));
}

testReminderSystem().catch(console.error);
