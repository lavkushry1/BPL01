# Eventia API Testing Framework

## Overview

We've developed a robust API testing framework for the Eventia platform that ensures reliable operation, consistent interface, and proper documentation of all backend API endpoints. This framework is essential for maintaining API reliability, catching regressions, and ensuring frontend-backend synchronization.

## Components

### 1. Comprehensive API Endpoint Tests (`test-endpoints.js`)

- **Purpose**: Systematically test all API endpoints in logical flows that match user journeys
- **Features**:
  - Tests all major API endpoints (Auth, Events, Bookings, Payments, etc.)
  - Creates realistic test data with unique identifiers
  - Provides detailed, color-coded logging of request/response data
  - Follows logical business flows (auth → events → bookings → payments)
  - Handles authentication and token management automatically

- **Usage**:
  ```bash
  npm run test:api
  ```

### 2. Server Verification Utility (`verify-server.js`)

- **Purpose**: Ensure the backend server is running before running tests
- **Features**:
  - Checks server availability with retry logic
  - Provides clear feedback on server status
  - Can be used as a prerequisite for other tests

- **Usage**:
  ```bash
  npm run verify:server
  ```

### 3. API Synchronization Tool (`verify-api-sync.js`)

- **Purpose**: Detect mismatches between frontend API calls and backend routes
- **Features**:
  - Scans frontend code for API client calls
  - Maps backend route registrations
  - Identifies endpoints called by frontend but missing in backend
  - Validates proper use of `/api/v1` prefix across codebase

- **Usage**:
  ```bash
  npm run verify:api-sync
  ```

### 4. Comprehensive API Documentation (`API_DOCUMENTATION.md`)

- **Purpose**: Provide a single reference for all API endpoints
- **Features**:
  - Documents all endpoints with their purpose and URL patterns
  - Includes authentication requirements
  - Shows request/response formats with example payloads
  - Covers error handling and status codes
  - Includes details on rate limiting, pagination, and versioning

- **Location**: `/eventia-backend-express/API_DOCUMENTATION.md`

## Integration with Development Workflow

### 1. NPM Scripts

We've added several npm scripts to simplify usage:

```json
"scripts": {
  "test:api": "node src/scripts/test-endpoints.js",
  "verify:server": "node src/scripts/verify-server.js",
  "verify:api-sync": "node src/scripts/verify-api-sync.js",
  "test:api:full": "npm run verify:server && npm run test:api"
}
```

### 2. CI/CD Integration

These scripts can be integrated into CI/CD pipelines to:
- Verify API functionality before deployment
- Ensure frontend-backend synchronization
- Detect breaking changes in API interfaces
- Document API changes automatically

### 3. Development Usage

During development:
1. Run `npm run verify:api-sync` after changing any API endpoints
2. Run `npm run test:api:full` to verify all endpoints work as expected
3. Refer to `API_DOCUMENTATION.md` when implementing frontend API client calls

## Key Improvements

1. **Fixed API Prefix Consistency**: Ensured all endpoints consistently use the `/api/v1` prefix
2. **Standardized Response Format**: All API responses now follow a consistent structure
3. **Improved Error Handling**: Enhanced error responses with clear messages and status codes
4. **Token Management**: Corrected JWT token handling for authentication
5. **Route Organization**: Better organized route registration in `app.ts`

## Benefits

1. **Reliability**: Catch API issues before they reach production
2. **Documentation**: Always up-to-date reference for frontend developers
3. **Consistency**: Ensure uniform API design and response format
4. **Discovery**: Easier to find and understand available endpoints
5. **Onboarding**: Simplifies the process for new developers to understand API structure

## Future Enhancements

1. **Generate OpenAPI/Swagger Docs**: Automate API documentation generation
2. **Expanded Test Coverage**: Add more edge cases and error scenarios
3. **Performance Testing**: Add response time benchmarks
4. **Response Validation**: Schema validation for all API responses
5. **Mock Server**: Generate mock server from API definition

## Conclusion

This API testing framework provides a solid foundation for maintaining the Eventia platform's API reliability and consistency. By running these tests regularly and keeping the documentation updated, we can ensure smooth integration between frontend and backend components.

The implementation follows best practices for API design, testing, and documentation, making the Eventia platform more maintainable and easier to extend with new features. 