/**
 * Script to test authentication endpoints
 * 
 * Run with: node scripts/test-auth.js
 */

// In CommonJS, we need to use this approach for node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Configuration
const API_URL = 'http://localhost:4000/api/v1';
const AUTH_ROUTES = {
  register: `${API_URL}/auth/register`,
  login: `${API_URL}/auth/login`,
  refreshToken: `${API_URL}/auth/refresh-token`,
};

// Test user
const TEST_USER = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Password123!',
  role: 'user'
};

// Helper function for fetch requests
async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test authentication flow
async function testAuthFlow() {
  console.log('🔑 Testing Authentication Flow');
  console.log('-----------------------------');
  
  try {
    // 1. Register a new user
    console.log(`\n1. Registering user ${TEST_USER.email}`);
    const registerResult = await fetchJson(AUTH_ROUTES.register, {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    console.log(`Status: ${registerResult.status}`);
    console.log('Response:', JSON.stringify(registerResult.data, null, 2));
    
    if (registerResult.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // 2. Login with the registered user
    console.log(`\n2. Logging in as ${TEST_USER.email}`);
    const loginResult = await fetchJson(AUTH_ROUTES.login, {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    console.log(`Status: ${loginResult.status}`);
    console.log('Response:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.status !== 200) {
      throw new Error('Login failed');
    }
    
    const { token, refreshToken } = loginResult.data.data;
    
    // 3. Test refresh token
    console.log('\n3. Testing refresh token');
    const refreshResult = await fetchJson(AUTH_ROUTES.refreshToken, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    
    console.log(`Status: ${refreshResult.status}`);
    console.log('Response:', JSON.stringify(refreshResult.data, null, 2));
    
    if (refreshResult.status !== 200) {
      throw new Error('Token refresh failed');
    }
    
    console.log('\n✅ Authentication flow test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
console.log('Starting authentication tests...');
testAuthFlow().catch(console.error); 