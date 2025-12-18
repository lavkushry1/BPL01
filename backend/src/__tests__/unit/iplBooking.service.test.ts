import { IplBookingService } from '../../services/iplBooking.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client and bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    $transaction: jest.fn((callback) => callback(mPrismaClient)),
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
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    BookingStatus: { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED' },
    SeatStatus: { AVAILABLE: 'AVAILABLE', BOOKED: 'BOOKED' },
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

    it('should create booking successfully when seats are available', async () => {
      // 1. Mock Category & Event
      const mockCategory = {
        id: 'cat-1',
        price: 1000,
        available: 10,
        totalSeats: 100,
        bookedSeats: 90,
        event: {
          iplMatch: {
            homeTeam: { name: 'MI' },
            awayTeam: { name: 'CSK' },
            matchDate: new Date(),
            venue: { name: 'Wankhede' }
          }
        }
      };
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      // 2. Mock Available Seats
      const mockSeats = [{ id: 'seat-1' }, { id: 'seat-2' }];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      // 3. Mock Booking Creation
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: 'booking-1',
        status: 'PENDING'
      });

      const result = await IplBookingService.createBooking(mockInput);

      expect(prisma.ticketCategory.findUnique).toHaveBeenCalled();
      expect(prisma.seat.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 2
      }));
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(result.bookingId).toBe('booking-1');
      expect(result.totalAmount).toBe(2000);
    });

    it('should throw error if requested quantity exceeds availability', async () => {
      const mockCategory = {
        id: 'cat-1',
        price: 1000,
        available: 1, // Only 1 available
        totalSeats: 100,
        bookedSeats: 99,
        event: { iplMatch: {} }
      };
      (prisma.ticketCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      await expect(IplBookingService.createBooking(mockInput)) // requesting 2
        .rejects
        .toThrow(/Only 1 tickets available/);
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
      expect(prisma.ticketCategory.update).toHaveBeenCalled();
    });
  });
});
