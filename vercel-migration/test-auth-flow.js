// Test NextAuth login flow
const testLogin = async () => {
  try {
    console.log('🧪 Testing NextAuth login flow...')
    
    // Test 1: Check auth endpoints
    console.log('\n1️⃣ Testing auth endpoints:')
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session')
    const sessionData = await sessionResponse.json()
    console.log('Session (before login):', sessionData)
    
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers')
    const providersData = await providersResponse.json()
    console.log('Available providers:', Object.keys(providersData))
    
    // Test 2: Try login with credentials
    console.log('\n2️⃣ Testing credentials login:')
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@demo.com',
        password: 'demo123',
        csrfToken: 'test', // In real app, this would be fetched first
      }),
    })
    
    console.log('Login response status:', loginResponse.status)
    console.log('Login response headers:', [...loginResponse.headers.entries()])
    
    const loginText = await loginResponse.text()
    console.log('Login response body:', loginText)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testLogin()