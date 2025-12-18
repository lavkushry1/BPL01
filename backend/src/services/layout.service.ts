import { PrismaClient, SeatStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface StandSummary {
  id: string; // standId
  name: string;
  code: string;
  svgPath: string; // The polygon
  minPrice: number | null;
  maxPrice: number | null;
  availableSeats: number;
  totalSeats: number;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'FAST_FILLING';
}

export interface SeatDetail {
  id: string;
  seatNumber: string; // Display number (e.g., "A-12")
  rowLabel: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'SELECTED'; // Frontend status
  price: number;
  type: string; // e.g., "STANDARD", "VIP"
  grid: {
    row: number; // Logical row index
    col: number; // Logical col index (or physical seat number)
    x?: number; // SVG x coordinate
    y?: number; // SVG y coordinate
  };
}

export class LayoutService {
  /**
   * Step 1: Get the Macro View (Stadium Layout)
   * Aggregates Pricing and Availability per Stand.
   */
  static async getMatchLayout(matchId: string): Promise<StandSummary[]> {
    // 1. Fetch Match and linked Event + Stadium
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      include: {
        event: {
          include: {
            stadium: {
              include: {
                stands: true
              }
            },
            ticketCategories: {
                where: { isDeleted: false }
            }
          }
        }
      }
    });

    if (!match || !match.event || !match.event.stadium) {
      throw new Error('Match layout not found (Missing Event or Stadium configuration)');
    }

    const { stands } = match.event.stadium;
    const { ticketCategories } = match.event;

    // 2. Build Summary per Stand
    const standSummaries: StandSummary[] = [];

    for (const stand of stands) {
      // Find categories linked to this stand
      // Logic: TicketCategory has stadiumStandId.
      const standCategories = ticketCategories.filter(
        tc => tc.stadiumStandId === stand.id
      );

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let availableSeats = 0;
      let totalSeats = 0;

      if (standCategories.length > 0) {
        for (const cat of standCategories) {
          const price = Number(cat.price);
          if (price < minPrice) minPrice = price;
          if (price > maxPrice) maxPrice = price;

          availableSeats += (cat.available ?? 0);
          totalSeats += cat.totalSeats;
        }
      } else {
        // Fallback: If no categories linked directly, maybe by name?
        // For now, assume strict linking. If no categories, stand is likely not open for this event.
         minPrice = 0;
         maxPrice = 0;
      }
      
      // Handle Infinity if no categories found
      if (minPrice === Infinity) minPrice = 0;
      if (maxPrice === -Infinity) maxPrice = 0;

      let status: StandSummary['status'] = 'AVAILABLE';
      if (availableSeats === 0 && totalSeats > 0) status = 'SOLD_OUT';
      else if (availableSeats < 20 && availableSeats > 0) status = 'FAST_FILLING';

      standSummaries.push({
        id: stand.id,
        name: stand.name,
        code: stand.code,
        svgPath: stand.svgPath, // This is crucial for the map
        minPrice: minPrice > 0 ? minPrice : null,
        maxPrice: maxPrice > 0 ? maxPrice : null,
        availableSeats,
        totalSeats,
        status
      });
    }

    return standSummaries;
  }

  /**
   * Step 2: Get the Micro View (Seats for a specific Stand)
   */
  static async getZoneSeats(matchId: string, zoneId: string): Promise<SeatDetail[]> {
    // 1. Fetch Match to get Event ID
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      select: { eventId: true }
    });

    if (!match || !match.eventId) {
      throw new Error('Match or Event not found');
    }

    // 2. Fetch Seats for this Event AND Stand
    // We need to filter by Stand.
    // Seat -> StadiumSeat -> StadiumRow -> StadiumStand.id == zoneId
    const seats = await prisma.seat.findMany({
      where: {
        eventId: match.eventId,
        stadiumSeat: {
            row: {
                standId: zoneId
            }
        },
        isDeleted: false
      },
      include: {
        stadiumSeat: {
          include: {
            row: true
          }
        },
        seatLock: true // Check for active locks
      }
    });

    // 3. Map to SeatDetail
    return seats.map(seat => {
      let status: SeatDetail['status'] = 'AVAILABLE';
      
      // Check locks first (Active locks override AVAILABLE status)
      // Check if lock is expired? Database query usually handles this or we check here.
      // We'll check expiration.
      const now = new Date();
      const isLocked = seat.seatLock.some(lock => lock.expiresAt > now);

      if (isLocked) {
        status = 'LOCKED';
      } else if (seat.status === SeatStatus.BOOKED || seat.status === SeatStatus.SOLD) {
        status = 'BOOKED';
      } else if (seat.status === SeatStatus.BLOCKED || seat.status === SeatStatus.MAINTENANCE) {
        status = 'BOOKED'; // Show as gray
      }

      // Determine price (Should be on Seat or linked TicketCategory)
      const price = seat.price ? Number(seat.price) : 0;

      return {
        id: seat.id,
        seatNumber: seat.stadiumSeat?.seatNumber.toString() || seat.seatNumber || '?',
        rowLabel: seat.stadiumSeat?.row.label || seat.row || '?',
        status,
        price,
        type: seat.type || 'STANDARD',
        grid: {
          row: seat.stadiumSeat?.row.sortOrder || 0, // Use row sort order as logical row index
          col: seat.stadiumSeat?.sortOrder || seat.stadiumSeat?.seatNumber || 0,
          x: seat.stadiumSeat?.x || 0,
          y: seat.stadiumSeat?.y || 0
        }
      };
    });
  }
}
