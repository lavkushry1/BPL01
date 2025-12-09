import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
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
  let mockDbInstance: any;

  // Controller functions and dependencies
  let createBooking: any;
  let getBookingById: any;
  let saveDeliveryDetails: any;
  let updateBookingStatus: any;
  let db: any;
  let WebsocketService: any;

  beforeEach(async () => {
    // Reset modules to ensure fresh imports with mocks
    jest.resetModules();

    // Require dependencies after reset
    const dbModule = require('../../db');
    db = dbModule.db;

    const websocketModule = require('../../services/websocket.service');
    WebsocketService = websocketModule.WebsocketService;

    const bookingController = require('../../controllers/booking.controller');
    createBooking = bookingController.createBooking;
    getBookingById = bookingController.getBookingById;
    saveDeliveryDetails = bookingController.saveDeliveryDetails;
    updateBookingStatus = bookingController.updateBookingStatus;

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockRequest = {
      body: {},
      params: {},
      user: {
        id: '22222222-2222-2222-2222-222222222222',
        role: 'USER',
        name: 'Test User',
        email: 'test@example.com'
      }
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };

    mockNext = jest.fn();

    // Setup shared mock db instance
    mockDbInstance = {
      select: jest.fn().mockImplementation((...args) => {
        // If selecting seat status (seats query), return the seats
        // Seats query selects only 'id' and 'status'
        if (args.length === 2 && args.includes('status') && args.includes('id')) {
          return Promise.resolve([
            { id: '44444444-4444-4444-4444-444444444444', status: SeatStatus.AVAILABLE },
            { id: '55555555-5555-5555-5555-555555555555', status: SeatStatus.AVAILABLE }
          ]);
        }
        return mockDbInstance;
      }),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      first: (jest.fn() as any).mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        capacity: 100,
        booked_count: 50
      }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      increment: jest.fn().mockReturnThis(),
      forUpdate: jest.fn().mockReturnThis(),
      returning: (jest.fn() as any).mockResolvedValue([{
        id: 'test-uuid',
        event_id: '11111111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222',
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
          now: jest.fn().mockReturnValue(new Date('2023-01-01T00:00:00.000Z'))
        }
      });
      return await callback(trxMock);
    });

    // Mock db.fn
    (db as any).fn = {
      now: jest.fn().mockReturnValue(new Date('2023-01-01T00:00:00.000Z'))
    };
  });

  describe('createBooking', () => {
    beforeEach(() => {
      // Setup request body for booking creation
      mockRequest.body = {
        event_id: '11111111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222',
        seat_ids: ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'],
        amount: 1000,
        payment_method: 'UPI'
      };
    });

    it('should create a booking successfully', async () => {
      // Execute the controller function
      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify no error occurred
      expect(mockNext).not.toHaveBeenCalled();

      // Assertions
      expect(db.transaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking created successfully',
        data: expect.objectContaining({
          id: 'test-uuid',
          event_id: '11111111-1111-1111-1111-111111111111',
          status: 'PENDING'
        })
      }));
    });

    it('should update seat status when seat_ids are provided', async () => {
      // Execute the controller function
      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      // Assertions for seat updates
      expect(mockDbInstance.update).toHaveBeenCalledWith({
        status: SeatStatus.BOOKED,
        booking_id: 'test-uuid',
        updatedAt: expect.any(Date)
      });
      expect(mockDbInstance.whereIn).toHaveBeenCalledWith('id', ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']);
      expect(WebsocketService.notifySeatStatusChange).toHaveBeenCalledWith(
        ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'],
        SeatStatus.BOOKED
      );
    });

    it('should call next with error if required fields are missing', async () => {
      // Missing required fields
      mockRequest.body = {
        event_id: '11111111-1111-1111-1111-111111111111',
        // Missing user_id, amount, payment_method
      };

      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      // Expect ZodError (validation failed)
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.name).toBe('ZodError');
    });

    it('should call next with error if event does not exist', async () => {
      // Mock event not found
      mockDbInstance.first.mockResolvedValue(null);

      await createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: expect.stringContaining('Event not found')
      }));
    });
  });

  describe('getBookingById', () => {
    beforeEach(() => {
      // Setup request params
      mockRequest.params = {
        id: '33333333-3333-3333-3333-333333333333'
      };

      // Mock database response
      mockDbInstance.first.mockResolvedValue({
        id: '33333333-3333-3333-3333-333333333333',
        event_id: '11111111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222',
        amount: 1000,
        payment_method: 'upi',
        status: 'CONFIRMED'
      });
    });

    it('should retrieve a booking successfully', async () => {
      // Execute the controller function
      await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      // Assertions
      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking fetched successfully',
        data: expect.objectContaining({
          id: '33333333-3333-3333-3333-333333333333',
          status: 'CONFIRMED'
        })
      }));
    });

    it('should call next with error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      await getBookingById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: expect.stringContaining('Booking not found')
      }));
    });
  });

  describe('updateBookingStatus', () => {
    beforeEach(() => {
      // Setup request params and body
      mockRequest.params = {
        id: '33333333-3333-3333-3333-333333333333'
      };
      mockRequest.body = {
        status: 'CONFIRMED'
      };

      // Mock database responses
      mockDbInstance.first.mockResolvedValue({
        id: '33333333-3333-3333-3333-333333333333'
      });
      mockDbInstance.returning.mockResolvedValue([{
        id: '33333333-3333-3333-3333-333333333333',
        status: 'CONFIRMED',
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
      }]);
    });

    it('should update booking status successfully', async () => {
      // Execute the controller function
      await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      // Assertions
      expect(mockDbInstance.where).toHaveBeenCalledWith('id', '33333333-3333-3333-3333-333333333333');
      expect(mockDbInstance.update).toHaveBeenCalledWith({
        status: 'CONFIRMED',
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking status updated successfully',
        data: expect.objectContaining({
          id: '33333333-3333-3333-3333-333333333333',
          status: 'CONFIRMED'
        })
      }));
    });

    it('should call next with error if booking ID or status is missing', async () => {
      // Missing status
      mockRequest.body = {};

      await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Expect ZodError
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.name).toBe('ZodError');
    });

    it('should call next with error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      await updateBookingStatus(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: expect.stringContaining('Booking not found')
      }));
    });
  });

  describe('saveDeliveryDetails', () => {
    beforeEach(() => {
      // Setup request body
      mockRequest.body = {
        booking_id: '33333333-3333-3333-3333-333333333333',
        name: 'John Doe',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Mumbai',
        pincode: '400001'
      };

      // Mock database responses
      mockDbInstance.first.mockResolvedValue({
        id: '33333333-3333-3333-3333-333333333333'
      });
      mockDbInstance.returning.mockResolvedValue([{
        id: 'test-uuid',
        booking_id: '33333333-3333-3333-3333-333333333333',
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
        .mockImplementationOnce(() => {
          return Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' });
        })
        .mockImplementationOnce(() => {
          return Promise.resolve(null);
        });

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      // Assertions
      expect(mockDbInstance.insert).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Delivery details saved successfully',
        data: expect.objectContaining({
          id: 'test-uuid',
          booking_id: '33333333-3333-3333-3333-333333333333',
          name: 'John Doe'
        })
      }));
    });

    it('should update existing delivery details', async () => {
      // Mock that delivery details already exist
      mockDbInstance.first
        .mockResolvedValueOnce({ id: '33333333-3333-3333-3333-333333333333' }) // Booking exists
        .mockResolvedValueOnce({ id: 'existing-delivery-id', booking_id: '33333333-3333-3333-3333-333333333333' }); // Existing details

      // Execute the controller function
      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();

      // Assertions
      expect(mockDbInstance.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Delivery details saved successfully',
        data: expect.objectContaining({
          id: 'test-uuid',
          booking_id: '33333333-3333-3333-3333-333333333333'
        })
      }));
    });

    it('should call next with error if required fields are missing', async () => {
      // Missing required fields
      mockRequest.body = {
        booking_id: '33333333-3333-3333-3333-333333333333',
        // Missing other required fields
      };

      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      // Expect ZodError
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as any;
      expect(error.name).toBe('ZodError');
    });

    it('should call next with error if booking does not exist', async () => {
      // Mock booking not found
      mockDbInstance.first.mockResolvedValue(null);

      await saveDeliveryDetails(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: expect.stringContaining('Booking not found')
      }));
    });
  });
});
