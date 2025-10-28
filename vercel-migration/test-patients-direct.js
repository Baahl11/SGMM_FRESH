// Test directo del endpoint de pacientes sin autenticación
console.log('🧪 Probando endpoint /api/patients sin autenticación...');

async function testPatientsEndpoint() {
  try {
    const testPatient = {
      nombre: 'Test Patient Direct',
      telefono: '+1-555-DIRECT',
      email: 'direct@test.com',
      direccion: 'Direct Test Address',
      fecha_nacimiento: '1990-01-01',
      requiere_factura: false
    };

    console.log('📤 Enviando datos del paciente...');
    console.log('📋 Datos:', JSON.stringify(testPatient, null, 2));

    const response = await fetch('http://localhost:3000/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatient)
    });

    console.log('📥 Status:', response.status);
    console.log('📥 Status Text:', response.statusText);
    console.log('📥 Headers:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('📄 Response Text:', responseText);

    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📄 Parsed JSON:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('📄 Response is not JSON');
    }

    if (response.status === 401) {
      console.log('✅ Como esperado: 401 Unauthorized (necesita login)');
    } else if (response.status === 500) {
      console.log('❌ Error 500: Problema en el servidor');
    } else {
      console.log('🤔 Status inesperado:', response.status);
    }

  } catch (error) {
    console.error('❌ Error en la petición:', error);
  }
}

testPatientsEndpoint();