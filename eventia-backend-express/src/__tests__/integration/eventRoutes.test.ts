import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { Assert, Auth, TestDataFactory, Time } from '../helpers/testUtils';
import { request } from '../setup';

describe('Event Routes', () => {
  let organizer: { userId: string; authToken: string };
  let event1Id: string;
  let event2Id: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Create authenticated organizer
    organizer = await Auth.createAuthenticatedUser('ORGANIZER');

    // Create test events using factory
    event1Id = await TestDataFactory.createEvent(organizer.userId, {
      title: 'Test Event 1',
      description: 'Description of test event 1',
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-02'),
      location: 'Test Location 1',
      status: 'PUBLISHED'
    });

    event2Id = await TestDataFactory.createEvent(organizer.userId, {
      title: 'Test Event 2',
      description: 'Description of test event 2',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02'),
      location: 'Test Location 2',
      status: 'DRAFT'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await TestDataFactory.cleanup();
  });

  describe('GET /api/v1/events', () => {
    it('should return a list of published events', async () => {
      const response = await request.get('/api/v1/events');

      Assert.assertApiResponse(response, 200);
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThan(0);

      // Check that only published events are returned
      const events = response.body.data.events;
      const allPublished = events.every((e: any) => e.status === 'PUBLISHED');
      expect(allPublished).toBe(true);
    });

    it('should return all events for authenticated organizers', async () => {
      const response = await Auth.authenticatedRequest(organizer.authToken)
        .get('/api/v1/events');

      Assert.assertApiResponse(response, 200);
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('should return event details for published event', async () => {
      const response = await request.get(`/api/v1/events/${event1Id}`);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.id).toBe(event1Id);
      expect(response.body.data.title).toBe('Test Event 1');
    });

    it('should return 404 for non-existent event', async () => {
      const nonExistentId = uuidv4();
      const response = await request.get(`/api/v1/events/${nonExistentId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/events', () => {
    it('should create a new event when authenticated', async () => {
      const { startDate, endDate } = Time.createEventDateRange(30);

      const eventData = {
        title: 'New Test Event',
        description: 'Description of new test event',
        startDate: Time.toAPIDate(startDate),
        endDate: Time.toAPIDate(endDate),
        location: 'New Location',
        categoryIds: [uuidv4()], // Use a random UUID for category
        ticketCategories: [
          {
            name: 'General Admission',
            description: 'Standard entry',
            price: 1000,
            totalSeats: 100
          }
        ]
      };

      const response = await Auth.authenticatedRequest(organizer.authToken)
        .post('/api/v1/events')
        .send(eventData);

      Assert.assertApiResponse(response, 201);
      expect(response.body.data.title).toBe(eventData.title);
      Assert.assertIsUUID(response.body.data.id);
    });

    it('should return 401 when not authenticated', async () => {
      const eventData = {
        title: 'Unauthorized Event',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location'
      };

      const response = await request
        .post('/api/v1/events')
        .type('json')
        .send(eventData);

      Assert.assertAuthError(response);
    });

    it('should return 400 when required fields are missing', async () => {
      const eventData = {
        description: 'Missing title and dates'
      };

      const response = await Auth.authenticatedRequest(organizer.authToken)
        .post('/api/v1/events')
        .send(eventData);

      Assert.assertErrorResponse(response, 400);
    });
  });
});
