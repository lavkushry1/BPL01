import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const errors = new Counter('errors');
const successRate = new Rate('success_rate');
const eventsTrend = new Trend('get_events_duration');
const eventDetailsTrend = new Trend('get_event_details_duration');
const loginTrend = new Trend('login_duration');
const registerTrend = new Trend('register_duration');

// Test configuration
export const options = {
  // Base test configuration
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{name:get_events}': ['p(95)<300'], // 95% of GET /events requests should be below 300ms
    'http_req_duration{name:get_event_details}': ['p(95)<400'], // 95% of GET /events/:id requests should be below 400ms
    'http_req_duration{name:login}': ['p(95)<500'], // 95% of login requests should be below 500ms
    'success_rate': ['rate>0.95'], // 95% of requests should be successful
  },
};

// Shared data for test users
const users = new SharedArray('users', function() {
  return Array(100).fill(null).map((_, i) => ({
    email: `loadtest${i}@example.com`,
    password: 'Password123!',
    name: `Load Test User ${i}`,
    phone: `98765${i.toString().padStart(5, '0')}`
  }));
});

// Shared data for event IDs (to be populated during test)
let eventIds = [];

// Base URL for API
const baseUrl = 'http://localhost:3000/api/v1';

// Helper function to generate random string
function randomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Setup function - runs once per VU
export function setup() {
  // Create a test admin user for creating events
  const adminUser = {
    email: 'admin_loadtest@example.com',
    password: 'AdminPassword123!',
    name: 'Admin Load Test',
    phone: '9999999999'
  };
  
  // Register admin user
  let res = http.post(`${baseUrl}/auth/register`, JSON.stringify(adminUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Login as admin
  res = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: adminUser.email,
    password: adminUser.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const adminToken = res.json('token');
  
  // Create test events
  const events = [];
  for (let i = 0; i < 5; i++) {
    const event = {
      name: `Load Test Event ${i}`,
      description: `This is a test event created for load testing ${i}`,
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      location: `Test Location ${i}`,
      isPublished: true,
      ticketCategories: [
        {
          name: 'Regular',
          price: 100,
          totalSeats: 1000
        },
        {
          name: 'VIP',
          price: 500,
          totalSeats: 100
        }
      ]
    };
    
    res = http.post(`${baseUrl}/events`, JSON.stringify(event), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
    });
    
    if (res.status === 201) {
      events.push(res.json('id'));
    }
  }
  
  return { eventIds: events, adminToken };
}

// Default function - main test logic
export default function(data) {
  // Get event IDs from setup
  eventIds = data.eventIds;
  
  // Select a random user
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Scenario selection based on random value
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% chance: Browse events and view details
    browseEventsScenario();
  } else if (scenario < 0.6) {
    // 30% chance: Register, login, and browse profile
    userAuthenticationScenario(user);
  } else if (scenario < 0.9) {
    // 30% chance: Book tickets for an event
    bookingScenario(user);
  } else {
    // 10% chance: Search and filter events
    searchEventsScenario();
  }
  
  // Sleep between 1 and 5 seconds between iterations
  sleep(Math.random() * 4 + 1);
}

// Scenario 1: Browse events and view details
function browseEventsScenario() {
  // Get all events
  let startTime = new Date().getTime();
  let res = http.get(`${baseUrl}/events`, {
    tags: { name: 'get_events' }
  });
  let endTime = new Date().getTime();
  
  // Record metrics
  eventsTrend.add(endTime - startTime);
  successRate.add(res.status === 200);
  
  // Check response
  const success = check(res, {
    'events list status is 200': (r) => r.status === 200,
    'events list has items': (r) => Array.isArray(r.json()) && r.json().length > 0,
  });
  
  if (!success) {
    errors.add(1);
    console.log(`Error getting events: ${res.status} ${res.body}`);
    return;
  }
  
  // View a random event's details if we have event IDs
  if (eventIds.length > 0) {
    const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
    
    startTime = new Date().getTime();
    res = http.get(`${baseUrl}/events/${eventId}`, {
      tags: { name: 'get_event_details' }
    });
    endTime = new Date().getTime();
    
    // Record metrics
    eventDetailsTrend.add(endTime - startTime);
    successRate.add(res.status === 200);
    
    // Check response
    check(res, {
      'event details status is 200': (r) => r.status === 200,
      'event details has id': (r) => r.json('id') !== undefined,
      'event details has name': (r) => r.json('name') !== undefined,
    });
  }
}

// Scenario 2: User authentication
function userAuthenticationScenario(user) {
  // Register new user with random suffix to avoid conflicts
  const randomSuffix = randomString(8);
  const testUser = {
    email: `${randomSuffix}_${user.email}`,
    password: user.password,
    name: user.name,
    phone: user.phone
  };
  
  let startTime = new Date().getTime();
  let res = http.post(`${baseUrl}/auth/register`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'register' }
  });
  let endTime = new Date().getTime();
  
  // Record metrics
  registerTrend.add(endTime - startTime);
  successRate.add(res.status === 201 || res.status === 400); // 400 might be due to existing user
  
  // Login
  startTime = new Date().getTime();
  res = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: testUser.email,
    password: testUser.password
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' }
  });
  endTime = new Date().getTime();
  
  // Record metrics
  loginTrend.add(endTime - startTime);
  successRate.add(res.status === 200);
  
  // Check login response
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
  });
  
  if (!success) {
    errors.add(1);
    console.log(`Error logging in: ${res.status} ${res.body}`);
    return;
  }
  
  const token = res.json('token');
  
  // Get user profile
  res = http.get(`${baseUrl}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    tags: { name: 'get_profile' }
  });
  
  // Check profile response
  check(res, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => r.json('email') === testUser.email,
  });
}

// Scenario 3: Booking tickets
function bookingScenario(user) {
  // First register and login
  const randomSuffix = randomString(8);
  const testUser = {
    email: `${randomSuffix}_${user.email}`,
    password: user.password,
    name: user.name,
    phone: user.phone
  };
  
  let res = http.post(`${baseUrl}/auth/register`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  res = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: testUser.email,
    password: testUser.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
  });
  
  if (!success) {
    errors.add(1);
    return;
  }
  
  const token = res.json('token');
  
  // Get a random event to book
  if (eventIds.length === 0) {
    console.log('No events available for booking');
    return;
  }
  
  const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
  
  // Get event details to find ticket categories
  res = http.get(`${baseUrl}/events/${eventId}`);
  
  if (res.status !== 200) {
    console.log(`Error getting event details: ${res.status}`);
    errors.add(1);
    return;
  }
  
  const event = res.json();
  if (!event.ticketCategories || event.ticketCategories.length === 0) {
    console.log('No ticket categories available for booking');
    return;
  }
  
  // Select a random ticket category
  const ticketCategory = event.ticketCategories[Math.floor(Math.random() * event.ticketCategories.length)];
  
  // Create a booking
  const booking = {
    eventId: eventId,
    tickets: [
      {
        ticketCategoryId: ticketCategory.id,
        quantity: Math.floor(Math.random() * 3) + 1 // 1-3 tickets
      }
    ]
  };
  
  res = http.post(`${baseUrl}/bookings`, JSON.stringify(booking), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    tags: { name: 'create_booking' }
  });
  
  // Check booking response
  check(res, {
    'booking creation status is 201': (r) => r.status === 201,
    'booking has id': (r) => r.json('id') !== undefined,
  });
  
  successRate.add(res.status === 201);
  
  if (res.status !== 201) {
    errors.add(1);
    console.log(`Error creating booking: ${res.status} ${res.body}`);
  }
}

// Scenario 4: Search and filter events
function searchEventsScenario() {
  // Search with random query parameters
  const searchParams = {};
  
  // Add random search parameters
  if (Math.random() > 0.5) {
    searchParams.query = ['concert', 'festival', 'workshop', 'seminar', 'conference'][Math.floor(Math.random() * 5)];
  }
  
  if (Math.random() > 0.5) {
    searchParams.startDate = new Date(Date.now()).toISOString().split('T')[0];
  }
  
  if (Math.random() > 0.5) {
    searchParams.endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]; // 30 days from now
  }
  
  if (Math.random() > 0.5) {
    searchParams.location = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'][Math.floor(Math.random() * 5)];
  }
  
  // Make the search request
  const res = http.get(`${baseUrl}/events`, {
    params: searchParams,
    tags: { name: 'search_events' }
  });
  
  // Check search response
  check(res, {
    'search status is 200': (r) => r.status === 200,
    'search returns array': (r) => Array.isArray(r.json()),
  });
  
  successRate.add(res.status === 200);
}

// Teardown function - runs once at the end of the test
export function teardown(data) {
  // Clean up test data if needed
  // This could delete test events, users, etc.
  
  // For now, we'll just log completion
  console.log('Load test completed');
}