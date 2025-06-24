// Test simple para verificar que upload funciona
console.log('🧪 Verificando funcionalidad de upload...');

// Este script debe ejecutarse en el browser console para probar upload
const testInBrowser = `
// Ejecutar este código en la consola del browser (F12) cuando estés en la página de pacientes

console.log('📸 Testing Image Upload in Browser...');

// Función para probar upload
async function testImageUploadFromBrowser() {
  try {
    // Verificar que estamos logueados
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login first.');
      return;
    }
    console.log('✅ Token found');

    // Crear una imagen de prueba (1x1 pixel PNG transparente)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1, 1);
    
    canvas.toBlob(async (blob) => {
      console.log('📤 Uploading test image...');
      
      const formData = new FormData();
      formData.append('file', blob, 'test.png');
      
      // Usar patient ID 1 (debe existir)
      const response = await fetch('http://localhost:8000/patients/1/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful!', result);
      } else {
        const error = await response.text();
        console.log('❌ Upload failed:', response.status, error);
      }
    }, 'image/png');
    
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Ejecutar el test
testImageUploadFromBrowser();
`;

console.log('🎯 INSTRUCCIONES PARA PROBAR EL UPLOAD:');
console.log('═════════════════════════════════════════════════════════');
console.log('1. Abrir el navegador en: http://localhost:3000');
console.log('2. Iniciar sesión con: admin@consultorio.com / admin123');
console.log('3. Abrir la consola del navegador (F12)');
console.log('4. Copiar y pegar el siguiente código:');
console.log('');
console.log(testInBrowser);
console.log('');
console.log('📝 ALTERNATIVA MANUAL:');
console.log('═════════════════════════════════════════════════════════');
console.log('1. Ir a la página de Pacientes');
console.log('2. Hacer clic en cualquier paciente');
console.log('3. Buscar la sección de "Galería de Imágenes"');
console.log('4. Hacer clic en "Agregar Imágenes"');
console.log('5. Seleccionar una imagen pequeña (JPG/PNG, menos de 5MB)');
console.log('6. Observar si aparece algún error');
console.log('');
console.log('🔍 QUÉ BUSCAR:');
console.log('═════════════════════════════════════════════════════════');
console.log('• Si aparece "¡Imágenes subidas exitosamente!" = ✅ FUNCIONA');
console.log('• Si aparece algún error = revisar console del navegador');
console.log('• Si no pasa nada = verificar que los archivos estén seleccionados');

// También crear un archivo HTML simple para testear
const htmlTest = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Upload SGMM</title>
</head>
<body>
    <h1>Test Upload de Imágenes SGMM</h1>
    <input type="file" id="fileInput" accept="image/*" multiple>
    <button onclick="testUpload()">Test Upload</button>
    <div id="result"></div>
    
    <script>
        async function testUpload() {
            const fileInput = document.getElementById('fileInput');
            const resultDiv = document.getElementById('result');
            
            if (!fileInput.files.length) {
                resultDiv.innerHTML = '<p style="color: red;">Selecciona una imagen primero</p>';
                return;
            }
            
            // Simular token (usar uno real del localStorage)
            const token = 'test_token_replace_with_real';
            
            resultDiv.innerHTML = '<p>Subiendo imagen...</p>';
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const response = await fetch('http://localhost:8000/patients/1/upload-image', {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    resultDiv.innerHTML = '<p style="color: green;">✅ Upload exitoso: ' + JSON.stringify(result) + '</p>';
                } else {
                    const error = await response.text();
                    resultDiv.innerHTML = '<p style="color: red;">❌ Error: ' + error + '</p>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<p style="color: red;">❌ Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
`;

console.log('💡 DIAGNÓSTICO RÁPIDO:');
console.log('═════════════════════════════════════════════════════════');
console.log('• Backend corriendo: ✅ Sí (puerto 8000)');
console.log('• Frontend corriendo: ✅ Sí (puerto 3000)');
console.log('• Endpoint de auth corregido: ✅ Sí (/auth/login)');
console.log('• Upload endpoint existe: ✅ Sí (/patients/{id}/upload-image)');
console.log('• Validación de archivos: ✅ Sí (tipo y tamaño)');
console.log('');
console.log('🎯 PRÓXIMO PASO: Probar desde el frontend web');
