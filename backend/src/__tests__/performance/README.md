# Performance Testing

This directory contains performance and load testing scripts for the Eventia API using [k6](https://k6.io/), a modern load testing tool.

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/

## Running the Tests

To run the performance tests, make sure your API server is running locally on port 3000 (or update the `baseUrl` in the script), then execute:

```bash
k6 run src/__tests__/performance/k6-load-test.js
```

## Test Configuration

The load test is configured with the following stages:

1. Ramp up to 10 virtual users (VUs) over 30 seconds
2. Stay at 10 VUs for 1 minute
3. Ramp up to 50 VUs over 30 seconds
4. Stay at 50 VUs for 1 minute
5. Ramp down to 0 VUs over 30 seconds

You can modify these settings in the `options` object in the script.

## Performance Thresholds

The tests include the following performance thresholds:

- 95% of all requests should complete in less than 500ms
- 95% of GET /events requests should complete in less than 300ms
- 95% of GET /events/:id requests should complete in less than 400ms
- 95% of login requests should complete in less than 500ms
- Overall success rate should be above 95%

## Test Scenarios

The load test simulates real user behavior by randomly selecting from the following scenarios:

1. **Browse Events (30% chance)**: Users browse the list of events and view details of specific events
2. **User Authentication (30% chance)**: Users register, login, and view their profile
3. **Booking Tickets (30% chance)**: Users login, select an event, and book tickets
4. **Search and Filter (10% chance)**: Users search for events with various filter criteria

## Interpreting Results

After running the test, k6 will output detailed metrics including:

- **http_req_duration**: Time taken for HTTP requests
- **http_req_failed**: Rate of failed HTTP requests
- **iterations**: Number of complete iterations of the default function
- **vus**: Number of virtual users active
- Custom metrics for specific endpoints and scenarios

## Customizing Tests

To customize the tests:

1. Modify the `options` object to change the load profile
2. Adjust the thresholds to match your performance requirements
3. Update the scenario probabilities in the default function
4. Add or modify scenarios to test different user flows

## Continuous Integration

These tests can be integrated into your CI/CD pipeline. For example, with GitHub Actions:

```yaml
name: Performance Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  k6_load_test:
    name: k6 Load Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      
      - name: Start API Server
        run: |
          npm install
          npm run build
          npm run start:test &
          sleep 10
      
      - name: Run k6 Load Test
        uses: grafana/k6-action@v0.2.0
        with:
          filename: src/__tests__/performance/k6-load-test.js
```

## Troubleshooting

- If you see connection errors, make sure your API server is running and accessible
- If tests are failing due to rate limiting, adjust the sleep duration between requests
- For memory issues, reduce the number of VUs or adjust the SharedArray size