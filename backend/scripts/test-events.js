/**
 * Script to test event CRUD operations
 * 
 * Run with: node scripts/test-events.js
 */

// In CommonJS, we need to use this approach for node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Configuration
const API_URL = 'http://localhost:4100/api/v1';
const ADMIN_API_URL = 'http://localhost:4100/api/admin';
const AUTH_URL = 'http://localhost:4100/api/auth';

// Test event data
const TEST_EVENT = {
  title: "Test Event " + Date.now(),
  description: "This is a test event created by the automated test script",
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days in the future
  endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),   // 8 days in the future
  location: "Test Venue, Mumbai",
  status: "PUBLISHED",
  capacity: 500,
  imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b",
  ticketCategories: [
    {
      name: "General Admission",
      description: "Standard entry ticket",
      price: 100,
      totalSeats: 100
    },
    {
      name: "VIP",
      description: "VIP access with special perks",
      price: 200,
      totalSeats: 50
    }
  ]
};

// Admin credentials for auth
const ADMIN_CREDENTIALS = {
  email: "admin@eventia.com",
  password: "password123"
};

// Helper function for fetch requests
async function fetchJson(url, options = {}) {
  console.log(`Making ${options.method || 'GET'} request to ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  
  return { status: response.status, data };
}

// Test event CRUD operations
async function testEventCrud() {
  console.log('🎟️ Testing Event CRUD Operations');
  console.log('---------------------------------');
  
  let eventId = null;
  let authToken = null;
  
  try {
    // 1. Login as admin
    console.log('\n1. Logging in as admin');
    const loginResult = await fetchJson(`${AUTH_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    console.log(`Status: ${loginResult.status}`);
    
    if (loginResult.status !== 200) {
      console.log('Response:', JSON.stringify(loginResult.data, null, 2));
      throw new Error('Admin login failed');
    }
    
    authToken = loginResult.data.data.token;
    console.log('✅ Admin login successful, received auth token');
    
    // 2. Create a new event
    console.log('\n2. Creating a new event');
    const createResult = await fetchJson(`${ADMIN_API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(TEST_EVENT)
    });
    
    console.log(`Status: ${createResult.status}`);
    
    if (createResult.status !== 201) {
      console.log('Response:', JSON.stringify(createResult.data, null, 2));
      throw new Error('Event creation failed');
    }
    
    eventId = createResult.data.data.id;
    console.log(`✅ Event created successfully with ID: ${eventId}`);
    console.log('Event details:', JSON.stringify(createResult.data.data, null, 2));
    
    // 3. Get all events
    console.log('\n3. Getting all events');
    const listResult = await fetchJson(`${API_URL}/events`);
    
    console.log(`Status: ${listResult.status}`);
    
    if (listResult.status !== 200) {
      console.log('Response:', JSON.stringify(listResult.data, null, 2));
      throw new Error('Failed to fetch events');
    }
    
    console.log(`✅ Retrieved events successfully`);
    
    // 4. Get event by ID
    console.log(`\n4. Getting event by ID: ${eventId}`);
    const getResult = await fetchJson(`${API_URL}/events/${eventId}`);
    
    console.log(`Status: ${getResult.status}`);
    
    if (getResult.status !== 200) {
      console.log('Response:', JSON.stringify(getResult.data, null, 2));
      throw new Error('Failed to fetch event by ID');
    }
    
    console.log('✅ Retrieved event details successfully');
    
    // 5. Update the event
    console.log('\n5. Updating the event');
    const updateData = {
      title: `${TEST_EVENT.title} (Updated)`,
      description: `${TEST_EVENT.description} - This event has been updated`,
      ticketCategories: [
        ...TEST_EVENT.ticketCategories,
        {
          name: "Premium",
          description: "Premium access with all perks",
          price: 300,
          totalSeats: 25
        }
      ]
    };
    
    const updateResult = await fetchJson(`${ADMIN_API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    console.log(`Status: ${updateResult.status}`);
    
    if (updateResult.status !== 200) {
      console.log('Response:', JSON.stringify(updateResult.data, null, 2));
      throw new Error('Event update failed');
    }
    
    console.log('✅ Event updated successfully');
    
    // 6. Delete the event
    console.log(`\n6. Deleting the event: ${eventId}`);
    const deleteResult = await fetchJson(`${ADMIN_API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`Status: ${deleteResult.status}`);
    
    if (deleteResult.status !== 200) {
      console.log('Response:', JSON.stringify(deleteResult.data, null, 2));
      throw new Error('Event deletion failed');
    }
    
    console.log('✅ Event deleted successfully');
    
    // 7. Verify the event is deleted by trying to fetch it
    console.log(`\n7. Verifying event deletion by fetching: ${eventId}`);
    const verifyResult = await fetchJson(`${API_URL}/events/${eventId}`);
    
    console.log(`Status: ${verifyResult.status}`);
    
    if (verifyResult.status !== 404) {
      console.log('Response:', JSON.stringify(verifyResult.data, null, 2));
      throw new Error('Event was not properly deleted');
    }
    
    console.log('✅ Event deletion verified (404 Not Found)');
    
    console.log('\n✅ Event CRUD operations test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    // Clean up: if an event was created but test failed, try to delete it
    if (eventId && authToken) {
      console.log(`\nAttempting to clean up by deleting event: ${eventId}`);
      try {
        await fetchJson(`${ADMIN_API_URL}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Cleanup successful - event deleted');
      } catch (cleanupError) {
        console.error('Failed to clean up event:', cleanupError.message);
      }
    }
  }
}

// Run the test
console.log('Starting event CRUD tests...');
testEventCrud().catch(console.error); 