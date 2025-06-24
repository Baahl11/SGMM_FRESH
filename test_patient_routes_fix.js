const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = '';

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    authToken = data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

async function testEndpoint(name, endpoint, method = 'GET', body = null) {
  console.log(`\n🧪 Testing ${name}: ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS (${response.status})`);
      if (Array.isArray(data)) {
        console.log(`   📊 Returned ${data.length} items`);
      } else if (data && typeof data === 'object') {
        console.log(`   📄 Returned object with keys: ${Object.keys(data).join(', ')}`);
      }
      return { success: true, status: response.status, data };
    } else {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      console.log(`   🔍 Error: ${JSON.stringify(data, null, 2)}`);
      return { success: false, status: response.status, error: data };
    }
  } catch (error) {
    console.log(`💥 ${name}: ERROR`);
    console.log(`   🔍 Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Route Tests');
  console.log('=====================================');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  const results = {};

  // Test dynamic patient routes (the main issue we fixed)
  console.log('\n📋 Testing Patient Routes:');
  results.patients = await testEndpoint('Get Patients', '/api/patients');
  results.patientById = await testEndpoint('Get Patient by ID', '/api/patients/1');
  
  // Test other critical routes
  console.log('\n🏥 Testing Treatment Routes:');
  results.treatments = await testEndpoint('Get Treatments', '/api/treatments');
  results.treatmentById = await testEndpoint('Get Treatment by ID', '/api/treatments/1');
  
  console.log('\n📊 Testing Dashboard Routes:');
  results.dashboardStats = await testEndpoint('Dashboard Stats', '/api/dashboard/stats');
  
  console.log('\n📝 Testing Record Routes:');
  results.recordsWithNames = await testEndpoint('Records with Names', '/api/records/with-names');
  
  console.log('\n💰 Testing Gastos Fijos Routes:');
  results.gastosFijos = await testEndpoint('Gastos Fijos', '/api/gastos-fijos');
  
  console.log('\n📦 Testing Inventory Routes:');
  results.inventoryHealth = await testEndpoint('Inventory Health', '/api/inventory/health');
  results.inventoryMovements = await testEndpoint('Inventory Movements', '/api/inventory/movements');

  // Test treatment inventory routes (if we have treatments)
  if (results.treatments.success && results.treatments.data && results.treatments.data.length > 0) {
    const firstTreatmentId = results.treatments.data[0].id;
    console.log('\n🔧 Testing Treatment Inventory Routes:');
    results.treatmentInventory = await testEndpoint(
      'Treatment Inventory', 
      `/api/treatments/${firstTreatmentId}/inventory`
    );
  }

  // Generate summary
  console.log('\n📈 Test Summary:');
  console.log('=====================================');
  
  const testResults = Object.entries(results);
  const successful = testResults.filter(([, result]) => result.success).length;
  const total = testResults.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  testResults.forEach(([name, result]) => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status ? ` (${result.status})` : '';
    console.log(`   ${status} ${name}${statusCode}`);
  });

  // Check for the specific fix we made
  if (results.patientById && results.patientById.success) {
    console.log('\n🎉 SUCCESS: Patient by ID route is now working!');
    console.log('   The 404 error for /api/patients/[id] has been fixed.');
  } else {
    console.log('\n⚠️  WARNING: Patient by ID route still has issues.');
    if (results.patientById && results.patientById.status === 404) {
      console.log('   The route may still be missing or not properly configured.');
    }
  }

  console.log('\n🏁 Tests completed!');
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
