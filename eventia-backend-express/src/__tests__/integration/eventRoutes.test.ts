import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import db from '../../db';
import { request } from '../setup';
// Try to adjust the import path if the file structure is different
// You may need to check if the 'jwt' file exists in the 'utils' directory
// and its correct relative path.
import { generateToken } from '../../utils/jwt';

describe('Event Routes', () => {
  let authToken: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Clear and seed the database
    await db('events').del();
    await db('users').del();

    // Create a test user
    const [userId] = await db('users').insert({
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$hashedpassword',
      role: 'ORGANIZER'
    }).returning('id');

    // Generate auth token for the test user
    authToken = generateToken({ id: userId, role: 'organizer' });

    // Create test events
    await db('events').insert([
      {
        title: 'Test Event 1',
        description: 'Description of test event 1',
        start_date: new Date('2023-12-01'),
        end_date: new Date('2023-12-02'),
        location: 'Test Location 1',
        organizer_id: userId,
        status: 'PUBLISHED'
      },
      {
        title: 'Test Event 2',
        description: 'Description of test event 2',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-02'),
        location: 'Test Location 2',
        organizer_id: userId,
        status: 'DRAFT'
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
