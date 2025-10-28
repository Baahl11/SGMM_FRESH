// Test script to debug patient creation endpoint
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testPatientCreation() {
  console.log('🔥 Testing patient creation...');
  
  try {
    // First, check if patients table exists and its structure
    console.log('📋 Checking patients table structure...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'patients');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }
    
    console.log('📋 Tables found:', tables);
    
    if (!tables || tables.length === 0) {
      console.log('⚠️ Patients table does not exist! Creating it...');
      
      // Try to create the table with basic structure
      const { error: createError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS patients (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            fecha_nacimiento DATE,
            telefono VARCHAR(50),
            email VARCHAR(255),
            direccion TEXT,
            requiere_factura BOOLEAN DEFAULT FALSE,
            fotos TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID
          );
        `
      });
      
      if (createError) {
        console.error('❌ Error creating table:', createError);
        return;
      }
      
      console.log('✅ Patients table created!');
    }
    
    // Check table columns
    console.log('📋 Checking table columns...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'patients')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('📋 Table columns:', columns);
    }
    
    // Try to insert a test patient
    console.log('🔥 Testing patient insertion...');
    const testPatient = {
      nombre: 'Test Patient',
      fecha_nacimiento: '1990-01-01',
      telefono: '5551234567',
      email: 'test@example.com',
      direccion: 'Test Address',
      requiere_factura: false
    };
    
    console.log('📝 Test patient data:', testPatient);
    
    const { data: patient, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting patient:', insertError);
      console.error('❌ Error details:', insertError.details);
      console.error('❌ Error hint:', insertError.hint);
      console.error('❌ Error message:', insertError.message);
    } else {
      console.log('✅ Patient created successfully:', patient);
      
      // Clean up - delete the test patient
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);
      
      if (deleteError) {
        console.error('⚠️ Could not delete test patient:', deleteError);
      } else {
        console.log('🧹 Test patient cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPatientCreation();