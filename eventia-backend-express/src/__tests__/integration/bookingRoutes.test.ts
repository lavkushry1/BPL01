import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { TestDataFactory } from '../helpers/testDataFactory';
import { Assert, Auth } from '../helpers/testUtils';
import { request } from '../setup';

describe('Booking Routes', () => {
  let user: { userId: string; authToken: string };
  let eventId: string;
  let ticketCategoryId: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Create authenticated user (the booker)
    user = await Auth.createAuthenticatedUser('USER');

    // Create an organizer to own the event
    const organizerId = await TestDataFactory.createOrganizer();

    // Create event and ticket category
    eventId = await TestDataFactory.createEvent(organizerId);
    ticketCategoryId = await TestDataFactory.createTicketCategory(eventId);
  });

  afterEach(async () => {
    // Clean up all test data
    await TestDataFactory.cleanup();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a new booking when authenticated', async () => {
      const bookingData = {
        eventId,
        ticketCategoryId,
        quantity: 2,
        seatNumbers: ['A1', 'A2']
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/bookings')
        .send(bookingData);

      Assert.assertApiResponse(response, 201);
      expect(response.body.data.event_id).toBe(eventId);
      expect(response.body.data.user_id).toBe(user.userId);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 401 when not authenticated', async () => {
      const bookingData = {
        eventId,
        ticketCategoryId,
        quantity: 1
      };

      const response = await request
        .post('/api/v1/bookings')
        .type('json')
        .send(bookingData);

      Assert.assertAuthError(response);
    });

    it('should return 400 when quantity exceeds limit', async () => {
      const bookingData = {
        eventId,
        ticketCategoryId,
        quantity: 1000 // Exceeds available seats
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/bookings')
        .send(bookingData);

      Assert.assertErrorResponse(response, 400);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should return user bookings', async () => {
      // Create a booking first
      await TestDataFactory.createBooking(user.userId, eventId, ticketCategoryId);

      const response = await Auth.authenticatedRequest(user.authToken)
        .get('/api/v1/bookings');

      Assert.assertApiResponse(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].event_id).toBe(eventId);
    });

    it('should return empty list if user has no bookings', async () => {
      // Create a new user with no bookings
      const newUser = await Auth.createAuthenticatedUser('USER');

      const response = await Auth.authenticatedRequest(newUser.authToken)
        .get('/api/v1/bookings');

      Assert.assertApiResponse(response, 200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking details', async () => {
      // Create a booking
      const bookingId = await TestDataFactory.createBooking(user.userId, eventId, ticketCategoryId);

      const response = await Auth.authenticatedRequest(user.authToken)
        .get(`/api/v1/bookings/${bookingId}`);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.id).toBe(bookingId);
      expect(response.body.data.user_id).toBe(user.userId);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = uuidv4();
      const response = await Auth.authenticatedRequest(user.authToken)
        .get(`/api/v1/bookings/${nonExistentId}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 when accessing another user booking', async () => {
      // Create a booking for the main user
      const bookingId = await TestDataFactory.createBooking(user.userId, eventId, ticketCategoryId);

      // Create another user
      const otherUser = await Auth.createAuthenticatedUser('USER');

      // Try to access the booking with the other user
      const response = await Auth.authenticatedRequest(otherUser.authToken)
        .get(`/api/v1/bookings/${bookingId}`);

      Assert.assertForbiddenError(response);
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should cancel a booking', async () => {
      // Create a booking
      const bookingId = await TestDataFactory.createBooking(user.userId, eventId, ticketCategoryId);

      const response = await Auth.authenticatedRequest(user.authToken)
        .post(`/api/v1/bookings/${bookingId}/cancel`);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should return 403 when cancelling another user booking', async () => {
      // Create a booking for the main user
      const bookingId = await TestDataFactory.createBooking(user.userId, eventId, ticketCategoryId);

      // Create a new user to ensure it's different from the booking owner
      const otherUser = await Auth.createAuthenticatedUser();

      const response = await Auth.authenticatedRequest(otherUser.authToken)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .send({});

      Assert.assertForbiddenError(response);
    });
  });
});
