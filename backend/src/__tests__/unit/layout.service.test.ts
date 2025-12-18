import { LayoutService } from '../../services/layout.service';
import { PrismaClient } from '@prisma/client';

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
      SOLD: 'SOLD',
      BLOCKED: 'BLOCKED',
      MAINTENANCE: 'MAINTENANCE'
    }
  };
});

describe('LayoutService Unit Tests', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getMatchLayout', () => {
    const mockMatchId = 'match-123';
    
    const baseMatchData = {
      id: mockMatchId,
      event: {
        stadium: {
          id: 'stadium-1',
          name: 'Wankhede',
          svgViewBox: '0 0 1000 1000',
          stands: [
            { id: 'stand-1', name: 'North Stand', code: 'NORTH', svgPath: 'path1' },
            { id: 'stand-2', name: 'South Stand', code: 'SOUTH', svgPath: 'path2' }
          ]
        },
        ticketCategories: [] as any[]
      }
    };

    it('should return valid match layout with stands and status', async () => {
      const mockData = JSON.parse(JSON.stringify(baseMatchData));
      mockData.event.ticketCategories = [
        { stadiumStandId: 'stand-1', price: 500, available: 100, totalSeats: 200 }
      ];

      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockData);

      const result = await LayoutService.getMatchLayout(mockMatchId);

      expect(prisma.iplMatch.findUnique).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        include: expect.any(Object)
      });
      
      expect(result.stadium.name).toBe('Wankhede');
      expect(result.stands).toHaveLength(2);
      expect(result.stands[0].status).toBe('AVAILABLE');
      expect(result.stands[0].minPrice).toBe(500);
    });

    it('should throw error if match or stadium not found', async () => {
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(LayoutService.getMatchLayout(mockMatchId))
        .rejects
        .toThrow('Match layout not found');
    });

    it('should throw error if match found but no event or stadium', async () => {
       (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue({ id: mockMatchId, event: null });
       await expect(LayoutService.getMatchLayout(mockMatchId))
        .rejects
        .toThrow('Match layout not found');
    });

    it('should set status to SOLD_OUT when available seats are 0', async () => {
       const mockData = JSON.parse(JSON.stringify(baseMatchData));
       mockData.event.ticketCategories = [
         { stadiumStandId: 'stand-1', price: 500, available: 0, totalSeats: 200 }
       ];

      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockData);
      const result = await LayoutService.getMatchLayout(mockMatchId);
      expect(result.stands[0].status).toBe('SOLD_OUT');
    });

    it('should set status to FAST_FILLING when available seats are < 20', async () => {
      const mockData = JSON.parse(JSON.stringify(baseMatchData));
      mockData.event.ticketCategories = [
        { stadiumStandId: 'stand-1', price: 500, available: 19, totalSeats: 200 }
      ];

     (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockData);
     const result = await LayoutService.getMatchLayout(mockMatchId);
     expect(result.stands[0].status).toBe('FAST_FILLING');
   });

   it('should handle multiple categories for same stand (aggregating price and availability)', async () => {
    const mockData = JSON.parse(JSON.stringify(baseMatchData));
    mockData.event.ticketCategories = [
      { stadiumStandId: 'stand-1', price: 500, available: 50, totalSeats: 100 },
      { stadiumStandId: 'stand-1', price: 1000, available: 50, totalSeats: 100 }
    ];

    (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockData);
    const result = await LayoutService.getMatchLayout(mockMatchId);
    
    expect(result.stands[0].availableSeats).toBe(100);
    expect(result.stands[0].minPrice).toBe(500);
    expect(result.stands[0].maxPrice).toBe(1000);
  });

   it('should handle stands with no categories gracefully', async () => {
    const mockData = JSON.parse(JSON.stringify(baseMatchData));
    mockData.event.ticketCategories = []; // No categories

    (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(mockData);
    const result = await LayoutService.getMatchLayout(mockMatchId);
    
    // Fallback logic check
    expect(result.stands[0].minPrice).toBeNull();
    expect(result.stands[0].maxPrice).toBeNull();
    expect(result.stands[0].availableSeats).toBe(0);
  });
  });

  describe('getZoneSeats', () => {
    const mockMatchId = 'match-123';
    const mockZoneId = 'stand-1';

    it('should throw error if match not found', async () => {
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(LayoutService.getZoneSeats(mockMatchId, mockZoneId))
        .rejects
        .toThrow('Match or Event not found');
    });

    it('should return list of seats for a zone with correct properties', async () => {
      // 1. Mock Match lookup
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue({ eventId: 'event-1' });

      // 2. Mock Seat lookup
      const mockSeats = [
        {
          id: 'seat-1',
          status: 'AVAILABLE',
          price: 1000,
          seatLock: [],
          type: 'VIP',
          stadiumSeat: {
            seatNumber: 1,
            row: { label: 'A', sortOrder: 1 },
            sortOrder: 1,
            x: 10, y: 10
          }
        },
        {
          id: 'seat-fallback',
          status: 'AVAILABLE',
          price: null, // Fallback price check
          seatLock: [],
          type: null, // Fallback type check
          seatNumber: '2', // Fallback seat number
          row: 'B', // Fallback row
          stadiumSeat: null // No stadium seat link
        }
      ];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      const result = await LayoutService.getZoneSeats(mockMatchId, mockZoneId);

      expect(prisma.seat.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      
      // Standard seat
      expect(result[0].status).toBe('AVAILABLE');
      expect(result[0].seatNumber).toBe('1');
      expect(result[0].type).toBe('VIP');
      
      // Fallback seat
      expect(result[1].price).toBe(0);
      expect(result[1].type).toBe('STANDARD');
      expect(result[1].seatNumber).toBe('2');
      expect(result[1].rowLabel).toBe('B');
      expect(result[1].grid.row).toBe(0);
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
          stadiumSeat: { seatNumber: 1, row: { label: 'A' } }
        }
      ];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      const result = await LayoutService.getZoneSeats(mockMatchId, mockZoneId);
      expect(result[0].status).toBe('LOCKED');
    });

    it('should map various database statuses to frontend statuses', async () => {
      (prisma.iplMatch.findUnique as jest.Mock).mockResolvedValue({ eventId: 'event-1' });
      
      const statuses = ['SOLD', 'BLOCKED', 'MAINTENANCE'];
      const mockSeats = statuses.map((status, index) => ({
        id: `seat-${index}`,
        status: status,
        seatLock: [],
        stadiumSeat: { seatNumber: index, row: { label: 'A' } }
      }));

      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      const result = await LayoutService.getZoneSeats(mockMatchId, mockZoneId);
      
      result.forEach(seat => {
        expect(seat.status).toBe('BOOKED');
      });
    });
  });
});