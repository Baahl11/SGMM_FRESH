// Test directo del endpoint de disponibilidad
const fetch = require('node-fetch');

async function testAvailabilityEndpoint() {
  const today = new Date().toISOString().split('T')[0]; // "2026-01-29"
  const url = `https://agendamedpro.com/api/public/availability/dr-melgarejo?date=${today}`;
  
  console.log('🧪 TESTING ENDPOINT DE DISPONIBILIDAD\n');
  console.log('📍 URL:', url);
  console.log('📅 Fecha:', today, '\n');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 RESPUESTA DEL API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.slots && data.slots.length > 0) {
      console.log('\n✅ SLOTS DISPONIBLES:', data.slots.length);
      console.log('   ', data.slots.map(s => s.time).join(', '));
    } else {
      console.log('\n❌ NO HAY SLOTS DISPONIBLES');
      console.log('   Razón:', data.reason || 'Sin especificar');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAvailabilityEndpoint();
