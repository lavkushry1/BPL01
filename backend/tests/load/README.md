# Load Testing for Eventia Backend

This directory contains load test scripts for the Eventia backend API using [k6](https://k6.io/), a modern load testing tool.

## Test Scripts

- `events-load.js`: Tests the performance of event listing and details endpoints
- `booking-flow.js`: Tests the complete booking flow from event selection to payment
- `payment-verification.js`: Tests payment verification and status checking endpoints

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/

## Running the Tests

### Basic Usage

Run a test script with the default configuration:

```bash
k6 run events-load.js
```

### Custom API URL

Specify a custom API URL (default is http://localhost:3000/api/v1):

```bash
k6 run -e API_URL=https://api.eventia.example.com/api/v1 events-load.js
```

### Output Options

Output results to JSON file:

```bash
k6 run --out json=results.json events-load.js
```

Output results to InfluxDB (if you have it set up):

```bash
k6 run --out influxdb=http://localhost:8086/k6 events-load.js
```

## Interpreting Results

k6 provides detailed metrics after each test run, including:

- **http_req_duration**: Time taken for requests to complete
- **http_req_failed**: Rate of failed requests
- **iterations**: Number of complete iterations of the test script
- **vus**: Number of virtual users active during the test

Each test script defines thresholds that represent acceptable performance levels. If any threshold is exceeded, the test will be marked as failed.

### Key Thresholds

- Response time (p95): 95% of requests should complete within the specified time
- Error rate: Should be below the specified percentage

## Customizing Tests

You can modify the test scripts to adjust:

- **Stages**: Change the number of virtual users and duration
- **Thresholds**: Adjust performance expectations
- **Scenarios**: Modify the user flows being tested

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline. Example for GitHub Actions:

```yaml
name: Load Tests
on: [push]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install k6
        run: |
          curl -L https://github.com/loadimpact/k6/releases/download/v0.33.0/k6-v0.33.0-linux-amd64.tar.gz | tar xzf -
          sudo cp k6-v0.33.0-linux-amd64/k6 /usr/local/bin
      - name: Run load tests
        run: k6 run tests/load/events-load.js
```

## Best Practices

1. Run tests in a staging environment that mirrors production
2. Start with low load and gradually increase
3. Monitor server resources during tests
4. Run tests regularly to catch performance regressions
5. Adjust thresholds based on real-world performance requirements