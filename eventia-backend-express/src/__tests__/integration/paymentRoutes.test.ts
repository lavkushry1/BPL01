import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { Assert, Auth, Generate, TestDataFactory } from '../helpers/testUtils';

describe('Payment Routes', () => {
  console.log('Debug - Starting Payment Routes Test File');
  let user: { userId: string; authToken: string };
  let admin: { userId: string; authToken: string };
  let scenario: Awaited<ReturnType<typeof TestDataFactory.createRealisticScenario>>;

  // Seed test data before each test
  beforeEach(async () => {
    // Create a complete realistic scenario
    // This handles User -> Event -> Ticket -> Booking -> Payment chain automatically
    scenario = await TestDataFactory.createRealisticScenario();

    // Get auth tokens for the users created in the scenario
    user = await Auth.createAuthenticatedUser('USER');
    // Overwrite the user in scenario with our authenticated user for testing
    // or just use the scenario users if we had their tokens.
    // For simplicity, let's create a new booking for our authenticated user.

    // Create admin for verification tests
    admin = await Auth.createAuthenticatedUser('ADMIN');
  });

  afterEach(async () => {
    // Clean up all test data
    await TestDataFactory.cleanup();
  });

  describe('POST /api/v1/payments/initialize', () => {
    it('should initialize a payment for a pending booking', async () => {
      // Create a fresh booking for the user
      const bookingId = await TestDataFactory.createBooking(
        user.userId,
        scenario.event,
        scenario.ticketCategories[0]
      );

      const paymentData = {
        bookingId,
        amount: 2000,
        currency: 'INR',
        paymentMethod: 'upi'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/payment-initialize/payments/initialize')
        .send(paymentData);

      Assert.assertApiResponse(response, 201);
      expect(response.body.data.booking_id).toBe(bookingId);
      expect(response.body.data.amount).toBe(2000);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.transaction_id).toBeDefined();
    });

    it('should return 404 for non-existent booking', async () => {
      const paymentData = {
        bookingId: uuidv4(),
        amount: 2000,
        currency: 'INR',
        paymentMethod: 'upi'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/payment-initialize/payments/initialize')
        .send(paymentData);

      expect(response.status).toBe(404);
    });

    it('should return 403 when paying for another user booking', async () => {
      // Use the booking from the scenario (which belongs to a different user)
      const bookingId = scenario.bookings.booking1;

      const paymentData = {
        bookingId,
        amount: 2000,
        currency: 'INR',
        paymentMethod: 'upi'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/payment-initialize/payments/initialize')
        .send(paymentData);

      Assert.assertForbiddenError(response);
    });
  });

  describe('POST /api/v1/payments/:id/verify', () => {
    it('should verify a payment with UTR number', async () => {
      // Create a booking and initialize payment
      const bookingId = await TestDataFactory.createBooking(
        user.userId,
        scenario.event,
        scenario.ticketCategories[0]
      );

      // Initialize payment manually or via factory if we had a helper
      // Let's do it via API to be safe or insert directly
      const paymentId = await TestDataFactory.createPayment(bookingId, { amount: 2000 });

      const verifyData = {
        payment_id: paymentId,
        utr_number: Generate.generateUTR(),
        user_id: user.userId
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/payment-initialize/payments/verify')
        .send(verifyData);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.status).toBe('processing'); // Or verified depending on logic
      expect(response.body.data.utr_number).toBe(verifyData.utr_number);
    });

    it('should return 404 for non-existent payment', async () => {
      const verifyData = {
        utrNumber: Generate.generateUTR()
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .put(`/api/v1/payments/${uuidv4()}/verify`)
        .send(verifyData);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/admin/payments/:id/verify', () => {
    it('should allow admin to verify payment', async () => {
      // Create a new payment in awaiting_verification state
      // Create a new booking and payment in awaiting_verification state
      const bookingId = await TestDataFactory.createBooking(
        user.userId,
        scenario.event,
        scenario.ticketCategories[0]
      );
      const paymentId = await TestDataFactory.createPayment(bookingId, {
        amount: 2000,
        status: 'awaiting_verification'
      });

      const verifyData = {
        status: 'verified',
        notes: 'Payment verified by admin'
      };

      const response = await Auth.authenticatedRequest(admin.authToken)
        .put(`/api/v1/payments/${paymentId}/verify`)
        .send(verifyData);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.status).toBe('verified');
    });

    it('should return 403 for non-admin users', async () => {
      const paymentId = scenario.payments.payment1;

      const verifyData = {
        status: 'verified'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .put(`/api/v1/payments/${paymentId}/verify`)
        .send(verifyData);

      Assert.assertForbiddenError(response);
    });
  });

  describe('GET /api/v1/payments/booking/:bookingId', () => {
    it('should return payment for a specific booking', async () => {
      // Use a booking from the scenario that has a payment
      const bookingId = scenario.bookings.booking1;
      const paymentId = scenario.payments.payment1;

      // The booking belongs to user1, so we need user1's token or admin
      // Since we don't have user1's token easily available (unless we login),
      // let's use admin for simplicity or assume the test user owns it if we created it.
      // Actually scenario.users.user1 is just the ID. We don't have the token.
      // So let's use admin.

      const response = await Auth.authenticatedRequest(admin.authToken)
        .get(`/api/v1/payments/booking/${bookingId}`);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.id).toBe(paymentId);
      expect(response.body.data.booking_id).toBe(bookingId);
    });
  });

});
