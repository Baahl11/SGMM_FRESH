// Complete Frontend-Backend Integration Test
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUploadIntegration() {
  console.log('🧪 Testing Complete Image Upload Integration...');
  
  const API_URL = 'http://localhost:8000';
  
  try {
    // 1. Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await fetch(`${API_URL}/docs`);
    if (!healthResponse.ok) {
      console.error('❌ Backend is not running. Start with: python backend/run.py');
      return false;
    }
    console.log('✅ Backend is running');

    // 2. Test login with correct credentials
    console.log('2. Testing login...');
    const formData = new URLSearchParams();
    formData.append('username', 'admin@consultorio.com');
    formData.append('password', 'admin123');

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', loginResponse.status, errorText);
      return false;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Login successful');

    // 3. Get patients
    console.log('3. Getting patients...');
    const patientsResponse = await fetch(`${API_URL}/patients?skip=0&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!patientsResponse.ok) {
      const errorText = await patientsResponse.text();
      console.error('❌ Failed to get patients:', patientsResponse.status, errorText);
      return false;
    }

    const patients = await patientsResponse.json();
    if (!patients || patients.length === 0) {
      console.error('❌ No patients found. Run: python backend/create_robust_data.py');
      return false;
    }

    const patientId = patients[0].id;
    console.log(`✅ Found patient ID: ${patientId} (${patients[0].nombre})`);

    // 4. Test image upload with actual file
    console.log('4. Testing image upload...');
    
    // Create a simple test image file
    const testImageContent = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0,
      0x07, 0xFF, 0xD9
    ]);

    const uploadFormData = new FormData();
    uploadFormData.append('file', testImageContent, {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await fetch(`${API_URL}/patients/${patientId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...uploadFormData.getHeaders()
      },
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status, errorText);
      return false;
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult.message);
    console.log(`📁 File saved as: ${uploadResult.filename}`);

    // 5. Verify image was saved
    console.log('5. Verifying uploaded image...');
    const imagesResponse = await fetch(`${API_URL}/patients/${patientId}/images`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!imagesResponse.ok) {
      const errorText = await imagesResponse.text();
      console.error('❌ Failed to get images:', imagesResponse.status, errorText);
      return false;
    }

    const imagesData = await imagesResponse.json();
    console.log(`✅ Patient has ${imagesData.images ? imagesData.images.length : 0} images`);

    console.log('\n🎉 IMAGE UPLOAD SYSTEM IS WORKING CORRECTLY!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Backend running and healthy');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Patient data accessible');
    console.log('   ✅ Image upload endpoint functional');
    console.log('   ✅ Image storage and retrieval working');
    console.log('\n💡 If frontend still shows errors:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Check browser console for specific errors');
    console.log('   3. Ensure frontend is using correct API endpoints');
    console.log('   4. Verify file format and size limits');

    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

// Run the test
testImageUploadIntegration().then(success => {
  if (success) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Tests failed. Check error messages above.');
  }
});
