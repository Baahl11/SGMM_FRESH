require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReminderInfrastructure() {
  console.log('🔍 VERIFICANDO INFRAESTRUCTURA PARA RECORDATORIOS\n');
  
  const userId = '86cbe61c-8829-41a2-aa29-81e11844f83e';
  
  // 1. Verificar columnas en appointments
  console.log('📋 1. Verificando tabla appointments...');
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .limit(1);
  
  if (appointments && appointments.length > 0) {
    console.log('   Columnas disponibles:', Object.keys(appointments[0]));
    console.log('   ✅ Tiene recordatorio_enviado:', 'recordatorio_enviado' in appointments[0] ? 'SÍ' : 'NO');
  }
  
  // 2. Verificar tabla de templates de WhatsApp
  console.log('\n📱 2. Verificando whatsapp_templates...');
  const { data: templates, error: templatesError } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('user_id', userId);
  
  if (templatesError) {
    console.log('   ❌ Tabla no existe o error:', templatesError.message);
  } else {
    console.log('   ✅ Tabla existe');
    console.log('   Templates disponibles:', templates?.length || 0);
    if (templates && templates.length > 0) {
      console.log('   Columnas:', Object.keys(templates[0]));
    }
  }
  
  // 3. Verificar tabla de mensajes de WhatsApp
  console.log('\n💬 3. Verificando whatsapp_messages...');
  const { data: messages, error: messagesError } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('user_id', userId)
    .limit(1);
  
  if (messagesError) {
    console.log('   ❌ Tabla no existe o error:', messagesError.message);
  } else {
    console.log('   ✅ Tabla existe');
    if (messages && messages.length > 0) {
      console.log('   Columnas:', Object.keys(messages[0]));
    }
  }
  
  // 4. Verificar credenciales de WhatsApp
  console.log('\n🔑 4. Verificando credenciales WhatsApp...');
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;
  
  console.log('   TWILIO_ACCOUNT_SID:', twilioSid ? '✅ Configurado' : '❌ NO configurado');
  console.log('   TWILIO_AUTH_TOKEN:', twilioToken ? '✅ Configurado' : '❌ NO configurado');
  console.log('   TWILIO_WHATSAPP_NUMBER:', twilioWhatsApp ? `✅ ${twilioWhatsApp}` : '❌ NO configurado');
  
  // 5. Verificar si hay citas próximas para enviar recordatorios
  console.log('\n📅 5. Verificando citas próximas (próximas 48h)...');
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id, fecha_hora, recordatorio_enviado, patient:patients(nombre, apellido, telefono)')
    .eq('user_id', userId)
    .gte('fecha_hora', now.toISOString())
    .lte('fecha_hora', in48Hours.toISOString())
    .eq('estado', 'programada')
    .order('fecha_hora');
  
  if (upcomingAppointments) {
    console.log('   Total citas próximas:', upcomingAppointments.length);
    
    const withPhone = upcomingAppointments.filter(a => a.patient?.telefono);
    const withoutReminder = upcomingAppointments.filter(a => !a.recordatorio_enviado);
    
    console.log('   Con teléfono:', withPhone.length);
    console.log('   Sin recordatorio:', withoutReminder.length);
    
    if (withoutReminder.length > 0) {
      console.log('\n   📋 Citas que necesitan recordatorio:');
      withoutReminder.slice(0, 3).forEach(a => {
        const date = new Date(a.fecha_hora);
        console.log(`      - ${date.toLocaleString('es-MX')} | ${a.patient?.nombre || 'Sin nombre'} | ${a.patient?.telefono || 'Sin teléfono'}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log('   ✅ appointments tabla: Lista');
  console.log('   ' + (templatesError ? '❌' : '✅') + ' whatsapp_templates: ' + (templatesError ? 'Necesita crearse' : 'Lista'));
  console.log('   ' + (messagesError ? '❌' : '✅') + ' whatsapp_messages: ' + (messagesError ? 'Necesita crearse' : 'Lista'));
  console.log('   ' + (twilioSid ? '✅' : '❌') + ' Credenciales Twilio: ' + (twilioSid ? 'Configuradas' : 'Necesitan configurarse'));
  console.log('='.repeat(80));
}

checkReminderInfrastructure().catch(console.error);
