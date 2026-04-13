require('dotenv').config({ path: '.env.local' });

// Test del sistema completo de AI
async function testAllAIQueries() {
  const DEPLOYED_URL = 'https://agendamedpro.com/api/chat';
  const TOKEN = process.env.SUPABASE_ANON_KEY; // Usar token real del usuario

  // Obtener el usuario autenticado primero
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Buscar usuario de prueba
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'gmelgarejom@gmail.com')
    .single();

  if (!users) {
    console.error('❌ No se encontró usuario de prueba');
    return;
  }

  console.log('✅ Usuario de prueba encontrado:', users.email);
  console.log('📧 Ahora necesitas copiar el token de autenticación desde la app web');
  console.log('   1. Abre https://agendamedpro.com');
  console.log('   2. Inicia sesión con gmelgarejom@gmail.com');
  console.log('   3. Abre las herramientas del desarrollador (F12)');
  console.log('   4. Ve a la pestaña "Application" > "Local Storage"');
  console.log('   5. Busca la clave "sb-[...]-auth-token"');
  console.log('   6. Copia el valor del access_token\n');
  
  console.log('Por ahora, vamos a probar las consultas SIN autenticación:\n');

  const queries = [
    { q: '¿Cuántas citas hay hoy?', category: 'Citas' },
    { q: '¿Cuántos pacientes tengo?', category: 'Pacientes' },
    { q: '¿Cuáles son mis tratamientos?', category: 'Tratamientos' },
    { q: '¿Cuánto inventario tengo?', category: 'Inventario' },
    { q: 'Dame mis gastos fijos', category: 'Gastos Fijos' },
    { q: '¿Tengo mensajes de WhatsApp?', category: 'WhatsApp' },
    { q: '¿Cuántas facturas tengo?', category: 'Facturas' },
    { q: '¿Tengo notificaciones?', category: 'Notificaciones' },
    { q: '¿Quién está en mi equipo?', category: 'Equipo' },
    { q: '¿Cuál es mi ubicación principal?', category: 'Ubicaciones' },
    { q: '¿Cuál es mi plan de suscripción?', category: 'Suscripción' },
  ];

  console.log('🧪 PROBANDO TODAS LAS CONSULTAS DEL AI\n');
  console.log('=' .repeat(80) + '\n');

  for (const { q, category } of queries) {
    console.log(`📊 ${category}: "${q}"`);
    
    try {
      const response = await fetch(DEPLOYED_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Sin Authorization por ahora
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          userId: users.id,
        }),
      });

      if (!response.ok) {
        console.log(`   ❌ Error ${response.status}: ${response.statusText}\n`);
        continue;
      }

      // Leer el stream de respuesta
      const text = await response.text();
      
      // Extraer solo texto (el streaming usa formato especial)
      const lines = text.split('\n').filter(l => l.startsWith('0:'));
      const content = lines.map(l => {
        try {
          return JSON.parse(l.substring(2));
        } catch {
          return '';
        }
      }).join('');

      console.log(`   ✅ Respuesta: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('=' .repeat(80));
  console.log('✅ Prueba completada\n');
  console.log('💡 NOTA: Para obtener datos reales, necesitas autenticarte con un token válido');
}

testAllAIQueries().catch(console.error);
