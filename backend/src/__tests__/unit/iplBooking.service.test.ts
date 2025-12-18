import { IplBookingService } from '../../services/iplBooking.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock the global db instance to prevent setup.ts from connecting
jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    migrate: {
      latest: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    },
    destroy: jest.fn().mockResolvedValue(true),
  },
}));

// Mock Prisma Client and bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('@prisma/client', () => {
  const mPrismaClient: any = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ticketCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    seat: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookedSeat: {
      createMany: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    eventSummary: {
      updateMany: jest.fn(),
    }
  };
  
  // Add transaction separately to avoid circular reference in initializer
  mPrismaClient.$transaction = jest.fn((callback) => callback(mPrismaClient));

  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    BookingStatus: { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED' },
    SeatStatus: { AVAILABLE: 'AVAILABLE', BOOKED: 'BOOKED', CANCELLED: 'CANCELLED' },
    TicketStatus: { PENDING: 'PENDING', ACTIVE: 'ACTIVE', CANCELLED: 'CANCELLED' }
  };
});

describe('IplBookingService Unit Tests', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('createBooking', () => {
    const mockInput = {
      matchId: 'match-1',
      eventId: 'event-1',
      categoryId: 'cat-1',
      quantity: 2,
      userId: 'user-1'
    };
    
    const mockCategory = {
      id: 'cat-1',
      name: 'VIP',
      price: 1000,
      available: 10,
      totalSeats: 100,
      bookedSeats: 90,
      event: {
        id: 'event-1',
        title: 'Generic Event',
        startDate: new Date(),
        location: 'Generic Location',
        iplMatch: {
          homeTeam: { name: 'MI' },
          awayTeam: { name: 'CSK' },
          matchDate: new Date(),
          venue: { name: 'Wankhede' }
        }
      }
    };

    it('should create booking successfully for existing user', async () => {
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([{ id: 'seat-1' }, { id: 'seat-2' }]);
      (prisma.booking.create as jest.Mock).mockResolvedValue({ id: 'booking-1', status: 'PENDING' });

      const result = await IplBookingService.createBooking(mockInput);

      expect(prisma.ticketCategory.findUnique).toHaveBeenCalled();
      expect(prisma.seat.updateMany).toHaveBeenCalled(); // Should update status to BOOKED
      expect(prisma.bookedSeat.createMany).toHaveBeenCalled();
      expect(prisma.ticket.create).toHaveBeenCalledTimes(2);
      expect(result.bookingId).toBe('booking-1');
      expect(result.eventDetails.title).toContain('MI vs CSK');
    });

    it('should handle booking for event without IPL match link (fallback details)', async () => {
      const fallbackCategory = { ...mockCategory, event: { ...mockCategory.event, iplMatch: null } };
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(fallbackCategory);
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([{ id: 'seat-1' }, { id: 'seat-2' }]);
      (prisma.booking.create as jest.Mock).mockResolvedValue({ id: 'booking-1' });

      const result = await IplBookingService.createBooking(mockInput);
      expect(result.eventDetails.title).toBe('Generic Event');
    });
    
    it('should handle guest user creation', async () => {
      const guestInput = { ...mockInput, userId: undefined, guestDetails: { name: 'Guest', email: 'g@e.com', phone: '123' } };
      
      // Mock User findUnique -> null (user doesn't exist)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      // Mock User create
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new-guest-id' });
      
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]); // No specific seats found but flow continues if available count allows? Logic allows specific seats to be empty if just counting.
      (prisma.booking.create as jest.Mock).mockResolvedValue({ id: 'booking-1' });

      await IplBookingService.createBooking(guestInput);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'g@e.com',
        role: 'USER'
      }));
    });

    it('should use existing user if guest email matches', async () => {
       const guestInput = { ...mockInput, userId: undefined, guestDetails: { name: 'Guest', email: 'existing@e.com', phone: '123' } };
       (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });
       (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
       (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);
       (prisma.booking.create as jest.Mock).mockResolvedValue({ id: 'booking-1' });

       await IplBookingService.createBooking(guestInput);
       expect(prisma.user.create).not.toHaveBeenCalled();
       expect(prisma.booking.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'existing-id' }));
    });

    it('should throw error if neither userId nor guestDetails provided', async () => {
       await expect(IplBookingService.createBooking({ ...mockInput, userId: undefined, guestDetails: undefined }))
         .rejects.toThrow('User ID or guest details required');
    });

    it('should throw error if category or event not found', async () => {
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(IplBookingService.createBooking(mockInput))
        .rejects.toThrow('Invalid ticket category or event not found');
    });

    it('should throw error if requested quantity exceeds availability', async () => {
      const limitedCategory = { ...mockCategory, available: 1 };
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(limitedCategory);

      await expect(IplBookingService.createBooking(mockInput)) // requesting 2
        .rejects.toThrow(/Only 1 tickets available/);
    });

    it('should handle generic seat fallback when specific seats not found (tickets created with null seatId)', async () => {
       (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
       (prisma.seat.findMany as jest.Mock).mockResolvedValue([]); // No specific seats returned
       (prisma.booking.create as jest.Mock).mockResolvedValue({ id: 'booking-1' });

       await IplBookingService.createBooking(mockInput);

       expect(prisma.seat.updateMany).not.toHaveBeenCalled(); // No seats to update
       expect(prisma.bookedSeat.createMany).not.toHaveBeenCalled();
       // Tickets should be created with null seatId
       expect(prisma.ticket.create).toHaveBeenCalledWith(expect.objectContaining({
           data: expect.objectContaining({ seatId: null })
       }));
    });
  });

  describe('confirmBooking', () => {
    it('should update booking and tickets status', async () => {
      await IplBookingService.confirmBooking('booking-1');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: expect.objectContaining({ status: 'CONFIRMED' })
      });
      expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
        data: expect.objectContaining({ status: 'ACTIVE' })
      });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and release seats', async () => {
      // Mock Booking lookup
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: 'booking-1',
        quantity: 2,
        eventId: 'event-1',
        tickets: [{ ticketCategoryId: 'cat-1' }],
        bookedSeats: [{ seatId: 'seat-1' }, { seatId: 'seat-2' }]
      });

      await IplBookingService.cancelBooking('booking-1');

      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } })
      );
      expect(prisma.seat.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'AVAILABLE' } })
      );
      // Decrement booked, increment available
      expect(prisma.ticketCategory.update).toHaveBeenCalledWith(
          expect.objectContaining({ data: { bookedSeats: { decrement: 2 }, available: { increment: 2 } } })
      );
      expect(prisma.eventSummary.updateMany).toHaveBeenCalled();
    });

    it('should throw error if booking not found', async () => {
       (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);
       await expect(IplBookingService.cancelBooking('booking-x')).rejects.toThrow('Booking not found');
    });

    it('should handle cancellation without seats gracefully', async () => {
        (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
            id: 'booking-1',
            quantity: 2,
            eventId: 'event-1',
            tickets: [{ ticketCategoryId: 'cat-1' }],
            bookedSeats: [] // No seats mapped
        });

        await IplBookingService.cancelBooking('booking-1');
        expect(prisma.seat.updateMany).not.toHaveBeenCalled(); // Should not try to update empty list
        expect(prisma.ticketCategory.update).toHaveBeenCalled(); // Should still restore inventory counts
    });
  });
});