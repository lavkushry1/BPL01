import { describe, expect, beforeEach, afterEach, it } from '@jest/globals';
import { request } from '../setup';
import db from '../../db';
import { generateToken } from '../../utils/jwt';

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
    // Clear relevant tables
    await db('payments').del();
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();
    
    // Create a test user
    [userId] = await db('users').insert({
      name: 'Test User',
      email: 'testuser@example.com',
      password: '$2b$10$hashedpassword',
      role: 'user'
    }).returning('id');
    
    // Create an admin user
    [adminId] = await db('users').insert({
      name: 'Admin User',
      email: 'admin@example.com',
      password: '$2b$10$hashedpassword',
      role: 'admin'
    }).returning('id');
    
    // Generate auth tokens
    userAuthToken = generateToken({ id: userId, role: 'user' });
    adminAuthToken = generateToken({ id: adminId, role: 'admin' });
    
    // Create a test event
    [eventId] = await db('events').insert({
      title: 'Test Event',
      description: 'Description of test event',
      start_date: new Date('2023-12-01'),
      end_date: new Date('2023-12-02'),
      location: 'Test Location',
      organizer_id: adminId,
      status: 'published'
    }).returning('id');
    
    // Create a test ticket category
    [ticketCategoryId] = await db('ticket_categories').insert({
      event_id: eventId,
      name: 'General Admission',
      description: 'General admission ticket',
      price: 1000, // $10.00
      quantity: 100,
      max_per_order: 4
    }).returning('id');
    
    // Create a test booking
    [bookingId] = await db('bookings').insert({
      event_id: eventId,
      user_id: userId,
      ticket_category_id: ticketCategoryId,
      quantity: 2,
      total_price: 2000,
      status: 'pending',
      booking_date: new Date()
    }).returning('id');
    
    // Create a test payment
    [paymentId] = await db('payments').insert({
      booking_id: bookingId,
      amount: 2000,
      currency: 'INR',
      status: 'pending',
      payment_method: 'upi',
      created_at: new Date()
    }).returning('id');
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