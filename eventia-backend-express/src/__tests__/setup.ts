import { Application } from 'express';
import supertest from 'supertest';
import { createApp } from '../app';
import db from '../db';

// Mock Redis-related modules to prevent actual connections during tests
jest.mock('../services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    isConnected: jest.fn(() => true),
    close: jest.fn(),
  },
}));

jest.mock('../middleware/rateLimit', () => ({
  standardLimiter: jest.fn((_req, _res, next) => next()),
  apiKeyLimiter: jest.fn((_req, _res, next) => next()),
  strictLimiter: jest.fn((_req, _res, next) => next()),
  authLimiter: jest.fn((_req, _res, next) => next()),
  loginLimiter: jest.fn((_req, _res, next) => next()), // Add this line
}));

// Mock JobService to prevent cron jobs from starting
jest.mock('../services/job.service', () => ({
  JobService: {
    initialize: jest.fn(),
    startAllJobs: jest.fn(),
  },
}));

let app: Application;
// Change the type to any to avoid complex typings issue with supertest
let request: any;

// Setup before tests
beforeAll(async () => {
  console.log('setup.ts: Starting beforeAll');
  try {
    // Ensure we're using test environment
    process.env.NODE_ENV = 'test';

    // Initialize the app
    console.log('setup.ts: Creating app');
    const { app: createdApp } = await createApp();
    app = createdApp;
    request = supertest(app);

    // Run migrations to setup test database
    console.log('setup.ts: Running migrations');
    await db.migrate.latest();
    console.log('setup.ts: Migrations complete');
  } catch (error) {
    console.error('setup.ts: Error in beforeAll:', error);
    throw error;
  }
});

// Clean up after tests
afterAll(async () => {
  // Rollback migrations
  await db.migrate.rollback(undefined, true);

  // Close database connection
  await db.destroy();
});

export { app, request };
