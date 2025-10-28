// Test simple y directo
console.log('🧪 Test simple - verificando servidor...');

// Test básico con timeout
const testTimeout = setTimeout(() => {
  console.log('❌ Timeout alcanzado, terminando test');
  process.exit(1);
}, 10000);

async function simpleTest() {
  try {
    console.log('📡 Probando conexión al servidor...');
    
    const response = await fetch('http://localhost:3000/api/auth/session');
    console.log('✅ Servidor responde, status:', response.status);
    
    const data = await response.text();
    console.log('📄 Respuesta:', data);
    
    clearTimeout(testTimeout);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    clearTimeout(testTimeout);
    process.exit(1);
  }
}

simpleTest();