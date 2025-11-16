/**
 * Quick Setup Script
 * Aplica migración SQL y ejecuta migración de datos
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔐 Setup de Encriptación AES-256-GCM\n');

// 1. Verificar ENCRYPTION_MASTER_KEY
console.log('Step 1: Verificando ENCRYPTION_MASTER_KEY...');
const envContent = fs.readFileSync('.env.local', 'utf8');
if (!envContent.includes('ENCRYPTION_MASTER_KEY')) {
  console.log('❌ ENCRYPTION_MASTER_KEY no encontrada en .env.local');
  process.exit(1);
}
console.log('✅ ENCRYPTION_MASTER_KEY configurada\n');

// 2. Instrucciones para SQL
console.log('Step 2: Aplicar migración SQL');
console.log('═══════════════════════════════════════════════════════════');
console.log('Por favor, ejecuta el siguiente SQL en Supabase Dashboard:');
console.log('https://supabase.com/dashboard/project/bpxppzgsgwjlqaykxgmb/sql');
console.log('═══════════════════════════════════════════════════════════\n');

const sqlContent = fs.readFileSync('supabase/migrations/20251116_facturama_encryption_aes256.sql', 'utf8');
console.log(sqlContent);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('Después de ejecutar el SQL, presiona ENTER para continuar...');
console.log('═══════════════════════════════════════════════════════════\n');

// Esperar confirmación
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('', () => {
  readline.close();
  
  console.log('\n✅ Migración SQL aplicada');
  console.log('\nStep 3: Ejecutando migración de datos...\n');
  
  try {
    execSync('npx tsx scripts/migrate-facturama-encryption.ts', { stdio: 'inherit' });
    console.log('\n🎉 ¡Setup completo!');
  } catch (error) {
    console.error('\n❌ Error en migración de datos:', error.message);
    process.exit(1);
  }
});
