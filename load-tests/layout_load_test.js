import http from 'k6/http';
import { check, sleep } from 'k6';

// Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 500 }, // Ramp up to 500 users
    { duration: '1m', target: 1000 }, // Ramp up to 1000 users
    { duration: '30s', target: 1000 }, // Stay at 1000 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
};

// Base URL (Change this to your deployed or local instance)
const BASE_URL = 'http://localhost:4000/api/v1';
// Replace with a valid Match ID existing in your DB
const MATCH_ID = 'test-match-id'; 

export default function () {
  // Hit the Get Seat Layout Endpoint
  const res = http.get(`${BASE_URL}/ipl/matches/${MATCH_ID}/layout`);

  // Assertions
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Short sleep to simulate user think time (random between 1s and 3s)
  sleep(1 + Math.random() * 2);
}
