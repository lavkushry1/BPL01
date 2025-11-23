/**
 * Example Integration Test using Professional Test Utilities
 *
 * This example demonstrates how to write tests using the test factory
 * and utilities following Google/Apple standards for maintainable,
 * readable, and DRY (Don't Repeat Yourself) test code.
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Assert, Auth, Generate, TestDataFactory, Time } from '../helpers/testUtils';
import { request } from '../setup';

describe('Event Routes - Using Test Utilities', () => {
  let organizer: { userId: string; authToken: string };
  let user: { userId: string; authToken: string };

  beforeEach(async () => {
    // Create authenticated users using helpers
    organizer = await Auth.createAuthenticatedUser('ORGANIZER');
    user = await Auth.createAuthenticatedUser('USER');
  });

  afterEach(async () => {
    // Clean up all test data
    await TestDataFactory.cleanup();
  });

  describe('POST /api/v1/events - Creating Events', () => {
    it('should create an event with realistic data', async () => {
      const { startDate, endDate } = Time.createEventDateRange(30);

      const eventData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference',
        startDate: Time.toAPIDate(startDate),
        endDate: Time.toAPIDate(endDate),
        location: 'Convention Center',
        categoryIds: [Generate.randomUUID()],  // In real test, use actual category IDs
        ticketCategories: [
          {
            name: 'VIP',
           price: Generate.randomPrice(2000, 5000),
            totalSeats: 50
          }
        ]
      };

      const response = await Auth.authenticatedRequest(organizer.authToken)
        .post('/api/v1/events')
        .send(eventData);

      Assert.assertApiResponse(response, 201);
      expect(response.body.data.title).toBe(eventData.title);
      Assert.assertIsUUID(response.body.data.id);
      Assert.assertHasTimestamps(response.body.data);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        // Missing title, startDate, location
        description: 'Incomplete event'
      };

      const response = await Auth.authenticatedRequest(organizer.authToken)
        .post('/api/v1/events')
        .send(invalidData);

      Assert.assertValidationError(response, ['title', 'location', 'startDate']);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const eventData = {
        title: 'Test Event',
        startDate: Time.toAPIDate(Time.futureDate()),
        endDate: Time.toAPIDate(Time.futureDate(3)),
        location: 'Test Location'
      };

      const response = await request
        .post('/api/v1/events')
        .type('json')
        .send(eventData);

      Assert.assertAuthError(response);
    });

    it('should return 403 for non-organizer users', async () => {
      const eventData = {
        title: 'Test Event',
        startDate: Time.toAPIDate(Time.futureDate()),
        endDate: Time.toAPIDate(Time.futureDate(3)),
        location: 'Test Location'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/events')
        .send(eventData);

      Assert.assertForbiddenError(response);
    });
  });

  describe('GET /api/v1/events - Fetching Events', () => {
    beforeEach(async () => {
      // Create test events using factory
      await TestDataFactory.createRealEvent(organizer.userId, 0);
      await TestDataFactory.createRealEvent(organizer.userId, 1);
      await TestDataFactory.createDummyEvent(organizer.userId);
    });

    it('should return list of published events', async () => {
      const response = await request.get('/api/v1/events');

      Assert.assertApiResponse(response, 200);
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(2);

      // All events should be published
      response.body.data.events.forEach((event: any) => {
        expect(event.status).toBe('PUBLISHED');
      });
    });
  });
});

describe('Booking Flow - Complete Scenario', () => {
  let scenario: Awaited<ReturnType<typeof TestDataFactory.createRealisticScenario>>;

  beforeEach(async () => {
    // Create a complete realistic scenario with one call
    scenario = await TestDataFactory.createRealisticScenario();
  });

  afterEach(async () => {
    await TestDataFactory.cleanup();
  });

  it('should allow user to book tickets for an event', async () => {
    const userAuthToken = Auth.authenticatedRequest(
      generateToken({ id: scenario.users.user1, role: 'USER' })
    );

    const bookingData = {
      eventId: scenario.event,
      ticketCategoryId: scenario.ticketCategories[1], // General admission
      quantity: Generate.randomQuantity(1, 3),
      seatNumbers: ['A1', 'A2']
    };

    const response = await userAuthToken
      .post('/api/v1/bookings')
      .send(bookingData);

    Assert.assertApiResponse(response, 201);
    expect(response.body.data.event_id).toBe(scenario.event);
    expect(response.body.data.user_id).toBe(scenario.users.user1);
  });

  it('should allow admin to verify payments', async () => {
    const adminAuthToken = Auth.authenticatedRequest(
      generateToken({ id: scenario.users.admin, role: 'ADMIN' })
    );

    // Update payment with UTR
    const verificationData = {
      utrNumber: Generate.generateUTR()
    };

    const response = await adminAuthToken
      .post(`/api/v1/admin/payments/${scenario.payments.payment2}/verify`)
      .send(verificationData);

    Assert.assertApiResponse(response, 200);
    expect(response.body.data.status).toBe('verified');
  });
});

/**
 * Example: Testing with different user types
 */
describe('Role-based Access Control', () => {
  let admin: { userId: string; authToken: string };
  let organizer: { userId: string; authToken: string };
  let user: { userId: string; authToken: string };
  let eventId: string;

  beforeEach(async () => {
    // Create users of different roles
    [admin, organizer, user] = await Promise.all([
      Auth.createAuthenticatedUser('ADMIN'),
      Auth.createAuthenticatedUser('ORGANIZER'),
      Auth.createAuthenticatedUser('USER')
    ]);

    // Create an event
    eventId = await TestDataFactory.createEvent(organizer.userId);
  });

  afterEach(async () => {
    await TestDataFactory.cleanup();
  });

  it('should allow admin to access all events', async () => {
    const response = await Auth.authenticatedRequest(admin.authToken)
      .get('/api/v1/admin/events');

    Assert.assertApiResponse(response, 200);
  });

  it('should allow organizer to edit their own events', async () => {
    const updateData = {
      title: 'Updated Event Title',
      description: 'Updated description'
    };

    const response = await Auth.authenticatedRequest(organizer.authToken)
      .put(`/api/v1/events/${eventId}`)
      .send(updateData);

    Assert.assertApiResponse(response, 200);
    expect(response.body.data.title).toBe(updateData.title);
  });

  it('should prevent regular user from editing events', async () => {
    const updateData = {
      title: 'Unauthorized Update'
    };

    const response = await Auth.authenticatedRequest(user.authToken)
      .put(`/api/v1/events/${eventId}`)
      .send(updateData);

    Assert.assertForbiddenError(response);
  });
});

// Import generateToken (add this at top of file in real implementation)
import { generateToken } from '../../utils/jwt';
