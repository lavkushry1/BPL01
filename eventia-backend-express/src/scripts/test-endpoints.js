const axios = require('axios');
const colors = require('colors');

// Configuration
const API_URL = 'http://localhost:4000';
const API_PREFIX = '/api/v1';
let accessToken = null;
let refreshToken = null;

// Test data
const testUser = {
  name: 'API Test User',
  email: `apitest_${Date.now()}@example.com`, // Use unique email each run
  password: 'TestPassword123',
  role: 'user'
};

const testEvent = {
  title: 'Test Event',
  description: 'This is a test event created via API',
  venue: 'Test Venue',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  time: '18:00',
  category: 'MUSIC',
  ticketCategories: [
    {
      name: 'General',
      price: 1000,
      quantity: 100
    },
    {
      name: 'VIP',
      price: 5000,
      quantity: 20
    }
  ]
};

const testBooking = {
  eventId: null, // Will be populated after event creation
  tickets: [
    {
      categoryId: null, // Will be populated after event creation
      quantity: 2
    }
  ],
  totalAmount: 2000
};

const testDiscount = {
  code: `TEST${Date.now()}`,
  discount_type: 'PERCENTAGE',
  value: 10,
  max_uses: 100,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  is_active: true
};

const testDeliveryDetails = {
  bookingId: null, // Will be populated after booking creation
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  pincode: '123456'
};

const testPayment = {
  bookingId: null, // Will be populated after booking creation
  amount: 2000,
  paymentMethod: 'UPI',
  upiId: 'test@upi'
};

// Helper functions
const logSuccess = (message) => console.log(colors.green(`✅ ${message}`));
const logError = (message) => console.log(colors.red(`❌ ${message}`));
const logInfo = (message) => console.log(colors.blue(`ℹ️ ${message}`));
const logWarning = (message) => console.log(colors.yellow(`⚠️ ${message}`));
const logHeader = (message) => console.log(colors.cyan.bold(`\n${message}`));
const logData = (data) => console.log(colors.gray(JSON.stringify(data, null, 2)));

const testEndpoint = async (method, path, data = null, headers = {}, expectedStatus = 200) => {
  const url = `${API_URL}${API_PREFIX}${path}`;
  let response;
  
  try {
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const config = { headers };
    
    logInfo(`Testing ${method.toUpperCase()} ${path}`);
    if (data) {
      logInfo('Request data:');
      logData(data);
    }
    
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(url, config);
        break;
      case 'post':
        response = await axios.post(url, data, config);
        break;
      case 'put':
        response = await axios.put(url, data, config);
        break;
      case 'patch':
        response = await axios.patch(url, data, config);
        break;
      case 'delete':
        response = await axios.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    if (response.status === expectedStatus) {
      logSuccess(`${method.toUpperCase()} ${path} - Status: ${response.status}`);
      logInfo('Response data:');
      logData(response.data);
      return response.data;
    } else {
      logWarning(`${method.toUpperCase()} ${path} - Expected status ${expectedStatus}, got ${response.status}`);
      logInfo('Response data:');
      logData(response.data);
      return response.data;
    }
  } catch (error) {
    if (error.response) {
      logError(`${method.toUpperCase()} ${path} - Status: ${error.response.status}`);
      console.log('Error data:');
      logData(error.response.data);
    } else {
      logError(`${method.toUpperCase()} ${path} - ${error.message}`);
    }
    return null;
  }
};

// Test suites
const testAuthEndpoints = async () => {
  logHeader('Testing Authentication Endpoints');
  
  // Register
  const registerResponse = await testEndpoint('post', '/auth/register', testUser, {}, 201);
  if (registerResponse && (registerResponse.status === 'success' || registerResponse.data)) {
    logSuccess('User registration successful');
  }
  
  // Login
  const loginResponse = await testEndpoint('post', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (loginResponse && (loginResponse.data || loginResponse.token)) {
    accessToken = loginResponse.data?.token || loginResponse.token;
    refreshToken = loginResponse.data?.refreshToken || loginResponse.refreshToken;
    logSuccess('Login successful, tokens received');
  } else {
    logError('Login failed, continuing with limited tests');
  }
  
  // Refresh token
  if (refreshToken) {
    const refreshResponse = await testEndpoint('post', '/auth/refresh-token', {
      refreshToken
    });
    
    if (refreshResponse && (refreshResponse.data?.token || refreshResponse.token)) {
      accessToken = refreshResponse.data?.token || refreshResponse.token;
      refreshToken = refreshResponse.data?.refreshToken || refreshResponse.refreshToken;
      logSuccess('Token refresh successful');
    }
  }
  
  // Get user profile
  await testEndpoint('get', '/users/profile');
  
  return true;
};

const testEventEndpoints = async () => {
  logHeader('Testing Event Endpoints');
  
  // Get all events
  const eventsResponse = await testEndpoint('get', '/events');
  
  // Create event (admin only)
  const createEventResponse = await testEndpoint('post', '/events', testEvent, {}, 201);
  
  if (createEventResponse && createEventResponse.data) {
    testBooking.eventId = createEventResponse.data.id;
    
    // Update event details if we created it successfully
    if (testBooking.eventId) {
      await testEndpoint('put', `/events/${testBooking.eventId}`, {
        title: `${testEvent.title} (Updated)`
      });
      
      // Get event by ID
      await testEndpoint('get', `/events/${testBooking.eventId}`);
      
      // Get event tickets
      const ticketsResponse = await testEndpoint('get', `/events/${testBooking.eventId}/tickets`);
      
      if (ticketsResponse && ticketsResponse.data && ticketsResponse.data.length > 0) {
        testBooking.tickets[0].categoryId = ticketsResponse.data[0].id;
      }
    }
  }
  
  // Test event filtering
  await testEndpoint('get', '/events?category=MUSIC');
  await testEndpoint('get', '/events?sort=date&order=asc');
  
  return testBooking.eventId != null;
};

const testBookingEndpoints = async () => {
  logHeader('Testing Booking Endpoints');
  
  if (!testBooking.eventId || !testBooking.tickets[0].categoryId) {
    logWarning('Skipping booking tests as event ID or ticket category ID is not available');
    return false;
  }
  
  // Create booking
  const createBookingResponse = await testEndpoint('post', '/bookings', testBooking, {}, 201);
  
  if (createBookingResponse && createBookingResponse.data) {
    testDeliveryDetails.bookingId = createBookingResponse.data.id;
    testPayment.bookingId = createBookingResponse.data.id;
    
    // Get booking by ID
    await testEndpoint('get', `/bookings/${testDeliveryDetails.bookingId}`);
    
    // Add delivery details
    await testEndpoint('post', '/bookings/delivery-details', testDeliveryDetails);
    
    // Update booking status
    await testEndpoint('put', `/bookings/${testDeliveryDetails.bookingId}/status`, {
      status: 'pending'
    });
  }
  
  // Get all bookings
  await testEndpoint('get', '/bookings');
  
  return testDeliveryDetails.bookingId != null;
};

const testPaymentEndpoints = async () => {
  logHeader('Testing Payment Endpoints');
  
  if (!testPayment.bookingId) {
    logWarning('Skipping payment tests as booking ID is not available');
    return false;
  }
  
  // Initialize payment
  const initializePaymentResponse = await testEndpoint('post', '/payment-initialize', {
    bookingId: testPayment.bookingId,
    paymentMethod: testPayment.paymentMethod
  });
  
  if (initializePaymentResponse && initializePaymentResponse.data) {
    const paymentId = initializePaymentResponse.data.id;
    
    // Submit UTR number for verification
    await testEndpoint('post', '/verify-utr', {
      paymentId,
      utrNumber: `UTR${Date.now()}`
    });
    
    // Admin verify payment
    await testEndpoint('post', `/payments/${paymentId}/verify`, {
      verified: true
    });
    
    // Get payment status
    await testEndpoint('get', `/payments/${paymentId}`);
  }
  
  // Get all payments
  await testEndpoint('get', '/payments');
  
  return true;
};

const testDiscountEndpoints = async () => {
  logHeader('Testing Discount Endpoints');
  
  // Create discount
  const createDiscountResponse = await testEndpoint('post', '/discounts', testDiscount, {}, 201);
  
  if (createDiscountResponse && createDiscountResponse.data) {
    const discountId = createDiscountResponse.data.id;
    
    // Get discount by ID
    await testEndpoint('get', `/discounts/${discountId}`);
    
    // Update discount
    await testEndpoint('put', `/discounts/${discountId}`, {
      is_active: false
    });
    
    // Verify discount code
    await testEndpoint('post', '/discounts/verify', {
      code: testDiscount.code
    });
  }
  
  // Get all discounts
  await testEndpoint('get', '/discounts');
  
  return true;
};

const testSeatEndpoints = async () => {
  logHeader('Testing Seat Endpoints');
  
  // Get all seats for an event
  if (testBooking.eventId) {
    await testEndpoint('get', `/seats?event_id=${testBooking.eventId}`);
    
    // Lock and unlock seats
    await testEndpoint('post', '/seat-locks', {
      eventId: testBooking.eventId,
      seatIds: ['A1', 'A2'],
      sessionId: `session_${Date.now()}`
    });
    
    await testEndpoint('delete', '/seat-locks', {
      data: {
        sessionId: `session_${Date.now()}`
      }
    });
  }
  
  return true;
};

const testTicketEndpoints = async () => {
  logHeader('Testing Ticket Endpoints');
  
  // Get all tickets
  await testEndpoint('get', '/tickets');
  
  // If we have a booking with confirmed payment, we should have tickets
  if (testDeliveryDetails.bookingId) {
    await testEndpoint('get', `/tickets?booking_id=${testDeliveryDetails.bookingId}`);
  }
  
  return true;
};

const testAdminEndpoints = async () => {
  logHeader('Testing Admin Endpoints');
  
  // Dashboard stats
  await testEndpoint('get', '/admin/dashboard');
  
  // User management
  await testEndpoint('get', '/admin/users');
  
  // Event management 
  await testEndpoint('get', '/admin/events');
  
  // Booking management
  await testEndpoint('get', '/admin/bookings');
  
  // Payment verification
  await testEndpoint('get', '/admin/payments/pending');
  
  return true;
};

// Main test sequence
const runTests = async () => {
  try {
    logHeader('STARTING API ENDPOINT TESTS');
    
    // Health check
    await testEndpoint('get', '/health');
    
    // Run test suites
    await testAuthEndpoints();
    const eventCreated = await testEventEndpoints();
    if (eventCreated) {
      await testBookingEndpoints();
    }
    await testPaymentEndpoints();
    await testDiscountEndpoints();
    await testSeatEndpoints();
    await testTicketEndpoints();
    await testAdminEndpoints();
    
    logHeader('API ENDPOINT TESTS COMPLETED');
  } catch (error) {
    logError(`Test sequence error: ${error.message}`);
  }
};

// Run tests
runTests(); 