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
  try {
    // Ensure we're using test environment
    process.env.NODE_ENV = 'test';

    // Initialize the app
    const { app: createdApp, server: createdServer } = await createApp();
    app = createdApp;
    server = createdServer;

    // Store app and server globally for tests to access
    (global as any).app = app;
    (global as any).server = server;

    request = supertest(app);

    // Skip DB migration if requested (for unit tests)
    if (process.env.SKIP_DB_SETUP === 'true') {
      console.log('Skipping DB migration for unit tests');
      return;
    }

    // Run migrations to setup test database
    await db.migrate.latest();
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

  if (process.env.SKIP_DB_SETUP === 'true') {
    return;
  }

  // Rollback migrations
  await db.migrate.rollback(undefined, true);

  // Close database connection
  await db.destroy();
});

export { app, request };
