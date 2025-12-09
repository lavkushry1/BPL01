# Integration Tests

This directory contains integration tests for the Eventia API endpoints. These tests verify that the API endpoints work correctly with the database and other services.

## Setup

### Test Database

Integration tests require a separate test database to avoid affecting your development or production data. The tests use a database named `{DB_NAME}_test` where `{DB_NAME}` is the name of your main database.

To set up the test database, run:

```bash
# From the project root
chmod +x ./scripts/setup-test-db.sh
./scripts/setup-test-db.sh
```

This script will:
1. Create the test database if it doesn't exist
2. Run migrations to set up the schema

If you want to seed the database with test data, run:

```bash
./scripts/setup-test-db.sh --seed
```

### Environment Variables

Make sure your `.env` file includes the database configuration variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=eventia
```

## Running Tests

To run all integration tests:

```bash
npm test -- --testPathPattern=integration
```

To run a specific test file:

```bash
npm test -- src/__tests__/integration/userRoutes.test.ts
```

## Test Structure

Each test file focuses on a specific set of related API endpoints:

- `apiContract.test.ts` - Tests API responses against OpenAPI/Swagger schemas
- `bookingRoutes.test.ts` - Tests booking-related endpoints
- `eventRoutes.test.ts` - Tests event-related endpoints
- `paymentRoutes.test.ts` - Tests payment-related endpoints
- `userRoutes.test.ts` - Tests user authentication and profile endpoints

## Test Database Cleanup

Each test suite cleans up after itself by deleting test data in the `afterEach` or `afterAll` hooks. However, if you need to completely reset the test database, you can run:

```bash
NODE_ENV=test npx knex migrate:rollback --all --env test
NODE_ENV=test npx knex migrate:latest --env test
```

## Adding New Tests

When adding new integration tests:

1. Follow the existing patterns for setup and teardown
2. Use the `request` object from `../setup.ts` for making API requests
3. Ensure proper cleanup in `afterEach` or `afterAll` hooks
4. Use database transactions when possible to isolate test cases
5. Mock external services when necessary

## Common Issues

### Database Connection Errors

If you encounter database connection errors, check:
- The test database exists
- Your `.env` file has the correct database credentials
- PostgreSQL is running

### Authentication Issues

Many tests require authentication. Make sure:
- The JWT secret is properly set in your environment
- Test users are properly created in the `beforeEach` hooks
- Auth tokens are included in request headers