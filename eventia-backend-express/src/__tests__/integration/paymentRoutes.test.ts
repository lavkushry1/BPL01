import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { generateToken } from '../../utils/jwt';
import { request } from '../setup';

describe('Payment Routes', () => {
  let userAuthToken: string;
  let adminAuthToken: string;
  let userId: string;
  let adminId: string;
  let eventId: string;
  let ticketCategoryId: string;
  let bookingId: string;
  let paymentId: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Clear relevant tables (in reverse dependency order)
    await db('payments').del();
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();

    // Generate UUIDs for all entities
    userId = uuidv4();
    adminId = uuidv4();
    eventId = uuidv4();
    ticketCategoryId = uuidv4();
    bookingId = uuidv4();
    paymentId = uuidv4();

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

    // Create an admin user (no foreign keys)
    await db('users').insert({
      id: adminId,  // Manual UUID
      name: 'Admin User',
      email: 'admin@example.com',
      password: '$2b$10$hashedpassword',
      role: 'ADMIN',
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });

    // Generate auth tokens
    userAuthToken = generateToken({ id: userId, role: 'USER' });
    adminAuthToken = generateToken({ id: adminId, role: 'ADMIN' });

    // Create a test event (depends on admin user)
    await db('events').insert({
      id: eventId,  // Manual UUID
      title: 'Test Event',
      description: 'Description of test event',
      start_date: new Date('2023-12-01'),
      end_date: new Date('2023-12-02'),
      location: 'Test Location',
      organizer_id: adminId,  // Foreign key to admin user
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

    // Create a test booking (depends on event, user, ticket_category)
    await db('bookings').insert({
      id: bookingId,  // Manual UUID
      event_id: eventId,  // Foreign key to event
      user_id: userId,  //Foreign key to user
      ticket_category_id: ticketCategoryId,  // Foreign key to ticket_category
      quantity: 2,
      total_price: 2000,
      status: 'pending',
      booking_date: new Date(),
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });

    // Create a test payment (depends on booking)
    await db('payments').insert({
      id: paymentId,  // Manual UUID
      booking_id: bookingId,  // Foreign key to booking
      amount: 2000,
      currency: 'INR',
      status: 'pending',
      payment_method: 'upi',
      createdAt: new Date(),  // Required Prisma timestamp (camelCase)
      updatedAt: new Date()   // Required Prisma timestamp (camelCase)
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db('payments').del();
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();
  });

  describe('POST /api/v1/payments/initialize', () => {
    it('should initialize a payment for a booking', async () => {
      const paymentData = {
        bookingId,
        paymentMethod: 'upi'
      };

      const response = await request
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .type('json')
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.booking_id).toBe(bookingId);
      expect(response.body.data.payment_method).toBe('upi');
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 400 when booking ID is missing', async () => {
      const paymentData = {
        paymentMethod: 'upi'
      };

      const response = await request
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .type('json')
        .send(paymentData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/:id/verify', () => {
    it('should verify a payment with UTR number', async () => {
      const verificationData = {
        utrNumber: 'UTR123456789'
      };

      const response = await request
        .post(`/api/v1/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .type('json')
        .send(verificationData);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('verification_pending');
      expect(response.body.data.utr_number).toBe('UTR123456789');
    });

    it('should return 400 when UTR number is missing', async () => {
      const response = await request
        .post(`/api/v1/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .type('json')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/admin/payments/:id/verify', () => {
    it('should allow admin to verify a payment', async () => {
      // First update the payment to have a UTR number
      await db('payments')
        .where('id', paymentId)
        .update({
          utr_number: 'UTR123456789',
          status: 'verification_pending'
        });

      const response = await request
        .post(`/api/v1/admin/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('verified');

      // Check that booking status was also updated
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();

      expect(booking.status).toBe('confirmed');
    });

    it('should return 403 when non-admin tries to verify', async () => {
      const response = await request
        .post(`/api/v1/admin/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/payments/booking/:bookingId', () => {
    it('should return payment details for a booking', async () => {
      const response = await request
        .get(`/api/v1/payments/booking/${bookingId}`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.booking_id).toBe(bookingId);
    });

    it('should return 404 when payment does not exist', async () => {
      // Delete the payment first
      await db('payments').where('id', paymentId).del();

      const response = await request
        .get(`/api/v1/payments/booking/${bookingId}`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/admin/payments/pending', () => {
    it('should return a list of pending payments for admin', async () => {
      // Update payment to verification_pending
      await db('payments')
        .where('id', paymentId)
        .update({
          status: 'verification_pending',
          utr_number: 'UTR123456789'
        });

      const response = await request
        .get('/api/v1/admin/payments/pending')
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].status).toBe('verification_pending');
    });

    it('should return 403 when non-admin tries to access', async () => {
      const response = await request
        .get('/api/v1/admin/payments/pending')
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.status).toBe(403);
    });
  });
});
