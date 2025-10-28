// Test creating a patient in Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use service role key to bypass RLS for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testCreatePatient() {
  try {
    console.log('🧪 Testing patient creation in Supabase...')
    
    // Create a test patient
    const testPatient = {
      name: 'Paciente Test Supabase',
      email: 'test@supabase.com',
      phone: '555-SUPABASE',
      address: 'Test Address Supabase',
      date_of_birth: '1990-01-01',
      gender: 'M',
      medical_history: 'Test medical history for Supabase integration'
    }
    
    console.log('📝 Creating patient:', testPatient.name)
    
    const { data, error } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating patient:', error.message)
      console.error('Error details:', error)
      return
    }
    
    console.log('✅ Patient created successfully!')
    console.log('📋 Patient data:')
    console.log(JSON.stringify(data, null, 2))
    
    // Verify by querying all patients
    console.log('\n📊 Querying all patients...')
    const { data: allPatients, error: queryError } = await supabase
      .from('patients')
      .select('*')
    
    if (queryError) {
      console.error('❌ Error querying patients:', queryError.message)
      return
    }
    
    console.log(`✅ Total patients in database: ${allPatients.length}`)
    console.log('📋 All patients:')
    console.log(JSON.stringify(allPatients, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testCreatePatient()