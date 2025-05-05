import { config } from '../config';
import { Application } from 'express';
import supertest from 'supertest';
import { createApp } from '../app';
import prisma from '../db/prisma';

let app: Application;
// Change the type to any to avoid complex typings issue with supertest
let request: any;

// Setup before tests
beforeAll(async () => {
  // Ensure we're using test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize the app
  app = await createApp();
  request = supertest(app);
  
  // Connect to the test database
  // We're not using migrations here as we'll use Prisma's direct db operations
});

// Clean up after tests
afterAll(async () => {
  // Close database connection
  await prisma.$disconnect();
});

export { app, request }; 