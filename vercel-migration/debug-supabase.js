// Debug script to test direct Supabase API
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Debug Info:')
console.log('Supabase URL:', supabaseUrl)
console.log('API Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDirectSupabase() {
  try {
    console.log('\n📡 Testing direct Supabase query...')
    
    // Test direct query to Supabase
    const { data, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('❌ Supabase Error:', error.message)
      console.error('Error details:', error)
      return
    }
    
    console.log('✅ Direct Supabase query successful!')
    console.log(`📊 Found ${count} patients in Supabase:`)
    console.log(JSON.stringify(data, null, 2))
    
    // Test if RLS is working (should return empty without auth)
    console.log('\n🔒 RLS Test: Query should return empty array (no auth)')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDirectSupabase()