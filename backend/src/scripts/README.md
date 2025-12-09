# Eventia API Testing Suite

This directory contains scripts for comprehensive testing of the Eventia backend API endpoints.

## Overview

The `test-endpoints.js` script provides a systematic way to test all API endpoints in the Eventia platform. It performs end-to-end testing of the entire API surface, following typical user flows from authentication to event creation, booking, payment, and more.

## Features

- **Full API Coverage**: Tests all major endpoints across auth, events, bookings, payments, etc.
- **Sequential Testing**: Tests follow logical business flows (auth → events → bookings → payments)
- **Detailed Logging**: Color-coded logs show request/response details and test status
- **Test Data Generation**: Creates realistic test data with unique identifiers
- **Authentication Handling**: Properly manages JWT tokens for authenticated requests
- **Dependency Management**: Tests that depend on previous operations (like bookings requiring events) are properly sequenced

## Prerequisites

Before running the tests, ensure you have:

1. The Eventia backend server running (default: http://localhost:4000)
2. A PostgreSQL database configured and accessible
3. Node.js installed (v14+ recommended)
4. Required npm packages installed (`axios` and `colors`)

## Usage

To run the tests:

```bash
cd eventia-backend-express
node src/scripts/test-endpoints.js
```

## Test Organization

The tests are organized into logical suites:

1. **Authentication**: Registration, login, token refresh
2. **Events**: Listing, creating, updating events
3. **Bookings**: Creating bookings with tickets, updating status
4. **Payments**: Initializing payments, UTR verification
5. **Discounts**: Creating and verifying discount codes
6. **Seats**: Querying seats, locking/unlocking
7. **Tickets**: Retrieving tickets
8. **Admin**: Dashboard stats, user/event/booking management

## Interpreting Results

The output uses color-coding for easy interpretation:

- 🟢 **Green**: Successful tests
- 🟡 **Yellow**: Warnings (non-critical issues)
- 🔴 **Red**: Failed tests
- 🔵 **Blue**: Informational messages
- 🟣 **Cyan**: Section headers

A successful test will show:
- The HTTP method and endpoint
- HTTP status code (200, 201, etc.)
- Response data

A failed test will show:
- The HTTP method and endpoint
- Error status code
- Detailed error message

## Adding New Tests

To add tests for new endpoints:

1. Add appropriate test data to the test data section
2. Create a new test function following the pattern of existing ones
3. Add your new test function to the main `runTests` sequence

## Examples

### Successful test output:

```
ℹ️ Testing POST /auth/login
ℹ️ Request data:
{
  "email": "apitest_1234567890@example.com",
  "password": "TestPassword123"
}
✅ POST /auth/login - Status: 200
ℹ️ Response data:
{
  "status": "success",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "API Test User",
      "email": "apitest_1234567890@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Failed test output:

```
ℹ️ Testing POST /events
ℹ️ Request data:
{
  "title": "Test Event",
  "description": "This is a test event created via API",
  ...
}
❌ POST /events - Status: 401
Error data:
{
  "status": "error",
  "message": "Unauthorized: Access token is missing or invalid"
}
```

## Troubleshooting

If you encounter issues:

1. Ensure the backend server is running and accessible
2. Check database connection and credentials
3. Verify that all required environment variables are set
4. Look for specific error messages in the test output
5. For authentication issues, check token generation and validation

## Notes for Developers

- The test script is designed to be non-destructive, but it does create test data in your database
- Consider running tests against a development/testing database, not production
- Some tests might fail if the database already contains conflicting data (e.g., duplicate email addresses) 