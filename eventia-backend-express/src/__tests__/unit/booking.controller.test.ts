import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { createBooking, getBookingById, saveDeliveryDetails, updateBookingStatus } from '../../controllers/booking.controller';
import { db } from '../../db';
import { SeatStatus } from '../../models/seat';
import { WebsocketService } from '../../services/websocket.service';

// Mock dependencies
jest.mock('../../db');
jest.mock('../../services/websocket.service');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

// Mock validation schemas
jest.mock('../../validations/booking.validation', () => ({
  createBookingSchema: {
    parse: jest.fn((data) => data)
  },
  saveDeliveryDetailsSchema: {
    parse: jest.fn((data) => data)
  },
  updateBookingStatusSchema: {
    parse: jest.fn((data) => data)
  },
  cancelBookingSchema: {
    parse: jest.fn((data) => data)
  }
}));

import { createBookingSchema, saveDeliveryDetailsSchema, updateBookingStatusSchema } from '../../validations/booking.validation';


describe('Booking Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockDbInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockRequest = {
      body: {},
      params: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };

    mockNext = jest.fn();

    // Setup shared mock db instance
    mockDbInstance = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      first: (jest.fn() as any).mockResolvedValue({
        id: 'event-123',
        capacity: 100,
        booked_count: 50
      }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      increment: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      returning: (jest.fn() as any).mockResolvedValue([{
        id: 'test-uuid',
        event_id: 'event-123',
        user_id: 'user-123',
        amount: 1000,
        payment_method: 'upi',
        status: 'PENDING'
      }])
    };

    // Mock database implementation to return the shared instance
    (db as any).mockImplementation(() => mockDbInstance);

    // Mock transaction
    (db.transaction as jest.Mock) = jest.fn().mockImplementation(async (callback: any) => {
      // Create a transaction mock that mimics the db interface
      const trxMock = jest.fn(() => mockDbInstance);
      Object.assign(trxMock, {
        fn: {
          now: jest.fn()
        }
      });
      return await callback(trxMock);
    });

    // Mock db.fn
    (db as any).fn = {
      now: jest.fn()
    };
  });

  describe('createBooking', () => {
    beforeEach(() => {
      // Setup request body for booking creation
      mockRequest.body = {
        event_id: 'event-123',
        user_id: 'user-123',
        seat_ids: ['seat-1', 'seat-2'],
        amount: 1000,
        payment_method: 'upi'
      };
    });

    it('should create a booking successfully', async () => {
      // Execute the controller function
      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(db).toHaveBeenCalledWith('events');
      expect(db.transaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'test-uuid',
          event_id: 'event-123',
          status: 'PENDING'
        })
      });
    });

    it('should update seat status when seat_ids are provided', async () => {
      // Execute the controller function
      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions for seat updates
      expect(mockDbInstance.update).toHaveBeenCalledWith({
        status: SeatStatus.BOOKED,
        booking_id: 'test-uuid',
        updated_at: expect.any(Function)
      });
      expect(mockDbInstance.whereIn).toHaveBeenCalledWith('id', ['seat-1', 'seat-2']);
      expect(WebsocketService.notifySeatStatusChange).toHaveBeenCalledWith(
        ['seat-1', 'seat-2'],
        SeatStatus.BOOKED
      );
    });

    it('should throw an error if required fields are missing', async () => {
      // Mock validation error
      (createBookingSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      // Execute and catch error
      try {
        await createBooking(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should throw an error if event does not exist', async () => {
      // Mock event not found
      mockDbInstance.first.mockResolvedValue(null);

      // Execute and catch error
      try {
        await createBooking(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Event not found');
      }
    });
  });

  describe('getBookingById', () => {
    beforeEach(() => {
      // Setup request params
      mockRequest.params = {
        id: 'booking-123'
      };

      // Mock database response
      mockDbInstance.first.mockResolvedValue({
        id: 'booking-123',
        event_id: 'event-123',
        user_id: 'user-123',
        amount: 1000,
        payment_method: 'upi',
        status: 'CONFIRMED'
      });
    });

    it('should retrieve a booking successfully', async () => {
      // Execute the controller function
      await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'booking-123',
          status: 'CONFIRMED'
        })
      });
    });

    it('should throw an error if booking ID is missing', async () => {
      // Missing ID parameter
      mockRequest.params = {};

      // Execute and catch error
      try {
        await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Booking ID is required');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      // Execute and catch error
      try {
        await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Booking not found');
      }
    });
  });

  describe('updateBookingStatus', () => {
    beforeEach(() => {
      // Setup request params and body
      mockRequest.params = {
        id: 'booking-123'
      };
      mockRequest.body = {
        status: 'CONFIRMED'
      };

      // Mock database responses
      mockDbInstance.first.mockResolvedValue({
        id: 'booking-123'
      });
      mockDbInstance.returning.mockResolvedValue([{
        id: 'booking-123',
        status: 'CONFIRMED',
        updated_at: new Date()
      }]);
    });

    it('should update booking status successfully', async () => {
      // Execute the controller function
      await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(mockDbInstance.where).toHaveBeenCalledWith('id', 'booking-123');
      expect(mockDbInstance.update).toHaveBeenCalledWith({
        status: 'CONFIRMED',
        updated_at: expect.any(Function)
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'booking-123',
          status: 'CONFIRMED'
        })
      });
    });

    it('should throw an error if booking ID or status is missing', async () => {
      // Mock validation error
      (updateBookingStatusSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      // Execute and catch error
      try {
        await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      // Execute and catch error
      try {
        await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Booking not found');
      }
    });
  });

  describe('saveDeliveryDetails', () => {
    beforeEach(() => {
      // Setup request body
      mockRequest.body = {
        booking_id: 'booking-123',
        name: 'John Doe',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Mumbai',
        pincode: '400001'
      };

      // Mock database responses
      mockDbInstance.first.mockResolvedValue({
        id: 'booking-123'
      });
      mockDbInstance.returning.mockResolvedValue([{
        id: 'test-uuid',
        booking_id: 'booking-123',
        name: 'John Doe',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Mumbai',
        pincode: '400001'
      }]);
    });

    it('should save delivery details successfully for a new record', async () => {
      // Mock that delivery details don't exist yet
      mockDbInstance.first
        .mockResolvedValueOnce({ id: 'booking-123' }) // Booking exists
        .mockResolvedValueOnce(null); // No existing delivery details

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(mockDbInstance.insert).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'test-uuid',
          booking_id: 'booking-123',
          name: 'John Doe'
        })
      });
    });

    it('should update existing delivery details', async () => {
      // Mock that delivery details already exist
      mockDbInstance.first
        .mockResolvedValueOnce({ id: 'booking-123' }) // Booking exists
        .mockResolvedValueOnce({ id: 'existing-delivery-id', booking_id: 'booking-123' }); // Existing details

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(mockDbInstance.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          id: 'test-uuid',
          booking_id: 'booking-123'
        })
      });
    });

    it('should throw an error if required fields are missing', async () => {
      // Mock validation error
      (saveDeliveryDetailsSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Validation failed');
      });

      // Execute and catch error
      try {
        await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.message).toBe('Validation failed');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      // Execute and catch error
      try {
        await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Booking not found');
      }
    });
  });
});
