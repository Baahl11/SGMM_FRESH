const fetch = require('node-fetch');

async function testPatientAPI() {
  console.log('🧪 Testing Patient API at http://localhost:3000/api/patients');
  
  const testPatient = {
    nombre: 'Test Patient ' + Date.now(),
    telefono: '+1-555-TEST',
    email: 'test' + Date.now() + '@example.com',
    direccion: 'Test Address 123',
    fecha_nacimiento: '1990-01-01',
    requiere_factura: false
  };

  try {
    // First test: Check if server is responding
    console.log('1. Checking server health...');
    const healthResponse = await fetch('http://localhost:3000/api/patients');
    console.log('   Health check status:', healthResponse.status);
    
    // Second test: Try to create a patient (this will fail without auth, but we'll see the error)
    console.log('2. Testing patient creation (without auth)...');
    const createResponse = await fetch('http://localhost:3000/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatient)
    });
    
    console.log('   Create response status:', createResponse.status);
    const data = await createResponse.json();
    console.log('   Response data:', data);
    
    if (createResponse.status === 401) {
      console.log('✅ Expected 401 Unauthorized (need to login first)');
    } else {
      console.log('📄 Response:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPatientAPI();