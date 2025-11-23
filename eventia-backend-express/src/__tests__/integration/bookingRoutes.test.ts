import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { generateToken } from '../../utils/jwt';
import { request } from '../setup';

describe('Booking Routes', () => {
  let authToken: string;
  let userId: string;
  let eventId: string;
  let ticketCategoryId: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Clear relevant tables (in reverse dependency order)
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();

    // Generate UUIDs for all entities
    userId = uuidv4();
    eventId = uuidv4();
    ticketCategoryId = uuidv4();

    // Create a test user (no foreign keys)
    await db('users').insert({
      id: userId,  // Manual UUID
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$hashedpassword',
      role: 'USER',
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });

    // Generate auth token for the test user
    authToken = generateToken({ id: userId, role: 'USER' });

    // Create a test event (depends on user)
    await db('events').insert({
      id: eventId,  // Manual UUID
      title: 'Test Event',
      description: 'Description of test event',
      start_date: new Date('2023-12-01'),
      end_date: new Date('2023-12-02'),
      location: 'Test Location',
      organizer_id: userId,  // Foreign key to user
      status: 'PUBLISHED',
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });

    // Create a test ticket category (depends on event)
    await db('ticket_categories').insert({
      id: ticketCategoryId,  // Manual UUID
      event_id: eventId,  // Foreign key to event
      name: 'General Admission',
      description: 'General admission ticket',
      price: 1000, // $10.00
      quantity: 100,
      max_per_order: 4,
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a new booking when authenticated', async () => {
      const bookingData = {
        eventId,
        ticketCategoryId,
        quantity: 2,
        seatNumbers: ['A1', 'A2']
      };

      const response = await request
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .type('json')  // Explicit Content-Type for body parsing
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.event_id).toBe(eventId);
      expect(response.body.data.user_id).toBe(userId);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 401 when not authenticated', async () => {
      const bookingData = {
        eventId,
        ticketCategoryId,
        quantity: 2,
        seatNumbers: ['A1', 'A2']
      };

      const response = await request
        .post('/api/v1/bookings')
        .type('json')  // Explicit Content-Type for body parsing
        .send(bookingData);

      expect(response.status).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const bookingData = {
        // Missing eventId
        ticketCategoryId,
        quantity: 2
      };

      const response = await request
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .type('json')  // Explicit Content-Type for body parsing
        .send(bookingData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return a booking by ID when authenticated', async () => {
      // First create a booking
      const [bookingId] = await db('bookings').insert({
        event_id: eventId,
        user_id: userId,
        ticket_category_id: ticketCategoryId,
        quantity: 2,
        total_price: 2000,
        status: 'pending',
        booking_date: new Date()
      }).returning('id');

      const response = await request
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(bookingId);
      expect(response.body.data.event_id).toBe(eventId);
    });

    it('should return 404 when booking does not exist', async () => {
      const response = await request
        .get('/api/v1/bookings/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should return all bookings for the authenticated user', async () => {
      // Create multiple bookings for the user
      await db('bookings').insert([
        {
          event_id: eventId,
          user_id: userId,
          ticket_category_id: ticketCategoryId,
          quantity: 2,
          total_price: 2000,
          status: 'pending',
          booking_date: new Date()
        },
        {
          event_id: eventId,
          user_id: userId,
          ticket_category_id: ticketCategoryId,
          quantity: 1,
          total_price: 1000,
          status: 'confirmed',
          booking_date: new Date()
        }
      ]);

      const response = await request
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });
});
