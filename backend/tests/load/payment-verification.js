import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metric to track error rates
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp up to 20 users over 15 seconds
    { duration: '30s', target: 20 },  // Stay at 20 users for 30 seconds
    { duration: '15s', target: 50 },  // Ramp up to 50 users over 15 seconds
    { duration: '30s', target: 50 },  // Stay at 50 users for 30 seconds
    { duration: '15s', target: 100 }, // Ramp up to 100 users over 15 seconds
    { duration: '30s', target: 100 }, // Stay at 100 users for 30 seconds
    { duration: '15s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'], // 95% of requests should be below 600ms
    'http_req_duration{name:verify_payment}': ['p(95)<500'], // 95% of payment verification requests should be below 500ms
    'http_req_duration{name:get_payment_status}': ['p(95)<300'], // 95% of payment status requests should be below 300ms
    errors: ['rate<0.05'], // Error rate should be less than 5%
  },
};

// Base URL for the API
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

// Generate a random UTR number
function generateUTR() {
  return `UTR${Math.floor(Math.random() * 1000000000000)}`;
}

// Generate a random payment ID
function generatePaymentId() {
  return `pay_${uuidv4().replace(/-/g, '')}`;
}

// Main test function
export default function () {
  const paymentId = generatePaymentId();
  const utrNumber = generateUTR();
  
  // Step 1: Verify a payment
  group('Verify Payment', function () {
    const verificationData = {
      paymentId: paymentId,
      transactionId: utrNumber,
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
      'payment verification status is 200': (r) => r.status === 200 || r.status === 201,
      'verification response has data': (r) => {
        try {
          return r.json().data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(!verificationSuccess);
    
    // Simulate processing time
    sleep(Math.random() * 1 + 0.5);
  });
  
  // Step 2: Check payment status
  group('Check Payment Status', function () {
    const statusResponse = http.get(
      `${BASE_URL}/payments/${paymentId}/status`,
      {
        tags: { name: 'get_payment_status' },
      }
    );
    
    const statusSuccess = check(statusResponse, {
      'payment status check is 200': (r) => r.status === 200,
      'status response has payment data': (r) => {
        try {
          return r.json().data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    
    errorRate.add(!statusSuccess);
  });
  
  // Step 3: Simulate admin verification
  if (Math.random() > 0.7) { // Only 30% of users are admins checking payments
    group('Admin Payment Verification', function () {
      const adminResponse = http.get(
        `${BASE_URL}/admin/payments/pending`,
        {
          headers: {
            'Authorization': `Bearer admin-test-token-${uuidv4()}`,
            'Content-Type': 'application/json'
          },
          tags: { name: 'admin_pending_payments' },
        }
      );
      
      const adminSuccess = check(adminResponse, {
        'admin pending payments status is 200': (r) => r.status === 200,
        'admin response has payments list': (r) => {
          try {
            return r.json().data && Array.isArray(r.json().data);
          } catch (e) {
            return false;
          }
        },
      });
      
      errorRate.add(!adminSuccess);
      
      // Simulate admin reviewing payments
      sleep(Math.random() * 2 + 1);
    });
  }
  
  // Final sleep to simulate user behavior
  sleep(Math.random() * 1 + 0.5);
}