import { LayoutService } from '../../services/layout.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    iplMatch: {
      findUnique: jest.fn(),
    },
    seat: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    SeatStatus: {
      AVAILABLE: 'AVAILABLE',
      BOOKED: 'BOOKED',
      LOCKED: 'LOCKED',
    }
  };
});

describe('LayoutService Unit Tests', () => {
  let prisma: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getMatchLayout', () => {
    const mockMatchId = 'match-123';
    
    it('should return valid match layout with stands and status', async () => {
      // Mock Data
      const mockDbResponse = {
        id: mockMatchId,
        event: {
          stadium: {
            id: 'stadium-1',
            name: 'Wankhede',
            svgViewBox: '0 0 1000 1000',
            stands: [
              { id: 'stand-1', name: 'North Stand', code: 'NORTH', svgPath: 'M0 0...' }
            ]
          },
          ticketCategories: [
            {
              stadiumStandId: 'stand-1',
              price: 500,
              available: 100,
              totalSeats: 200
            }
          ]
        }
      };

      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockDbResponse);

      const result = await LayoutService.getMatchLayout(mockMatchId);

      expect(prisma.iplMatch.findUnique).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        include: expect.any(Object)
      });
      
      expect(result.stadium.name).toBe('Wankhede');
      expect(result.stands).toHaveLength(1);
      expect(result.stands[0].status).toBe('AVAILABLE');
      expect(result.stands[0].minPrice).toBe(500);
    });

    it('should throw error if match or stadium not found', async () => {
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(LayoutService.getMatchLayout(mockMatchId))
        .rejects
        .toThrow('Match layout not found');
    });

    it('should set status to SOLD_OUT when available seats are 0', async () => {
       const mockDbResponse = {
        id: mockMatchId,
        event: {
          stadium: {
            id: 'stadium-1',
            name: 'Wankhede',
            svgViewBox: '0 0 1000 1000',
            stands: [{ id: 'stand-1', name: 'North Stand', code: 'NORTH', svgPath: 'path' }]
          },
          ticketCategories: [
            { stadiumStandId: 'stand-1', price: 500, available: 0, totalSeats: 200 }
          ]
        }
      };

      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockDbResponse);
      const result = await LayoutService.getMatchLayout(mockMatchId);
      expect(result.stands[0].status).toBe('SOLD_OUT');
    });
  });

  describe('getZoneSeats', () => {
    const mockMatchId = 'match-123';
    const mockZoneId = 'stand-1';

    it('should return list of seats for a zone', async () => {
      // 1. Mock Match lookup
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue({ eventId: 'event-1' });

      // 2. Mock Seat lookup
      const mockSeats = [
        {
          id: 'seat-1',
          status: 'AVAILABLE',
          price: 1000,
          seatLock: [],
          stadiumSeat: {
            seatNumber: 1,
            row: { label: 'A', sortOrder: 1 },
            sortOrder: 1,
            x: 10, y: 10
          }
        }
      ];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      const result = await LayoutService.getZoneSeats(mockMatchId, mockZoneId);

      expect(prisma.seat.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('AVAILABLE');
      expect(result[0].seatNumber).toBe('1');
    });

    it('should mark seat as LOCKED if active lock exists', async () => {
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue({ eventId: 'event-1' });

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockSeats = [
        {
          id: 'seat-1',
          status: 'AVAILABLE',
          price: 1000,
          seatLock: [{ expiresAt: futureDate }], // Active lock
          stadiumSeat: {
            seatNumber: 1,
            row: { label: 'A' }
          }
        }
      ];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      const result = await LayoutService.getZoneSeats(mockMatchId, mockZoneId);
      expect(result[0].status).toBe('LOCKED');
    });
  });
});
