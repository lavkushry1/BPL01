import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric to track error rates
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{name:get_events}': ['p(95)<400'], // 95% of event listing requests should be below 400ms
    'http_req_duration{name:get_event_details}': ['p(95)<600'], // 95% of event detail requests should be below 600ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Base URL for the API
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

// Simulated event IDs for testing
const EVENT_IDS = [
  '1', '2', '3', '4', '5',
  '6', '7', '8', '9', '10'
];

// Main test function
export default function () {
  // Test event listing endpoint
  const eventsResponse = http.get(`${BASE_URL}/events`, {
    tags: { name: 'get_events' },
  });
  
  // Check if the request was successful
  const eventsSuccess = check(eventsResponse, {
    'events status is 200': (r) => r.status === 200,
    'events response has data': (r) => r.json().data && r.json().data.length > 0,
  });
  
  // Track errors
  errorRate.add(!eventsSuccess);
  
  // Test event filtering
  const filteredEventsResponse = http.get(`${BASE_URL}/events?category=concert&limit=5`, {
    tags: { name: 'get_filtered_events' },
  });
  
  // Check if the filtered request was successful
  const filteredSuccess = check(filteredEventsResponse, {
    'filtered events status is 200': (r) => r.status === 200,
  });
  
  // Track errors
  errorRate.add(!filteredSuccess);
  
  // Test event details endpoint with a random event ID
  const randomEventId = EVENT_IDS[Math.floor(Math.random() * EVENT_IDS.length)];
  const eventDetailsResponse = http.get(`${BASE_URL}/events/${randomEventId}`, {
    tags: { name: 'get_event_details' },
  });
  
  // Check if the event details request was successful
  const eventDetailsSuccess = check(eventDetailsResponse, {
    'event details status is 200': (r) => r.status === 200,
    'event details has correct ID': (r) => {
      try {
        const data = r.json().data;
        return data && data.id === randomEventId;
      } catch (e) {
        return false;
      }
    },
  });
  
  // Track errors
  errorRate.add(!eventDetailsSuccess);
  
  // Add a sleep to simulate user behavior
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}