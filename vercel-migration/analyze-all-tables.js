// Script para listar TODAS las tablas del sistema y sus columnas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '86cbe61c-8829-41a2-aa29-81e11844f83e'; // gmelgarejom@gmail.com

// Tablas principales del sistema
const TABLES = [
  'appointments',
  'patients',
  'treatments',
  'inventory_items',
  'gastos_fijos',
  'gastos_variables',
  'users',
  'subscriptions',
  'messages',
  'conversations',
  'whatsapp_templates',
  'whatsapp_messages',
  'reports',
  'invoices',
  'payments',
  'notifications',
  'audit_logs',
  'team_members',
  'locations',
  'promo_codes',
  'bookings',
  'forms',
  'form_submissions'
];

async function analyzeAllTables() {
  console.log('🔍 ANÁLISIS COMPLETO DEL SISTEMA\n');
  console.log('='.repeat(80));
  console.log(`Usuario de prueba: ${USER_ID}\n`);

  for (const tableName of TABLES) {
    try {
      console.log(`\n📊 TABLA: ${tableName}`);
      console.log('-'.repeat(80));

      // Intentar obtener un registro para ver el esquema
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', USER_ID)
        .limit(1);

      if (error) {
        // Si falla con user_id, intentar sin filtro
        const { data: data2, error: error2, count: count2 } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);

        if (error2) {
          console.log(`❌ Error: ${error2.message}`);
          continue;
        }

        console.log(`⚠️  Tabla sin columna user_id (tabla global)`);
        console.log(`📈 Total registros: ${count2 || 0}`);
        
        if (data2 && data2.length > 0) {
          console.log(`📋 Columnas: ${Object.keys(data2[0]).join(', ')}`);
          console.log(`\n📝 Ejemplo de registro:`);
          console.log(JSON.stringify(data2[0], null, 2));
        }
      } else {
        console.log(`✅ Tabla con user_id`);
        console.log(`📈 Total registros del usuario: ${count || 0}`);
        
        if (data && data.length > 0) {
          console.log(`📋 Columnas: ${Object.keys(data[0]).join(', ')}`);
          console.log(`\n📝 Ejemplo de registro:`);
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log(`⚠️  Sin registros para este usuario`);
          
          // Obtener un registro de cualquier usuario para ver esquema
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (sampleData && sampleData.length > 0) {
            console.log(`📋 Columnas (de otro usuario): ${Object.keys(sampleData[0]).join(', ')}`);
          }
        }
      }

    } catch (e) {
      console.log(`❌ Error procesando ${tableName}:`, e.message);
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ Análisis completado\n');
}

analyzeAllTables().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
