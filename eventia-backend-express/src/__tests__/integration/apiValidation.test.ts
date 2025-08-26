import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { Express } from 'express';
import { performance } from 'perf_hooks';
import { createApp } from '../../app';

let app: Express;
let request: supertest.SuperTest<supertest.Test>;
let authToken: string;

const PERFORMANCE_THRESHOLDS = {
  GET_EVENTS: 500, // ms
  GET_EVENT_BY_ID: 300, // ms
  CREATE_BOOKING: 500, // ms
  GET_USER_PROFILE: 200, // ms
  INITIALIZE_PAYMENT: 400, // ms
};

beforeAll(async () => {
  // Initialize the app
  const { app: createdApp } = await createApp();
  app = createdApp;
  request = supertest(app);
  
  // Create a test user and get auth token
  const registerResponse = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'API Validation User',
      email: 'apivalidation@example.com',
      password: 'Password123!',
      phone: '9876543210'
    });
  
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'apivalidation@example.com',
      password: 'Password123!'
    });
  
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  // Clean up test data if needed
});

describe('API Validation and Performance Tests', () => {
  describe('Input Validation', () => {
    test('POST /api/v1/auth/register - validates required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          // Missing required fields
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
    
    test('POST /api/v1/events - validates event data', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Invalid or incomplete event data
          name: 'Test Event',
          // Missing required fields
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
    
    test('POST /api/v1/bookings - validates booking data', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Invalid booking data
          // Missing required fields
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('Error Handling', () => {
    test('GET /api/v1/events/:id - returns 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/99999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
    
    test('GET /api/v1/bookings/:id - returns 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
    
    test('PUT /api/v1/users/profile - returns 400 for invalid data', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
  
  describe('Performance Testing', () => {
    test('GET /api/v1/events - performance test', async () => {
      const start = performance.now();
      
      await request(app).get('/api/v1/events');
      
      const end = performance.now();
      const duration = end - start;
      
      console.log(`GET /api/v1/events took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GET_EVENTS);
    });
    
    test('GET /api/v1/users/profile - performance test', async () => {
      const start = performance.now();
      
      await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      const end = performance.now();
      const duration = end - start;
      
      console.log(`GET /api/v1/users/profile took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GET_USER_PROFILE);
    });
    
    // This test requires an existing event
    test('GET /api/v1/events/:id - performance test', async () => {
      // First create an event
      const eventResponse = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Performance Test Event',
          description: 'Event for performance testing',
          startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          location: 'Test Location',
          isPublished: true,
          ticketCategories: [
            {
              name: 'Regular',
              price: 100,
              totalSeats: 100
            }
          ]
        });
      
      const eventId = eventResponse.body.id;
      
      const start = performance.now();
      
      await request(app).get(`/api/v1/events/${eventId}`);
      
      const end = performance.now();
      const duration = end - start;
      
      console.log(`GET /api/v1/events/${eventId} took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.GET_EVENT_BY_ID);
    });
  });
  
  describe('API Rate Limiting', () => {
    test('API endpoints should have rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(request.get('/api/v1/events'));
      }
      
      const responses = await Promise.all(requests);
      
      // At least some of the later requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      // We expect at least some rate limiting to occur
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('API Response Format', () => {
    test('GET /api/v1/events - response format validation', async () => {
      const response = await request(app).get('/api/v1/events');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const event = response.body[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('startDate');
        expect(event).toHaveProperty('endDate');
        expect(event).toHaveProperty('location');
        expect(event).toHaveProperty('isPublished');
      }
    });
    
    test('GET /api/v1/users/profile - response format validation', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('role');
    });
  });
});