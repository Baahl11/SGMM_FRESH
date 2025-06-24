// Test all main API endpoints
const FRONTEND_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@consultorio.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful');
      return data.access_token;
    } else {
      console.error('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function testEndpoint(name, url, token) {
  try {
    const response = await fetch(`${FRONTEND_URL}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: ${Array.isArray(data) ? data.length + ' items' : 'OK'}`);
      return true;
    } else {
      console.error(`❌ ${name}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${name} error:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const token = await testLogin();
  if (!token) {
    console.log('❌ Cannot proceed without valid token');
    return;
  }

  console.log('\n📊 Testing main endpoints:');
  await testEndpoint('Patients', '/api/patients', token);
  await testEndpoint('Treatments', '/api/treatments', token);
  await testEndpoint('Dashboard Stats', '/api/dashboard/stats', token);
  await testEndpoint('Records with Names', '/api/records/with-names', token);
  await testEndpoint('Gastos Fijos', '/api/gastos-fijos', token);
  
  console.log('\n🎯 All tests completed!');
}

runAllTests();
