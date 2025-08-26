import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metric to track error rates
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '20s', target: 10 }, // Ramp up to 10 users over 20 seconds
    { duration: '40s', target: 10 }, // Stay at 10 users for 40 seconds
    { duration: '20s', target: 30 }, // Ramp up to 30 users over 20 seconds
    { duration: '40s', target: 30 }, // Stay at 30 users for 40 seconds
    { duration: '20s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests should be below 800ms
    'http_req_duration{name:create_booking}': ['p(95)<600'], // 95% of booking creation requests should be below 600ms
    'http_req_duration{name:initiate_payment}': ['p(95)<500'], // 95% of payment initiation requests should be below 500ms
    'http_req_duration{name:verify_payment}': ['p(95)<700'], // 95% of payment verification requests should be below 700ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Base URL for the API
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

// Simulated event IDs for testing
const EVENT_IDS = ['1', '2', '3', '4', '5'];

// Simulated user data
function generateUser() {
  const userId = uuidv4();
  return {
    id: userId,
    name: `Test User ${userId.substring(0, 8)}`,
    email: `test.${userId.substring(0, 8)}@example.com`,
    phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  };
}

// Main test function
export default function () {
  const user = generateUser();
  const eventId = EVENT_IDS[Math.floor(Math.random() * EVENT_IDS.length)];
  let bookingId, paymentId;
  
  // Step 1: Get event details
  group('Get Event Details', function () {
    const eventResponse = http.get(`${BASE_URL}/events/${eventId}`, {
      tags: { name: 'get_event_details' },
    });
    
    const eventSuccess = check(eventResponse, {
      'event details status is 200': (r) => r.status === 200,
      'event has ticket categories': (r) => {
        try {
          const data = r.json().data;
          return data && data.ticketCategories && data.ticketCategories.length > 0;
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(!eventSuccess);
    
    // Simulate user thinking about ticket selection
    sleep(Math.random() * 2 + 1);
  });
  
  // Step 2: Create booking
  group('Create Booking', function () {
    // Prepare booking data
    const bookingData = {
      eventId: eventId,
      userId: user.id,
      tickets: [
        { categoryId: '1', quantity: 2 },
        { categoryId: '2', quantity: 1 }
      ],
      contactInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      specialRequirements: '',
      discountCode: Math.random() > 0.7 ? 'TESTCODE' : ''
    };
    
    const bookingResponse = http.post(
      `${BASE_URL}/bookings`,
      JSON.stringify(bookingData),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'create_booking' },
      }
    );
    
    const bookingSuccess = check(bookingResponse, {
      'booking creation status is 201': (r) => r.status === 201,
      'booking has ID': (r) => {
        try {
          const data = r.json().data;
          bookingId = data.id;
          return data && data.id;
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(!bookingSuccess);
    
    // Simulate user reviewing booking details
    sleep(Math.random() * 3 + 2);
  });
  
  // Step 3: Initiate payment
  if (bookingId) {
    group('Initiate Payment', function () {
      const paymentData = {
        bookingId: bookingId,
        paymentMethod: 'upi',
        amount: Math.floor(1000 + Math.random() * 5000),
        currency: 'INR'
      };
      
      const paymentResponse = http.post(
        `${BASE_URL}/payments/initiate`,
        JSON.stringify(paymentData),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'initiate_payment' },
        }
      );
      
      const paymentSuccess = check(paymentResponse, {
        'payment initiation status is 200': (r) => r.status === 200,
        'payment has ID and UPI details': (r) => {
          try {
            const data = r.json().data;
            paymentId = data.id;
            return data && data.id && data.upiDetails;
          } catch (e) {
            return false;
          }
        },
      });
      
      errorRate.add(!paymentSuccess);
      
      // Simulate user making payment
      sleep(Math.random() * 5 + 3);
    });
  }
  
  // Step 4: Verify payment
  if (paymentId) {
    group('Verify Payment', function () {
      const verificationData = {
        paymentId: paymentId,
        transactionId: `UTR${Math.floor(Math.random() * 1000000000000)}`,
        status: 'SUCCESS'
      };
      
      const verificationResponse = http.post(
        `${BASE_URL}/payments/verify`,
        JSON.stringify(verificationData),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'verify_payment' },
        }
      );
      
      const verificationSuccess = check(verificationResponse, {
        'payment verification status is 200': (r) => r.status === 200,
        'verification shows success': (r) => {
          try {
            const data = r.json().data;
            return data && data.status === 'SUCCESS';
          } catch (e) {
            return false;
          }
        },
      });
      
      errorRate.add(!verificationSuccess);
    });
  }
  
  // Final sleep to simulate user viewing confirmation
  sleep(Math.random() * 2 + 1);
}