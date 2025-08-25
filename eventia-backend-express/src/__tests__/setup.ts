import { config } from '../config';
import { Application } from 'express';
import supertest from 'supertest';
import { createApp } from '../app';
import db from '../db';

let app: Application;
// Change the type to any to avoid complex typings issue with supertest
let request: any;

// Setup before tests
beforeAll(async () => {
  // Ensure we're using test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize the app
  const { app: createdApp } = await createApp();
  app = createdApp;
  request = supertest(app);
  
  // Run migrations to setup test database
  await db.migrate.latest();
});

// Clean up after tests
afterAll(async () => {
  // Rollback migrations
  await db.migrate.rollback(undefined, true);
  
  // Close database connection
  await db.destroy();
});

export { app, request };