// Test authentication and API endpoints
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'admin@consultorio.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      return data.access_token;
    } else {
      const error = await response.text();
      console.error('Login failed:', error);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

async function testTreatments(token) {
  try {
    console.log('Testing treatments endpoint...');
    const response = await fetch(`${FRONTEND_URL}/api/treatments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Treatments fetch successful:', data.length, 'treatments found');
      return true;
    } else {
      const error = await response.text();
      console.error('Treatments fetch failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Treatments fetch error:', error);
    return false;
  }
}

async function runTests() {
  console.log('Starting authentication and API tests...');
  
  const token = await testLogin();
  if (token) {
    await testTreatments(token);
  }
  
  console.log('Tests completed.');
}

runTests();
