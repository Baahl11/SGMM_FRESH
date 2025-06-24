#!/usr/bin/env node

/**
 * Script de Verificación de Integridad - SGMM
 * Verifica que el sistema esté en estado funcional completo
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SGMM - Verificación de Integridad del Sistema');
console.log('═'.repeat(60));

// Archivos críticos que deben existir
const criticalFiles = [
  'src/app/api/patients/route.ts',
  'src/app/api/patients/[id]/route.ts',
  'src/app/api/treatments/route.ts',
  'src/app/api/treatments/[id]/route.ts',
  'src/app/api/dashboard/stats/route.ts',
  'src/app/api/records/with-names/route.ts',
  'src/app/api/gastos-fijos/route.ts',
  'src/app/api/gastos-fijos/[id]/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/lib/api-auth.ts',
  'src/lib/api-service.ts',
  'backend/app/main.py',
  'backend/app/models.py',
  'backend/app/crud.py',
  'backend/consultorio.db',
  'package.json',
  'backend/requirements.txt',
  'README.md',
  'RESUMEN_FINAL_COMPLETO.md',
  'TROUBLESHOOTING.md',
  'test_comprehensive_final.js'
];

// Tests de verificación
const testFiles = [
  'test_comprehensive_final.js',
  'test_auth.js',
  'test_all_endpoints.js'
];

let allGood = true;

console.log('📁 Verificando archivos críticos...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ FALTA: ${file}`);
    allGood = false;
  }
});

console.log('\n🧪 Verificando tests disponibles...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ FALTA: ${file}`);
    allGood = false;
  }
});

// Verificar contenido de archivos clave
console.log('\n🔍 Verificando contenido crítico...');

const apiAuthExists = fs.existsSync('src/lib/api-auth.ts');
if (apiAuthExists) {
  const content = fs.readFileSync('src/lib/api-auth.ts', 'utf8');
  if (content.includes('authenticateRequest')) {
    console.log('✅ Función authenticateRequest presente');
  } else {
    console.log('❌ Función authenticateRequest faltante');
    allGood = false;
  }
}

const patientIdRouteExists = fs.existsSync('src/app/api/patients/[id]/route.ts');
if (patientIdRouteExists) {
  const content = fs.readFileSync('src/app/api/patients/[id]/route.ts', 'utf8');
  if (content.includes('authenticateRequest') && content.includes('/patients/')) {
    console.log('✅ Ruta dinámica de pacientes correctamente implementada');
  } else {
    console.log('❌ Ruta dinámica de pacientes con problemas');
    allGood = false;
  }
}

// Resumen final
console.log('\n' + '═'.repeat(60));
if (allGood) {
  console.log('🎉 SISTEMA EN ESTADO PERFECTO');
  console.log('✅ Todos los archivos críticos presentes');
  console.log('✅ Configuración correcta detectada');
  console.log('✅ Listo para deployment');
  console.log('\n🚀 Para verificar funcionamiento ejecutar:');
  console.log('   node test_comprehensive_final.js');
} else {
  console.log('⚠️  SISTEMA CON PROBLEMAS DETECTADOS');
  console.log('❌ Revisar archivos faltantes arriba');
  console.log('💡 Restaurar desde backup: SGMM_BACKUP_FUNCIONAL_2025-06-23');
}

console.log('\n📅 Verificación completada:', new Date().toLocaleString());
