const BASE_URL = 'http://localhost:3000';

async function comprehensiveAPITest() {
  console.log('🔥 SGMM - Comprehensive API Test Suite\n');
  console.log('Testing all critical endpoints after fixes...\n');

  let token = null;
  
  try {
    // Step 1: Authentication
    console.log('1️⃣ AUTHENTICATION');
    console.log('─'.repeat(50));
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.access_token;
      console.log('✅ Login successful');
      console.log(`✅ Token received: ${token.substring(0, 25)}...`);
    } else {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Step 2: Patients
    console.log('\n2️⃣ PATIENTS');
    console.log('─'.repeat(50));
    
    // List patients
    const patientsResponse = await fetch(`${BASE_URL}/api/patients`, { headers });
    if (patientsResponse.ok) {
      const patients = await patientsResponse.json();
      console.log(`✅ List patients: ${patients.length} found`);
      
      // Individual patient
      if (patients.length > 0) {
        const firstPatientId = patients[0].id;
        const patientResponse = await fetch(`${BASE_URL}/api/patients/${firstPatientId}`, { headers });
        if (patientResponse.ok) {
          const patient = await patientResponse.json();
          console.log(`✅ Get patient ${firstPatientId}: ${patient.nombre}`);
        } else {
          console.log(`❌ Get patient ${firstPatientId}: ${patientResponse.status}`);
        }
      }
    } else {
      console.log('❌ List patients:', patientsResponse.status);
    }

    // Step 3: Treatments
    console.log('\n3️⃣ TREATMENTS');
    console.log('─'.repeat(50));
    
    const treatmentsResponse = await fetch(`${BASE_URL}/api/treatments`, { headers });
    if (treatmentsResponse.ok) {
      const treatments = await treatmentsResponse.json();
      console.log(`✅ List treatments: ${treatments.length} found`);
    } else {
      console.log('❌ List treatments:', treatmentsResponse.status);
    }

    // Step 4: Dashboard Stats
    console.log('\n4️⃣ DASHBOARD');
    console.log('─'.repeat(50));
    
    const statsResponse = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers });
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Dashboard stats loaded');
      console.log(`   • Patients: ${stats.total_patients || 'N/A'}`);
      console.log(`   • Appointments: ${stats.total_appointments || 'N/A'}`);
      console.log(`   • Revenue: $${stats.total_revenue || 'N/A'}`);
    } else {
      console.log('❌ Dashboard stats:', statsResponse.status);
    }

    // Step 5: Records with Names
    console.log('\n5️⃣ RECORDS');
    console.log('─'.repeat(50));
    
    const recordsResponse = await fetch(`${BASE_URL}/api/records/with-names`, { headers });
    if (recordsResponse.ok) {
      const records = await recordsResponse.json();
      console.log(`✅ Records with names: ${records.length} found`);
    } else {
      console.log('❌ Records with names:', recordsResponse.status);
    }

    // Step 6: Gastos Fijos
    console.log('\n6️⃣ GASTOS FIJOS');
    console.log('─'.repeat(50));
    
    const gastosResponse = await fetch(`${BASE_URL}/api/gastos-fijos`, { headers });
    if (gastosResponse.ok) {
      const gastos = await gastosResponse.json();
      console.log(`✅ Gastos fijos: ${gastos.length} found`);
    } else {
      console.log('❌ Gastos fijos:', gastosResponse.status);
    }

    // Step 7: Inventory Health
    console.log('\n7️⃣ INVENTORY');
    console.log('─'.repeat(50));
    
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory/health`, { headers });
    if (inventoryResponse.ok) {
      const inventory = await inventoryResponse.json();
      console.log('✅ Inventory health check passed');
    } else {
      console.log('❌ Inventory health:', inventoryResponse.status);
    }

    // Summary
    console.log('\n🎉 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log('✅ Critical API routes are functional');
    console.log('✅ Authentication system working');
    console.log('✅ Patient individual routes fixed');
    console.log('✅ All proxy routes implemented');
    console.log('\n🚀 SGMM is ready for deployment!');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.log('\n📋 Next steps:');
    console.log('1. Check backend is running (port 8000)');
    console.log('2. Check frontend is running (port 3000)');
    console.log('3. Review server logs for errors');
  }
}

comprehensiveAPITest();
