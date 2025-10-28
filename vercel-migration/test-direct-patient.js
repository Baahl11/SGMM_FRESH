// Simple test script to test patient creation directly
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

async function testDirectPatientCreation() {
  console.log('🔥 Testing direct patient creation...');
  
  try {
    // Try to get existing patients first
    console.log('📋 Checking existing patients...');
    const { data: existingPatients, error: selectError } = await supabase
      .from('patients')
      .select('*')
      .limit(5);
    
    console.log('📋 Select result:', { data: existingPatients, error: selectError });
    
    // Try to insert a test patient
    console.log('🔥 Testing patient insertion...');
    const testPatient = {
      nombre: 'Test Patient Direct',
      fecha_nacimiento: '1990-01-01',
      telefono: '5551234567',
      email: 'testdirect@example.com',
      direccion: 'Test Address Direct',
      requiere_factura: false
    };
    
    console.log('📝 Test patient data:', testPatient);
    
    const { data: patient, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single();
    
    console.log('📝 Insert result:', { data: patient, error: insertError });
    
    if (insertError) {
      console.error('❌ Error inserting patient:', insertError);
      
      // Let's try with minimal data
      console.log('🔄 Trying with minimal data...');
      const minimalPatient = {
        nombre: 'Minimal Test'
      };
      
      const { data: minPatient, error: minError } = await supabase
        .from('patients')
        .insert([minimalPatient])
        .select()
        .single();
      
      console.log('📝 Minimal insert result:', { data: minPatient, error: minError });
      
      if (minPatient) {
        // Clean up
        await supabase.from('patients').delete().eq('id', minPatient.id);
        console.log('🧹 Minimal test patient cleaned up');
      }
      
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

testDirectPatientCreation();