#!/usr/bin/env node

/**
 * SGMM - Sistema de Verificación de Integridad
 * Verifica que el sistema esté en estado funcional completo
 * Creado: 23 de Junio 2025
 * Tag de referencia: v1.0-FUNCTIONAL-GOLD
 */

const fs = require('fs');
const path = require('path');

// Critical files that must exist for the system to be functional
const CRITICAL_FILES = [
  // Authentication & Core
  'src/lib/api-auth.ts',
  'src/lib/api-service.ts',
  
  // API Routes - Auth
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/logout/route.ts',
  
  // API Routes - Patients
  'src/app/api/patients/route.ts',
  'src/app/api/patients/[id]/route.ts',
  
  // API Routes - Treatments
  'src/app/api/treatments/route.ts',
  'src/app/api/treatments/[id]/route.ts',
  'src/app/api/treatments/[id]/inventory/route.ts',
  'src/app/api/treatments/[id]/inventory/[itemId]/route.ts',
  
  // API Routes - Dashboard & Reports
  'src/app/api/dashboard/stats/route.ts',
  'src/app/api/records/with-names/route.ts',
  'src/app/api/records/[id]/with-treatments/route.ts',
  
  // API Routes - Gastos Fijos
  'src/app/api/gastos-fijos/route.ts',
  'src/app/api/gastos-fijos/[id]/route.ts',
  
  // API Routes - Inventory
  'src/app/api/inventory/health/route.ts',
  'src/app/api/inventory/movements/route.ts',
  'src/app/api/inventory/[id]/route.ts',
  
  // Backend
  'backend/app/main.py',
  'backend/app/auth.py',
  'backend/app/crud.py',
  'backend/app/models.py',
  'backend/app/schemas.py',
  'backend/consultorio.db',
  'backend/requirements.txt',
  'backend/run.py',
  
  // Configuration
  'package.json',
  'next.config.js',
  'tsconfig.json',
  
  // Documentation
  'README.md',
  'RESUMEN_FINAL_COMPLETO.md',
  'TROUBLESHOOTING.md',
  'GUIA_RESTAURACION_FUNCIONAL.md'
];

// Content patterns that should exist in critical files
const CONTENT_CHECKS = {
  'src/lib/api-auth.ts': ['authenticateRequest', 'AuthResult'],
  'src/app/api/patients/[id]/route.ts': ['GET', 'PUT', 'DELETE', 'Bearer ${authResult.token}'],
  'backend/app/main.py': ['/patients/{patient_id}', 'get_patient', '@app.get'],
  'backend/consultorio.db': [], // Just check existence
  'test_comprehensive_final.js': ['comprehensiveAPITest', '🚀 SGMM is ready for deployment']
};

async function verifySystemIntegrity() {
  console.log('🔍 SGMM - Sistema de Verificación de Integridad\n');
  console.log('📅 Verificando estado funcional del 23 de Junio 2025\n');
  
  let allGood = true;
  let checksPerformed = 0;
  let checksPassed = 0;
  
  console.log('1️⃣ VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
  console.log('─'.repeat(50));
  
  for (const file of CRITICAL_FILES) {
    checksPerformed++;
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
      checksPassed++;
    } else {
      console.log(`❌ FALTANTE: ${file}`);
      allGood = false;
    }
  }
  
  console.log('\n2️⃣ VERIFICACIÓN DE CONTENIDO');
  console.log('─'.repeat(50));
  
  for (const [file, patterns] of Object.entries(CONTENT_CHECKS)) {
    const fullPath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ARCHIVO NO EXISTE: ${file}`);
      allGood = false;
      continue;
    }
    
    if (patterns.length === 0) {
      console.log(`✅ ${file} (solo existencia)`);
      continue;
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let fileOk = true;
      
      for (const pattern of patterns) {
        if (!content.includes(pattern)) {
          console.log(`❌ ${file} - Falta patrón: "${pattern}"`);
          fileOk = false;
          allGood = false;
        }
      }
      
      if (fileOk) {
        console.log(`✅ ${file} - Contenido verificado`);
      }
    } catch (error) {
      console.log(`❌ Error leyendo ${file}: ${error.message}`);
      allGood = false;
    }
  }
  
  console.log('\n3️⃣ VERIFICACIÓN DE CONFIGURACIÓN');
  console.log('─'.repeat(50));
  
  // Check package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.dev) {
      console.log('✅ package.json - Scripts configurados');
    } else {
      console.log('❌ package.json - Scripts de desarrollo faltantes');
      allGood = false;
    }
  } catch (error) {
    console.log('❌ Error verificando package.json');
    allGood = false;
  }
  
  // Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules - Dependencias instaladas');
  } else {
    console.log('⚠️  node_modules - Ejecutar npm install');
  }
  
  // Check backend dependencies
  if (fs.existsSync('backend/venv') || fs.existsSync('backend/.venv')) {
    console.log('✅ Backend - Entorno virtual detectado');
  } else {
    console.log('⚠️  Backend - Crear entorno virtual y ejecutar pip install -r requirements.txt');
  }
  
  console.log('\n4️⃣ RESUMEN DE VERIFICACIÓN');
  console.log('═'.repeat(50));
  
  console.log(`📊 Archivos verificados: ${checksPassed}/${CRITICAL_FILES.length}`);
  console.log(`📊 Verificaciones totales: ${checksPerformed}`);
  
  if (allGood && checksPassed === CRITICAL_FILES.length) {
    console.log('\n🎉 ¡SISTEMA ÍNTEGRO Y FUNCIONAL!');
    console.log('✅ Todos los archivos críticos presentes');
    console.log('✅ Contenido verificado correctamente');
    console.log('✅ El sistema está listo para ejecutarse');
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar backend: cd backend && python run.py');
    console.log('2. Ejecutar frontend: npm run dev');
    console.log('3. Verificar funcionalidad: node test_comprehensive_final.js');
    
    return true;
  } else {
    console.log('\n❌ SISTEMA INCOMPLETO O DAÑADO');
    console.log('🔧 Se requiere restauración desde backup');
    
    console.log('\n📋 OPCIONES DE RESTAURACIÓN:');
    console.log('1. Git: git checkout v1.0-FUNCTIONAL-GOLD');
    console.log('2. Backup físico: Ver GUIA_RESTAURACION_FUNCIONAL.md');
    console.log('3. Archivo específico: git checkout v1.0-FUNCTIONAL-GOLD -- ruta/archivo');
    
    return false;
  }
}

// Execute verification
verifySystemIntegrity().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Error durante verificación:', error.message);
  process.exit(1);
});
