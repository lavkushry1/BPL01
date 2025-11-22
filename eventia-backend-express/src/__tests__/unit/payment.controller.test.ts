import { fail } from 'assert';
import { Request, Response } from 'express';
import { beforeEach, describe, it } from 'node:test';
import { PaymentController } from '../../controllers/payment.controller';
import { db } from '../../db';

// Mock dependencies
jest.mock('../../db');
jest.mock('../../services/websocket.service');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-payment-uuid')
}));

describe('Payment Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockRequest = {
      body: {},
      params: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Mock db.fn.now()
    db.fn = {
      now: jest.fn()
    } as any;
  });

  describe('initializePayment', () => {
    beforeEach(() => {
      // Setup request body for payment initialization
      mockRequest.body = {
        booking_id: 'booking-123',
        payment_method: 'upi',
        currency: 'INR'
      };

      // Mock database query builder
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValueOnce({
          id: 'booking-123',
          status: 'pending',
          final_amount: 1000
        }).mockResolvedValueOnce(null), // No existing payment
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'test-payment-uuid',
          booking_id: 'booking-123',
          amount: 1000,
          payment_method: 'upi',
          currency: 'INR',
          status: 'pending'
        }]),
        update: jest.fn().mockReturnThis()
      };

      (db as any) = jest.fn().mockReturnValue(mockQueryBuilder);
      Object.assign(db as any, mockQueryBuilder);

      // Mock transaction
      (db.transaction as any) = jest.fn().mockImplementation(async (callback) => {
        return await callback(db);
      });
    });

    it('should initialize a payment successfully', async () => {
      // Execute the controller function
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(db).toHaveBeenCalledWith('bookings');
      expect(db).toHaveBeenCalledWith('booking_payments');
      expect(db.transaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          payment_id: 'test-payment-uuid',
          booking_id: 'booking-123',
          payment_method: 'upi',
          amount: 1000
        })
      }));
    });

    it('should throw an error if required fields are missing', async () => {
      // Missing required fields
      mockRequest.body = {
        booking_id: 'booking-123'
        // Missing payment_method
      };

      // Execute and catch error
      try {
        await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Booking ID and payment method are required');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      (db as any) = jest.fn().mockReturnValue(mockQueryBuilder);
      Object.assign(db as any, mockQueryBuilder);

      // Execute and catch error
      try {
        await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Booking not found');
      }
    });

    it('should throw an error if booking is not in pending state', async () => {
      // Mock booking in non-pending state
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'booking-123',
          status: 'confirmed', // Not pending
          final_amount: 1000
        })
      };
      (db as any) = jest.fn().mockReturnValue(mockQueryBuilder);
      Object.assign(db as any, mockQueryBuilder);

      // Execute and catch error
      try {
        await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Cannot initialize payment for booking in confirmed state');
      }
    });

    it('should re-initialize payment if existing payment was rejected', async () => {
      // Mock existing payment with rejected status
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn()
          .mockResolvedValueOnce({
            id: 'booking-123',
            status: 'pending',
            final_amount: 1000
          })
          .mockResolvedValueOnce({
            id: 'existing-payment-id',
            status: 'rejected',
            booking_id: 'booking-123'
          }),
        update: jest.fn().mockReturnThis()
      };
      (db as any) = jest.fn().mockReturnValue(mockQueryBuilder);
      Object.assign(db as any, mockQueryBuilder);

      // Execute the controller function
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      const dbInstance = db();
      expect(dbInstance.update).toHaveBeenCalledWith({
        status: 'pending',
        updated_at: expect.any(Function)
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          payment_id: 'existing-payment-id',
          booking_id: 'booking-123',
          status: 'pending'
        })
      }));
    });

    it('should throw an error if payment already exists and is not rejected', async () => {
      // Mock existing payment with non-rejected status
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn()
          .mockResolvedValueOnce({
            id: 'booking-123',
            status: 'pending',
            final_amount: 1000
          })
          .mockResolvedValueOnce({
            id: 'existing-payment-id',
            status: 'processing', // Not rejected
            booking_id: 'booking-123'
          })
      };
      (db as any) = jest.fn().mockReturnValue(mockQueryBuilder);
      Object.assign(db as any, mockQueryBuilder);

      // Execute and catch error
      try {
        await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Payment already initialized with status: processing');
      }
    });
  });
});
