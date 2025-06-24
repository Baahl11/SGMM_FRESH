const BASE_URL = 'http://localhost:3000';

async function testPatientRoutes() {
  console.log('🔐 Testing frontend patient authentication and routes...\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Extract token from response
    const token = loginData.access_token;
    if (!token) {
      console.error('❌ No token received in login response');
      return;
    }
    console.log('✅ Got token:', token.substring(0, 20) + '...\n');

    // Step 2: Test list patients
    console.log('2. Testing list patients...');
    const listResponse = await fetch(`${BASE_URL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      console.error('❌ List patients failed:', listResponse.status);
      const errorText = await listResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const patients = await listResponse.json();
    console.log(`✅ Got ${patients.length} patients`);
    
    if (patients.length === 0) {
      console.error('❌ No patients found to test individual patient route');
      return;
    }

    const firstPatient = patients[0];
    console.log(`First patient: ${firstPatient.nombre || firstPatient.name || 'Unknown'} (ID: ${firstPatient.id})\n`);

    // Step 3: Test individual patient
    console.log('3. Testing individual patient...');
    const patientResponse = await fetch(`${BASE_URL}/api/patients/${firstPatient.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Individual patient status:', patientResponse.status);

    if (!patientResponse.ok) {
      console.error('❌ Individual patient failed:', patientResponse.status);
      const errorText = await patientResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const patient = await patientResponse.json();
    console.log(`✅ Got patient: ${patient.nombre || patient.name || 'Unknown'}`);
    console.log('Patient data:', patient);

    // Step 4: Test with cookie authentication (browser-style)
    console.log('\n4. Testing with cookie authentication...');
    
    // Simulate setting a cookie (this would normally be done by the browser)
    const cookieResponse = await fetch(`${BASE_URL}/api/patients/${firstPatient.id}`, {
      headers: {
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Cookie auth status:', cookieResponse.status);

    if (!cookieResponse.ok) {
      console.error('❌ Cookie authentication failed:', cookieResponse.status);
      const errorText = await cookieResponse.text();
      console.error('Error details:', errorText);
    } else {
      const cookiePatient = await cookieResponse.json();
      console.log(`✅ Cookie auth works: ${cookiePatient.nombre || cookiePatient.name || 'Unknown'}`);
    }

    console.log('\n🎉 All patient route tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testPatientRoutes();
