require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyReminderMigration() {
  console.log('🔧 APLICANDO MIGRACIÓN DE RECORDATORIOS\n');
  
  try {
    // Ejecutar SQL usando la función RPC de Supabase
    const migration = `
      -- 1. Agregar columna para marcar si se envió recordatorio
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN DEFAULT false;

      -- 2. Agregar columnas para registrar cuándo se enviaron los recordatorios
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS recordatorio_24h_at TIMESTAMPTZ;
      
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS recordatorio_2h_at TIMESTAMPTZ;

      -- 3. Crear índice para mejorar queries de recordatorios
      CREATE INDEX IF NOT EXISTS idx_appointments_reminders 
      ON appointments(fecha_hora, recordatorio_enviado, estado) 
      WHERE estado IN ('programada', 'confirmada');
    `;
    
    console.log('📝 SQL a ejecutar guardado en: migrations/add-reminder-columns.sql');
    console.log('\n⚠️  INSTRUCCIONES:');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('   2. Copia el contenido de: migrations/add-reminder-columns.sql');
    console.log('   3. Ejecuta el SQL');
    console.log('   4. Verifica que se crearon las columnas');
    
    console.log('\n✅ Archivo de migración creado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyReminderMigration().catch(console.error);
