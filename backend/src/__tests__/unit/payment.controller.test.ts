import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies
jest.mock('../../db', () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };

  const mockDb: any = jest.fn(() => mockQueryBuilder);

  mockDb.transaction = jest.fn((callback: any) => callback(mockDb));
  mockDb.fn = {
    now: jest.fn()
  };

  // Expose query builder for tests
  mockDb.mockQueryBuilder = mockQueryBuilder;

  return {
    __esModule: true,
    db: mockDb,
    default: mockDb
  };
});

jest.mock('../../services/websocket.service');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-payment-uuid')
}));

describe('Payment Controller', () => {
  let PaymentController: any;
  let db: any;
  let qb: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    jest.resetModules();

    // Get mocked db
    const dbModule = require('../../db');
    db = dbModule.db;
    qb = db.mockQueryBuilder;

    // Get controller (will use mocked db)
    const controllerModule = require('../../controllers/payment.controller');
    PaymentController = controllerModule.PaymentController;

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockRequest = {
      body: {},
      params: {},
      user: {
        id: 'user-123',
        role: 'USER'
      }
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };

    mockNext = jest.fn() as any;
  });

  describe('initializePayment', () => {
    beforeEach(() => {
      // Setup request body for payment initialization
      mockRequest.body = {
        booking_id: 'booking-123',
        payment_method: 'upi',
        currency: 'INR'
      };
    });

    it('should initialize a payment successfully', async () => {
      // Mock booking found
      qb.first.mockResolvedValueOnce({
        id: 'booking-123',
        status: 'PENDING',
        user_id: 'user-123',
        final_amount: 1000
      });

      // Mock no existing payment
      qb.first.mockResolvedValueOnce(null);

      // Mock insert returning
      qb.returning.mockResolvedValueOnce([{
        id: 'test-payment-uuid',
        booking_id: 'booking-123',
        amount: 1000,
        payment_method: 'upi',
        currency: 'INR',
        status: 'pending'
      }]);

      // Execute the controller function
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(db).toHaveBeenCalledWith('bookings');
      expect(db).toHaveBeenCalledWith('booking_payments');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Payment initialized successfully',
        data: expect.objectContaining({
          transaction_id: 'test-payment-uuid',
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

      // Execute
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: 'Booking ID and payment method are required'
      }));
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      qb.first.mockResolvedValueOnce(null);

      // Execute
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Booking not found'
      }));
    });

    it('should throw an error if booking is not in pending state', async () => {
      // Mock booking in non-pending state
      qb.first.mockResolvedValueOnce({
        id: 'booking-123',
        status: 'CONFIRMED', // Not pending
        user_id: 'user-123',
        final_amount: 1000
      });

      // Execute
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('Cannot initialize payment for booking in CONFIRMED state')
      }));
    });

    it('should re-initialize payment if existing payment was rejected', async () => {
      // Mock booking found
      qb.first.mockResolvedValueOnce({
        id: 'booking-123',
        status: 'PENDING',
        user_id: 'user-123',
        final_amount: 1000
      });

      // Mock existing payment with rejected status
      qb.first.mockResolvedValueOnce({
        id: 'existing-payment-id',
        status: 'rejected',
        booking_id: 'booking-123'
      });

      // Execute the controller function
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(db).toHaveBeenCalledWith('booking_payments');
      expect(qb.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending'
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Payment re-initialized successfully'
      }));
    });

    it('should throw an error if payment already exists and is not rejected', async () => {
      // Mock booking found
      qb.first.mockResolvedValueOnce({
        id: 'booking-123',
        status: 'PENDING',
        user_id: 'user-123',
        final_amount: 1000
      });

      // Mock existing payment with non-rejected status
      qb.first.mockResolvedValueOnce({
        id: 'existing-payment-id',
        status: 'processing', // Not rejected
        booking_id: 'booking-123'
      });

      // Execute
      await PaymentController.initializePayment(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('Payment already initialized with status: processing')
      }));
    });
  });
});
