# Eventia Testing Framework

This document outlines the comprehensive testing framework implemented for the Eventia platform, covering both backend and frontend applications.

## Backend Testing (eventia-backend-express)

### Testing Tools
- **Jest**: Main test runner and assertion library
- **Supertest**: HTTP testing for APIs
- **Faker.js**: Test data generation
- **Prisma**: Database interactions and mocking
- **Ajv**: JSON Schema validation

### Test Structure
```
src/__tests__/
├── unit/                  # Unit tests
│   ├── middleware/        # Middleware tests
│   ├── services/          # Service tests
│   ├── controllers/       # Controller tests
│   └── utils/             # Utility tests
├── integration/           # Integration tests
│   ├── api/               # API endpoint tests
│   └── apiContract.test.ts # API contract validation
├── factories/             # Test data factories
└── setup.ts               # Test setup
```

### Unit Tests
- **Service Tests**: Tests for business logic, including error cases and edge conditions
  - Example: TransactionService tests for database operations, retries, and isolation levels
  - Coverage for EventService with pagination, filtering, and CRUD operations

- **Middleware Tests**: Tests for HTTP request pipeline components
  - Authentication and authorization (JWT validation, role-based access)
  - Error handling middleware (standardized error responses)
  - Validation middleware (request validation, sanitization, caching)

- **Utility Tests**: Tests for helper functions and shared utilities
  - Data formatting and validation utilities
  - Date and time handling
  - Error objects and response formatting

### Integration Tests
- **API Tests**: End-to-end tests for API endpoints
  - REST API endpoint testing with proper request/response validation
  - Authentication flow testing
  - CRUD operations for main resources

- **Contract Tests**: Ensure API responses match OpenAPI/Swagger specifications
  - JSON Schema validation against documented schemas
  - Response structure validation
  - Error handling validation

### Testing Utilities
- **Test Factories**: Reusable generators for test data
  - EventFactory for generating test event data
  - UserFactory for generating test user data
  - Support for creating complex nested data structures

- **Database Support**: Test database setup and teardown
  - Isolated test database instances
  - Automatic schema migration for tests
  - Data seeding for integration tests

## Frontend Testing (eventia-ticketing-flow1)

### Testing Tools
- **Vitest**: Unit and component testing
- **@testing-library/react**: Component rendering and interaction
- **Playwright**: End-to-end testing
- **MSW**: API mocking for component tests

### Test Structure
```
src/__tests__/
├── unit/                  # Unit tests
│   ├── components/        # Component tests
│   ├── hooks/             # Custom hooks tests
│   ├── utils/             # Utility tests
│   └── stores/            # State management tests
├── e2e/                   # End-to-end tests
└── mocks/                 # Mock data and API mocks
```

### Unit Tests
- **Component Tests**: Tests for React components
  - Rendering of UI elements
  - Interaction testing (clicks, form inputs)
  - State changes and lifecycle handling
  - Example: EventCard component tests

- **Hook Tests**: Tests for custom React hooks
  - State management
  - Side effects
  - Data fetching logic

- **Store Tests**: Tests for state management
  - Redux/RTK store logic
  - Selectors and reducers
  - Async thunks and API interaction

### End-to-End Tests
- **User Flow Tests**: Complete user journey testing
  - Event browsing and selection
  - Ticket booking process
  - Checkout and payment flow
  - Post-purchase ticket management

### Testing Utilities
- **API Mocking**: Mock API responses for component tests
  - MSW handler setup for all backend API endpoints
  - Customizable mock response data
  - Network condition simulation

- **Test Data**: Mock data structures for testing
  - Events, users, bookings, and other domain objects
  - Customizable to create test scenarios

## CI/CD Integration

### GitHub Actions Workflow
- Automated test runs on push and pull requests
- Separate jobs for backend and frontend testing
- Database setup for integration tests
- Code coverage reporting

### Test Environment
- Isolated test databases for integration tests
- Environment variable configuration for testing
- Mocked external dependencies

## Future Enhancements

- **Performance Testing**: Load and stress testing for API endpoints
- **Visual Regression Testing**: UI component visual testing
- **Accessibility Testing**: A11y compliance testing for frontend
- **Security Testing**: Authentication and authorization testing

## Running Tests

### Backend
```bash
cd eventia-backend-express
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage   # Generate coverage report
```

### Frontend
```bash
cd eventia-ticketing-flow1
npm run test:unit       # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate coverage report
``` 