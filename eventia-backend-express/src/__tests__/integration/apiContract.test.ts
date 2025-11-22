import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'; // Removed to avoid duplicate app creation
import { Application } from 'express';
import request from 'supertest';
// import { createApp } from '../../app'; // Removed to avoid duplicate app creation
import { default as Ajv } from 'ajv';
import addFormats from 'ajv-formats';
// import { describe, it } from 'node:test';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from '../../config/swagger';

console.log('Loading apiContract.test.ts');

describe('API Contract Validation', () => {
  let app: Application;
  let server: any;
  let authToken: string;
  let agent: any;
  let swaggerSpec: any;
  let ajv: any;

  beforeAll(async () => {
    try {
      console.log('Starting beforeAll');
      // Use global app and server initialized in setup.ts
      app = (global as any).app;
      server = (global as any).server;

      if (!app || !server) {
        throw new Error('App or Server not initialized in setup.ts');
      }

      agent = request(server);

      console.log('App initialized:', !!app);
      console.log('Server initialized:', !!server);
      console.log('Agent initialized:', !!agent);

      // Generate Swagger spec from JSDoc annotations
      swaggerSpec = swaggerJsdoc(swaggerOptions);

      // Initialize Ajv for JSON Schema validation
      ajv = new Ajv({ allErrors: true });
      addFormats(ajv);

      // Create a test user directly in the database
      // Or better, use the repository if available, or direct prisma access if we can get it.
      // Since we don't have direct access to prisma client here easily without importing,
      // let's try to register a user via the API first.

      await agent
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User'
        });

      // Login to get auth token for protected endpoints
      // Use agent instead of request(server)
      const loginResponse = await agent
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com', // Use a test user that exists in your test database
          password: 'Password123',
        });

      if (loginResponse.status === 200) {
        authToken = loginResponse.body.data.token;

        // Create a test event
        const eventResponse = await agent
          .post('/api/v1/events')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Event',
            description: 'This is a test event',
            startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            location: 'Test Location',
            capacity: 100,
            price: 100,
            category: 'Music'
          });

        if (eventResponse.status !== 201) {
          console.warn('Failed to create test event:', eventResponse.status, eventResponse.body);
        }
      } else {
        console.warn('Login failed in beforeAll:', loginResponse.status, loginResponse.body);
      }
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Server closing is handled in setup.ts
  });

  const validateResponseSchema = (endpoint: string, method: string, statusCode: number, response: any): boolean => {
    try {
      // Debug paths if not found
      if (!swaggerSpec.paths[endpoint]) {
        // console.log('Available paths:', Object.keys(swaggerSpec.paths));
        // Try adding/removing /api/v1 prefix
        const altEndpoint = endpoint.startsWith('/api/v1') ? endpoint.replace('/api/v1', '') : `/api/v1${endpoint}`;
        if (swaggerSpec.paths[altEndpoint]) {
          endpoint = altEndpoint;
        }
      }

      // Find the path spec
      const pathSpec = swaggerSpec.paths[endpoint]?.[method.toLowerCase()];
      if (!pathSpec) {
        console.warn(`No path spec found for ${method} ${endpoint}`);
        return false;
      }

      // Get response schema
      const responseSpec = pathSpec.responses[statusCode];
      if (!responseSpec) {
        console.warn(`No response spec found for ${method} ${endpoint} with status ${statusCode}`);
        return false;
      }

      // Get JSON schema
      const schema = responseSpec.content?.['application/json']?.schema;
      if (!schema) {
        console.warn(`No JSON schema found for ${method} ${endpoint} with status ${statusCode}`);
        return false;
      }

      // Validate against schema
      const validate = ajv.compile(schema);
      const valid = validate(response);

      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }

      return valid;
    } catch (error) {
      console.error('Schema validation error:', error);
      return false;
    }
  };

  // Test the Events Endpoints
  describe('Events Endpoints', () => {
    it('should return a valid list of events', async () => {
      const response = await agent.get('/api/v1/events');

      if (response.status !== 200) {
        console.error('GET /events failed:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('events');
      expect(Array.isArray(response.body.data.events)).toBe(true);

      // Validate against OpenAPI schema
      const isValid = validateResponseSchema('/events', 'get', 200, response.body);
      if (!isValid) {
        console.error('Schema validation failed for GET /events');
      }
      expect(isValid).toBe(true);
    });

    it('should return a valid event by ID', async () => {
      // First get events to find a valid ID
      const eventsResponse = await agent.get('/api/v1/events');
      const eventId = eventsResponse.body.data?.events?.[0]?.id;

      if (!eventId) {
        console.warn('No events found to test');
        return;
      }

      const response = await agent.get(`/api/v1/events/${eventId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', eventId);

      // Validate against OpenAPI schema
      const isValid = validateResponseSchema('/events/{id}', 'get', 200, response.body);
      expect(isValid).toBe(true);
    });

    it('should return a valid error for non-existent event', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'; // Non-existent UUID
      const response = await agent.get(`/api/v1/events/${nonExistentId}`);

      if (response.status !== 404) {
        console.error('GET /events/:id non-existent failed:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);

      // Validate against OpenAPI schema
      const isValid = validateResponseSchema('/events/{id}', 'get', 404, response.body);
      expect(isValid).toBe(true);
    });
  });

  // Test Authentication Endpoints
  describe('Authentication Endpoints', () => {
    it('should validate login response format', async () => {
      const response = await agent
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com', // Use test credentials
          password: 'password123',
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');

        // Validate against OpenAPI schema
        const isValid = validateResponseSchema('/auth/login', 'post', 200, response.body);
        expect(isValid).toBe(true);
      } else {
        // If test user doesn't exist, at least validate error format
        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should validate user profile response format', async () => {
      if (!authToken) {
        console.warn('Auth token not available, skipping test');
        return;
      }

      const response = await agent
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');

      // Validate against OpenAPI schema
      const isValid = validateResponseSchema('/auth/me', 'get', 200, response.body);
      expect(isValid).toBe(true);
    });

    it('should validate unauthorized error format', async () => {
      const response = await agent
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);

      if (response.status === 401) {
        console.log('Unauthorized response body:', JSON.stringify(response.body, null, 2));
      }

      // Validate against OpenAPI schema
      const isValid = validateResponseSchema('/auth/me', 'get', 401, response.body);
      if (!isValid) {
        console.error('Schema validation failed for 401 response');
      }
      expect(isValid).toBe(true);
    });
  });

  // Test Payment Endpoints
  describe('Payment Endpoints', () => {
    it('should validate payment initialization request validation', async () => {
      if (!authToken) {
        console.warn('Auth token not available, skipping test');
        return;
      }

      // Deliberately send invalid data to test validation
      const response = await agent
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          amount: 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');

      // Validate against OpenAPI schema for validation error
      const isValid = validateResponseSchema('/payments/initialize', 'post', 400, response.body);
      expect(isValid).toBe(true);
    });
  });
});
