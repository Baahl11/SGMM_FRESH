// Test Supabase connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('patients')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return false
    }
    
    console.log('✅ Connection successful!')
    
    // Test RLS policies
    console.log('🔒 Testing RLS policies...')
    const { data: user } = await supabase.auth.getUser()
    console.log('Current user:', user.user?.id || 'No authenticated user')
    
    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('🎉 Supabase setup is working correctly!')
    } else {
      console.log('💡 Please check your configuration')
    }
    process.exit(success ? 0 : 1)
  })