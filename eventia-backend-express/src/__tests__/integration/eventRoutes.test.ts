import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { generateToken } from '../../utils/jwt';
import { request } from '../setup';

describe('Event Routes', () => {
  let authToken: string;
  let userId: string;
  let event1Id: string;
  let event2Id: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Clear existing test data
    await db('events').del();
    await db('users').del();

    // Generate UUID manually for the user
    userId = uuidv4();

    // Create a test user with manual UUID and required Prisma timestamps
    await db('users').insert({
      id: userId,
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$hashedpassword',
      role: 'ORGANIZER',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate auth token for the test user
    authToken = generateToken({ id: userId, role: 'ORGANIZER' });

    // Create test events with manual UUIDs and required timestamps
    event1Id = uuidv4();
    event2Id = uuidv4();

    await db('events').insert([
      {
        id: event1Id,
        title: 'Test Event 1',
        description: 'Description of test event 1',
        start_date: new Date('2023-12-01'),
        end_date: new Date('2023-12-02'),
        location: 'Test Location 1',
        organizer_id: userId,
        status: 'PUBLISHED',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: event2Id,
        title: 'Test Event 2',
        description: 'Description of test event 2',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-02'),
        location: 'Test Location 2',
        organizer_id: userId,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await db('events').del();
    await db('users').del();
  });

  describe('GET /api/v1/events', () => {
    it('should return a list of published events', async () => {
      const response = await request.get('/api/v1/events');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1); // Only published events
      expect(response.body.data[0].title).toBe('Test Event 1');
    });

    it('should return all events for authenticated organizers', async () => {
      const response = await request
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // All events for the organizer
    });
  });

  describe('POST /api/v1/events', () => {
    it('should create a new event when authenticated', async () => {
      const newEvent = {
        title: 'New Test Event',
        description: 'New event description',
        startDate: '2024-02-01',
        endDate: '2024-02-02',
        location: 'New Test Location',
        status: 'PUBLISHED'
      };

      const response = await request
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(newEvent.title);

      // Verify the event was created in the database
      const dbEvents = await db('events').where('title', newEvent.title);
      expect(dbEvents.length).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const newEvent = {
        title: 'New Test Event',
        description: 'New event description',
        startDate: '2024-02-01',
        endDate: '2024-02-02',
        location: 'New Test Location'
      };

      const response = await request
        .post('/api/v1/events')
        .send(newEvent);

      expect(response.status).toBe(401);
    });
  });
});
