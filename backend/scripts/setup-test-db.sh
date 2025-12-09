#!/bin/bash

# Script to set up the test database for integration tests

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Database configuration
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-eventia}
TEST_DB_NAME="${DB_NAME}_test"

# Create test database if it doesn't exist
echo "Creating test database ${TEST_DB_NAME} if it doesn't exist..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}'" | grep -q 1 || PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE ${TEST_DB_NAME}"

# Run migrations on test database
echo "Running migrations on test database..."
NODE_ENV=test npx knex migrate:latest --env test

# Run seeds if needed
if [ "$1" = "--seed" ]; then
  echo "Seeding test database..."
  NODE_ENV=test npx knex seed:run --env test
fi

echo "Test database setup complete!"