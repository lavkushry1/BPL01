import { TicketService } from '../../../services/ticket.service';
import { db } from '../../../db';
import { WebsocketService } from '../../../services/websocket.service';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../../db');
jest.mock('../../../services/websocket.service');
jest.mock('uuid');

describe('TicketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock uuidv4 to return predictable values
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid');
  });

  describe('processTicketGenerationQueue', () => {
    it('should process due items in the ticket generation queue', async () => {
      // Setup mocks
      const mockQueueItems = [
        {
          id: 'queue-1',
          booking_id: 'booking-1',
          admin_id: 'admin-1',
          attempts: 0,
          max_attempts: 5,
          next_attempt_at: new Date(),
          status: 'pending'
        },
        {
          id: 'queue-2',
          booking_id: 'booking-2',
          admin_id: 'admin-1',
          attempts: 1,
          max_attempts: 5,
          next_attempt_at: new Date(),
          status: 'pending'
        }
      ];

      const mockTicketsGenerated = ['ticket-1', 'ticket-2', 'ticket-3'];

      // Mock db queries
      (db as jest.Mocked<any>).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockQueueItems),
        delete: jest.fn().mockResolvedValue(1)
      }));

      // Mock generateTicketsForBooking method
      const generateTicketsSpy = jest.spyOn(TicketService, 'generateTicketsForBooking')
        .mockImplementation(async (bookingId) => {
          if (bookingId === 'booking-1') {
            return mockTicketsGenerated;
          } else {
            throw new Error('Test error for booking-2');
          }
        });

      // Mock db for updating failed queue items
      (db as jest.Mocked<any>).mockImplementation((table: any) => {
        if (table === 'ticket_generation_queue') {
          return {
            where: jest.fn().mockReturnThis(),
            increment: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1)
          };
        }
        return {
          where: jest.fn().mockReturnThis(),
          whereRaw: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue(mockQueueItems)
        };
      });

      // Execute the method under test
      const result = await TicketService.processTicketGenerationQueue();

      // Assertions
      expect(result).toEqual({
        processed: 2,
        success: 1,
        failed: 1
      });

      // Verify generateTicketsForBooking was called for both bookings
      expect(generateTicketsSpy).toHaveBeenCalledTimes(2);
      expect(generateTicketsSpy).toHaveBeenCalledWith('booking-1', 'admin-1');
      expect(generateTicketsSpy).toHaveBeenCalledWith('booking-2', 'admin-1');

      // Verify WebsocketService was called for the failed booking
      expect(WebsocketService.sendToUser).toHaveBeenCalledWith(
        'admin-1', 
        'tickets_generation_failed',
        expect.any(Object)
      );
    });

    it('should handle empty queue gracefully', async () => {
      // Mock empty queue
      (db as jest.Mocked<any>).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([])
      }));

      const result = await TicketService.processTicketGenerationQueue();

      expect(result).toEqual({
        processed: 0,
        success: 0,
        failed: 0
      });
    });

    it('should handle errors during processing', async () => {
      // Mock db to throw error
      (db as jest.Mocked<any>).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        select: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        })
      }));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await TicketService.processTicketGenerationQueue();

      expect(result).toEqual({
        processed: 0,
        success: 0,
        failed: 0
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing ticket generation queue:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
}); 