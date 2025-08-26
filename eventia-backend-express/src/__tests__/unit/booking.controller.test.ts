import { Request, Response } from 'express';
import { createBooking, getBookingById, updateBookingStatus, saveDeliveryDetails } from '../../controllers/booking.controller';
import { db } from '../../db';
import { WebsocketService } from '../../services/websocket.service';
import { SeatStatus } from '../../models/seat';

// Mock dependencies
jest.mock('../../db');
jest.mock('../../services/websocket.service');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

describe('Booking Controller', () => {
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

      // Mock database responses
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'event-123',
          capacity: 100,
          booked_count: 50
        }),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'test-uuid',
          event_id: 'event-123',
          user_id: 'user-123',
          amount: 1000,
          payment_method: 'upi',
          status: 'PENDING'
        }]),
        update: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis()
      }));

      // Mock transaction
      (db.transaction as jest.Mock) = jest.fn().mockImplementation(async (callback) => {
        return await callback(db);
      });
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
      const dbInstance = db();
      expect(dbInstance.update).toHaveBeenCalledWith({
        status: SeatStatus.BOOKED,
        booking_id: 'test-uuid',
        updated_at: expect.any(Function)
      });
      expect(dbInstance.whereIn).toHaveBeenCalledWith('id', ['seat-1', 'seat-2']);
      expect(WebsocketService.notifySeatStatusChange).toHaveBeenCalledWith(
        ['seat-1', 'seat-2'],
        SeatStatus.BOOKED
      );
    });

    it('should throw an error if required fields are missing', async () => {
      // Missing required fields
      mockRequest.body = {
        event_id: 'event-123',
        // Missing user_id, amount, payment_method
      };

      // Execute and catch error
      try {
        await createBooking(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Missing required booking information');
      }
    });

    it('should throw an error if event does not exist', async () => {
      // Mock event not found
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      }));

      // Execute and catch error
      try {
        await createBooking(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
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
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'booking-123',
          event_id: 'event-123',
          user_id: 'user-123',
          amount: 1000,
          payment_method: 'upi',
          status: 'CONFIRMED'
        })
      }));
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
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Booking ID is required');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      }));

      // Execute and catch error
      try {
        await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
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
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'booking-123'
        }),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'booking-123',
          status: 'CONFIRMED',
          updated_at: new Date()
        }])
      }));

      // Mock db.fn.now()
      db.fn = {
        now: jest.fn()
      } as any;
    });

    it('should update booking status successfully', async () => {
      // Execute the controller function
      await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      const dbInstance = db();
      expect(dbInstance.where).toHaveBeenCalledWith('id', 'booking-123');
      expect(dbInstance.update).toHaveBeenCalledWith({
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
      // Missing status in body
      mockRequest.body = {};

      // Execute and catch error
      try {
        await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Booking ID and status are required');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      }));

      // Execute and catch error
      try {
        await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
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
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'booking-123'
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'test-uuid',
          booking_id: 'booking-123',
          name: 'John Doe',
          phone: '1234567890',
          address: '123 Main St',
          city: 'Mumbai',
          pincode: '400001'
        }])
      }));

      // Mock transaction
      (db.transaction as jest.Mock) = jest.fn().mockImplementation(async (callback) => {
        return await callback(db);
      });

      // Mock db.fn.now()
      db.fn = {
        now: jest.fn()
      } as any;
    });

    it('should save delivery details successfully for a new record', async () => {
      // Mock that delivery details don't exist yet
      const dbInstance = db();
      (dbInstance.first as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123'
      }).mockResolvedValueOnce(null); // No existing delivery details

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(dbInstance.insert).toHaveBeenCalled();
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
      const dbInstance = db();
      (dbInstance.first as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123'
      }).mockResolvedValueOnce({
        id: 'existing-delivery-id',
        booking_id: 'booking-123'
      });

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      // Assertions
      expect(dbInstance.update).toHaveBeenCalled();
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
      // Missing required fields
      mockRequest.body = {
        booking_id: 'booking-123',
        // Missing other required fields
      };

      // Execute and catch error
      try {
        await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Missing required delivery details');
      }
    });

    it('should throw an error if booking does not exist', async () => {
      // Mock booking not found
      (db as jest.Mocked<typeof db>).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      }));

      // Execute and catch error
      try {
        await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);
        fail('Expected error was not thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Booking not found');
      }
    });
  });
});