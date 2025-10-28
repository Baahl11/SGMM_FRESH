// Test script to test the updated patient API
const fetch = require('node-fetch');

async function testPatientAPI() {
  console.log('🔥 Testing Patient API with correct field mapping...');
  
  try {
    // Test data with Spanish field names (as frontend sends)
    const testPatient = {
      nombre: 'Test Patient API',
      fecha_nacimiento: '1990-01-01',
      telefono: '5551234567',
      email: 'testapi@example.com',
      direccion: 'Test Address API',
      requiere_factura: false
    };
    
    console.log('📝 Sending patient data:', testPatient);
    
    // Test POST endpoint
    const response = await fetch('http://localhost:3000/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token' // Mock session
      },
      body: JSON.stringify(testPatient)
    });
    
    const responseData = await response.text();
    console.log('📝 Response status:', response.status);
    console.log('📝 Response data:', responseData);
    
    if (response.status === 201) {
      console.log('✅ Patient created successfully via API!');
      
      try {
        const patient = JSON.parse(responseData);
        console.log('👤 Created patient:', patient);
        
        // Test GET endpoint
        const getResponse = await fetch(`http://localhost:3000/api/patients/${patient.id}`);
        const getResponseData = await getResponse.text();
        console.log('📝 GET Response:', getResponseData);
        
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
      }
      
    } else {
      console.error('❌ Failed to create patient via API');
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseData);
        console.error('❌ Error details:', errorData);
      } catch (parseError) {
        console.error('❌ Raw error response:', responseData);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPatientAPI();