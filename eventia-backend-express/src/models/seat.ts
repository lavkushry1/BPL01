import { z } from 'zod';
import { db } from '../db';

/**
 * Enum for seat status
 */
export enum SeatStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  RESERVED = 'reserved',
  UNAVAILABLE = 'unavailable'
}

/**
 * Seat interface representing a venue seat in the database
 */
export interface Seat {
  id: string;
  venue_id: string;
  section_id: string;
  row: string;
  number: string;
  status: SeatStatus;
  locked_by: string | null;
  lock_expires_at: Date | null;
  booking_id: string | null;
  price: number;
  category: string;
  created_at: Date;
  updated_at: Date;
}

// Zod schema for seat validation
export const SeatSchema = z.object({
  id: z.string().uuid().optional(),
  section_id: z.string().uuid(),
  row: z.string(),
  number: z.string(),
  price: z.number().positive(),
  status: z.enum([
    SeatStatus.AVAILABLE,
    SeatStatus.BOOKED,
    SeatStatus.LOCKED,
    SeatStatus.RESERVED,
    SeatStatus.UNAVAILABLE
  ]).default(SeatStatus.AVAILABLE),
  locked_by: z.string().uuid().nullable().optional(),
  lock_expires_at: z.date().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Schema for seat reservation
export const SeatReservationSchema = z.object({
  seat_ids: z.array(z.string().uuid()),
  user_id: z.string().uuid(),
  expiration: z.number().int().positive().optional().default(900) // Default 15 minutes
});

// Schema for updating seat status
export const SeatStatusUpdateSchema = z.object({
  status: z.enum([
    SeatStatus.AVAILABLE,
    SeatStatus.BOOKED,
    SeatStatus.LOCKED,
    SeatStatus.RESERVED,
    SeatStatus.UNAVAILABLE
  ]),
  locked_by: z.string().uuid().nullable().optional(),
  lock_expires_at: z.date().nullable().optional()
});

// Type definitions derived from Zod schemas
export type SeatReservation = z.infer<typeof SeatReservationSchema>;
export type SeatStatusUpdate = z.infer<typeof SeatStatusUpdateSchema>;

export class SeatModel {
  /**
   * Get all seats for a venue section
   */
  static async getBySection(sectionId: string): Promise<Seat[]> {
    return db('seats')
      .select('*')
      .where({ section_id: sectionId })
      .orderBy('row')
      .orderBy('number');
  }

  /**
   * Get seats by IDs
   */
  static async getByIds(seatIds: string[]): Promise<Seat[]> {
    return db('seats')
      .select('*')
      .whereIn('id', seatIds);
  }

  /**
   * Reserve seats temporarily
   * @returns Object containing success status, locked seats, and optional error message
   */
  static async reserveSeats(
    seatIds: string[],
    userId: string,
    expirationSeconds: number
  ): Promise<{ success: boolean; lockedSeats: string[]; unavailableSeats?: string[]; message?: string }> {
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);
    
    try {
      // Use transaction with row locking for atomicity
      const result = await db.transaction(async trx => {
        // First query seats with FOR UPDATE to lock the rows
        const seats = await trx('seats')
          .forUpdate() // This locks the rows
          .select('id', 'status', 'locked_by', 'lock_expires_at')
          .whereIn('id', seatIds);
        
        // Check if all requested seats exist
        if (seats.length !== seatIds.length) {
          return { 
            success: false, 
            lockedSeats: [],
            message: 'One or more seats not found' 
          };
        }
        
        // Check seat availability within the transaction
        const unavailableSeats = seats.filter(seat => {
          const isExpired = seat.lock_expires_at && new Date(seat.lock_expires_at) < new Date();
          return seat.status !== SeatStatus.AVAILABLE && !isExpired;
        });
        
        if (unavailableSeats.length > 0) {
          return { 
            success: false, 
            lockedSeats: [],
            unavailableSeats: unavailableSeats.map(s => s.id),
            message: 'One or more seats are not available'
          };
        }
        
        // Update the seats within the same transaction
        await trx('seats')
          .update({
            status: SeatStatus.LOCKED,
            locked_by: userId,
            lock_expires_at: expiresAt,
            updated_at: trx.fn.now()
          })
          .whereIn('id', seatIds);
        
        // Create a record in seat_reservations table
        const [reservation] = await trx('seat_reservations')
          .insert({
            id: db.raw('uuid_generate_v4()'),
            user_id: userId,
            seats: JSON.stringify(seatIds),
            status: 'pending',
            created_at: trx.fn.now(),
            expires_at: expiresAt
          })
          .returning('id');
        
        return { 
          success: true, 
          lockedSeats: seatIds,
          reservationId: reservation.id
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error reserving seats:', error);
      throw new Error('Failed to reserve seats due to database error');
    }
  }

  /**
   * Release seat reservation
   */
  static async releaseReservation(seatIds: string[], userId: string): Promise<void> {
    await db('seats')
      .update({
        status: SeatStatus.AVAILABLE,
        locked_by: null,
        lock_expires_at: null,
        updated_at: db.fn.now()
      })
      .whereIn('id', seatIds)
      .where({
        locked_by: userId,
        status: SeatStatus.LOCKED
      });
  }

  /**
   * Update seat status
   */
  static async updateStatus(
    seatId: string,
    update: SeatStatusUpdate
  ): Promise<Seat | null> {
    const { status, locked_by, lock_expires_at } = update;
    
    const result = await db('seats')
      .update({
        status,
        locked_by,
        lock_expires_at,
        updated_at: db.fn.now()
      })
      .where({ id: seatId })
      .returning('*');
    
    return result[0] || null;
  }

  /**
   * Automatically release expired seat reservations
   * This should be run by a cron job
   */
  static async releaseExpiredReservations(): Promise<number> {
    const result = await db('seats')
      .update({
        status: SeatStatus.AVAILABLE,
        locked_by: null,
        lock_expires_at: null,
        updated_at: db.fn.now()
      })
      .where({ status: SeatStatus.LOCKED })
      .where('lock_expires_at', '<', db.fn.now())
      .returning('id');
    
    return result.length;
  }
}