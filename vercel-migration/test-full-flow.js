const { spawn } = require('child_process');

// Test completo de login y creación de paciente
async function fullPatientTest() {
  console.log('🧪 Iniciando test completo de login y creación de paciente...');
  
  // Paso 1: Hacer login
  console.log('1️⃣ Haciendo login...');
  const loginData = {
    email: 'test@demo.com',
    password: 'demo123'
  };

  try {
    // Use global fetch available in Node.js 18+
    const fetch = globalThis.fetch || require('node-fetch');
    
    // Login request
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('🔐 Login response status:', loginResponse.status);
    console.log('🔐 Login response headers:', Object.fromEntries(loginResponse.headers));

    // Get cookies for session
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies received:', cookies);

    if (!cookies) {
      console.log('❌ No cookies received from login, trying direct session test...');
    }

    // Paso 2: Verificar sesión
    console.log('2️⃣ Verificando sesión...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: cookies ? { 'Cookie': cookies } : {}
    });

    const sessionData = await sessionResponse.json();
    console.log('📡 Session data:', JSON.stringify(sessionData, null, 2));

    // Paso 3: Intentar crear paciente
    console.log('3️⃣ Intentando crear paciente...');
    const patientData = {
      nombre: 'Test Patient ' + Date.now(),
      telefono: '+1-555-TEST',
      email: 'testpatient@example.com',
      direccion: 'Test Address 123',
      fecha_nacimiento: '1990-01-01',
      requiere_factura: false
    };

    const patientResponse = await fetch('http://localhost:3000/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies ? { 'Cookie': cookies } : {})
      },
      body: JSON.stringify(patientData)
    });

    console.log('🏥 Patient creation status:', patientResponse.status);
    const responseText = await patientResponse.text();
    console.log('🏥 Patient creation response:', responseText);

    try {
      const patientResult = JSON.parse(responseText);
      console.log('✅ Patient creation result:', JSON.stringify(patientResult, null, 2));
    } catch (e) {
      console.log('📄 Raw response (not JSON):', responseText);
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

fullPatientTest();