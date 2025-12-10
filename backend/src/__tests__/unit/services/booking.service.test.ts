import { bookingService } from '../../../../services/booking.service';
import { db } from '../../../../db';
import { ApiError } from '../../../../utils/apiError';

// Mock Knex
jest.mock('../../../../db', () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };
  
  const mockDb = jest.fn(() => mockQueryBuilder);
  
  return {
    db: mockDb
  };
});

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const mockEvent = { id: 'event-1', title: 'Test Event' };
      const mockBookingData = { event_id: 'event-1', user_id: 'user-1', quantity: 2 };
      const mockCreatedBooking = { id: 'booking-1', ...mockBookingData, status: 'PENDING' };

      // We need to customize the mock for this specific test to return different values
      // based on the table name
      (db as unknown as jest.Mock).mockImplementation((table) => {
        if (table === 'events') {
             return {
                 where: jest.fn().mockReturnThis(),
                 first: jest.fn().mockResolvedValue(mockEvent)
             };
        }
        if (table === 'bookings') {
             return {
                 insert: jest.fn().mockReturnThis(),
                 returning: jest.fn().mockResolvedValue([mockCreatedBooking])
             };
        }
        return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null)
        };
      });

      const result = await bookingService.createBooking(mockBookingData);
      expect(result).toEqual(mockCreatedBooking);
    });

     it('should throw error if event not found', async () => {
      const mockBookingData = { event_id: 'event-1', user_id: 'user-1', quantity: 2 };

       // Mock event check fail
      (db as unknown as jest.Mock).mockImplementation((table) => {
        if (table === 'events') {
             return {
                 where: jest.fn().mockReturnThis(),
                 first: jest.fn().mockResolvedValue(null)
             };
        }
        return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([])
        };
      });

      await expect(bookingService.createBooking(mockBookingData)).rejects.toThrow('Event not found');
    });
  });

  describe('getBookingById', () => {
      it('should return booking with delivery details', async () => {
          const mockBooking = { id: 'booking-1', status: 'PENDING' };
          const mockDelivery = { id: 'del-1', booking_id: 'booking-1', address: '123 St' };

          (db as unknown as jest.Mock).mockImplementation((table) => {
            if (table === 'bookings') {
                 return {
                     where: jest.fn().mockReturnThis(),
                     first: jest.fn().mockResolvedValue(mockBooking)
                 };
            }
            if (table === 'delivery_details') {
                 return {
                     where: jest.fn().mockReturnThis(),
                     first: jest.fn().mockResolvedValue(mockDelivery)
                 };
            }
            return {
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null)
            };
          });

          const result = await bookingService.getBookingById('booking-1');
          expect(result).toEqual({ ...mockBooking, deliveryDetails: mockDelivery });
      });
      
      it('should throw error if booking not found', async () => {
          (db as unknown as jest.Mock).mockImplementation((table) => {
            if (table === 'bookings') {
                 return {
                     where: jest.fn().mockReturnThis(),
                     first: jest.fn().mockResolvedValue(null)
                 };
            }
            return {
                 where: jest.fn().mockReturnThis(),
                 first: jest.fn().mockResolvedValue(null)
            };
          });

          await expect(bookingService.getBookingById('booking-1')).rejects.toThrow('Booking not found');
      });
  });
});
