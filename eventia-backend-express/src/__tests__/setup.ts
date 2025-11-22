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
let server: any; // Store server instance
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
    const { app: createdApp, server: createdServer } = await createApp();
    app = createdApp;
    server = createdServer;
    request = supertest(app);

    // Attach to global for access in tests
    (global as any).app = app;
    (global as any).server = server;

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
  // Close server
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // Rollback migrations
  await db.migrate.rollback(undefined, true);

  // Close database connection
  await db.destroy();
});

export { app, request };
