import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { request } from '../setup';
import prisma from '../../db/prisma';
import { EventStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Event Controller - Integration Tests', () => {
  // Test data
  let testEventId;
  let authToken;
  let testUser;
  
  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test-event-ctrl@example.com',
        password: '$2b$10$hashedpassword',
        role: 'ADMIN'
      }
    });
    
    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, role: testUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event for Controller',
        description: 'Description for controller test',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-02'),
        location: 'Test Location',
        organizerId: testUser.id,
        status: EventStatus.PUBLISHED
      }
    });
    
    testEventId = event.id;
  });
  
  afterAll(async () => {
    // Clean up test data
    await prisma.event.deleteMany({
      where: { title: 'Test Event for Controller' }
    });
    
    await prisma.user.deleteMany({
      where: { email: 'test-event-ctrl@example.com' }
    });
  });
  
  describe('GET /api/events', () => {
    it('should support cursor-based pagination', async () => {
      // Create a second event for pagination testing
      await prisma.event.create({
        data: {
          title: 'Test Event 2 for Pagination',
          description: 'Another test event',
          startDate: new Date('2023-12-10'),
          endDate: new Date('2023-12-11'),
          location: 'Test Location 2',
          organizerId: testUser.id,
          status: EventStatus.PUBLISHED
        }
      });
      
      // First request without cursor
      const firstResponse = await request.get('/api/events?limit=1');
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.data.events).toHaveLength(1);
      expect(firstResponse.body.data.pagination).toHaveProperty('nextCursor');
      
      // Second request with cursor from first response
      const cursor = firstResponse.body.data.pagination.nextCursor;
      const secondResponse = await request.get(`/api/events?limit=1&cursor=${cursor}`);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.data.events).toHaveLength(1);
      
      // Events from both requests should be different
      expect(secondResponse.body.data.events[0].id)
        .not.toBe(firstResponse.body.data.events[0].id);
      
      // Clean up
      await prisma.event.deleteMany({
        where: { title: 'Test Event 2 for Pagination' }
      });
    });
    
    it('should support field selection', async () => {
      const fields = 'id,title,location';
      const response = await request.get(`/api/events?fields=${fields}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.events[0]).toHaveProperty('id');
      expect(response.body.data.events[0]).toHaveProperty('title');
      expect(response.body.data.events[0]).toHaveProperty('location');
      expect(response.body.data.events[0]).not.toHaveProperty('description');
    });
    
    it('should filter events by status', async () => {
      // Create a draft event
      await prisma.event.create({
        data: {
          title: 'Draft Test Event',
          description: 'Draft event for testing',
          startDate: new Date('2023-12-10'),
          endDate: new Date('2023-12-11'),
          location: 'Test Location',
          organizerId: testUser.id,
          status: EventStatus.DRAFT
        }
      });
      
      // Filter by published status
      const publishedResponse = await request.get(`/api/events?status=PUBLISHED`);
      
      // All events should be PUBLISHED
      expect(publishedResponse.status).toBe(200);
      for (const event of publishedResponse.body.data.events) {
        expect(event.status).toBe('PUBLISHED');
      }
      
      // Only authenticated users should see draft events
      const draftResponse = await request.get(`/api/events?status=DRAFT`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(draftResponse.status).toBe(200);
      
      // There should be at least one DRAFT event
      expect(draftResponse.body.data.events.some(e => e.status === 'DRAFT')).toBe(true);
      
      // Clean up
      await prisma.event.deleteMany({
        where: { title: 'Draft Test Event' }
      });
    });
  });
  
  describe('GET /api/events/:id', () => {
    it('should fetch event by ID with included relations', async () => {
      const response = await request.get(`/api/events/${testEventId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id', testEventId);
      expect(response.body.data).toHaveProperty('title', 'Test Event for Controller');
      
      // Default includes should be present
      expect(response.body.data).toHaveProperty('ticketCategories');
      expect(response.body.data).toHaveProperty('categories');
    });
    
    it('should return 404 for non-existent event', async () => {
      const response = await request.get('/api/events/nonexistent-id');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/events', () => {
    it('should create a new event when authenticated', async () => {
      const newEvent = {
        title: 'New Test Event',
        description: 'New event description',
        startDate: new Date('2024-02-01').toISOString(),
        endDate: new Date('2024-02-02').toISOString(),
        location: 'New Test Location',
        status: EventStatus.DRAFT
      };
      
      const response = await request
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent);
      
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('title', newEvent.title);
      
      // Clean up
      await prisma.event.deleteMany({
        where: { title: 'New Test Event' }
      });
    });
    
    it('should return 401 when not authenticated', async () => {
      const newEvent = {
        title: 'Unauthenticated Event',
        description: 'Should not be created',
        startDate: new Date('2024-02-01').toISOString(),
        endDate: new Date('2024-02-02').toISOString(),
        location: 'Test Location'
      };
      
      const response = await request
        .post('/api/events')
        .send(newEvent);
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('PUT /api/events/:id', () => {
    it('should update an existing event when authenticated', async () => {
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated event description'
      };
      
      const response = await request
        .put(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('description', updateData.description);
    });
    
    it('should return 401 when not authenticated', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };
      
      const response = await request
        .put(`/api/events/${testEventId}`)
        .send(updateData);
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/public/events', () => {
    it('should only return published events', async () => {
      const response = await request.get('/api/public/events');
      
      expect(response.status).toBe(200);
      
      // All returned events should have PUBLISHED status
      for (const event of response.body.data.events) {
        expect(event.status).toBe('PUBLISHED');
      }
    });
  });
}); 