import { db } from '../db';
import { Seat, SeatStatus } from '../models/seat';
import { WebsocketService } from './websocket.service';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/apiError';

/**
 * Service for seat-related operations
 */
export class SeatService {
  /**
   * Check availability of seats in bulk
   * @param seatIds Array of seat IDs to check
   * @param eventId Event ID
   * @returns Result object with availability information
   */
  static async checkBulkAvailability(
    seatIds: string[],
    eventId: string
  ): Promise<{
    complete: boolean;
    message?: string;
    available: string[];
    unavailable: {
      id: string;
      status: string;
      lockedUntil?: string;
    }[];
    event_id: string;
  }> {
    try {
      // Verify the event exists
      const event = await db('events').where('id', eventId).first();
      if (!event) {
        return {
          complete: false,
          message: 'Event not found',
          available: [],
          unavailable: [],
          event_id: eventId
        };
      }

      // Get the seats
      const seats = await db('seats')
        .whereIn('id', seatIds)
        .select('id', 'status', 'locked_by', 'lock_expires_at');

      // Check if all requested seats exist
      if (seats.length !== seatIds.length) {
        return {
          complete: false,
          message: 'One or more seats not found',
          available: [],
          unavailable: [],
          event_id: eventId
        };
      }

      const now = new Date();
      const available: string[] = [];
      const unavailable: { id: string; status: string; lockedUntil?: string }[] = [];

      // Check each seat's availability
      seats.forEach(seat => {
        if (seat.status === SeatStatus.AVAILABLE) {
          available.push(seat.id);
        } else if (
          seat.status === SeatStatus.LOCKED &&
          seat.lock_expires_at &&
          new Date(seat.lock_expires_at) < now
        ) {
          // Seat lock has expired, consider it available
          available.push(seat.id);
        } else {
          const unavailableInfo: { id: string; status: string; lockedUntil?: string } = {
            id: seat.id,
            status: seat.status
          };

          if (seat.status === SeatStatus.LOCKED && seat.lock_expires_at) {
            unavailableInfo.lockedUntil = new Date(seat.lock_expires_at).toISOString();
          }

          unavailable.push(unavailableInfo);
        }
      });

      return {
        complete: true,
        available,
        unavailable,
        event_id: eventId
      };
    } catch (error) {
      console.error('Error checking seat availability:', error);
      return {
        complete: false,
        message: 'Error checking seat availability',
        available: [],
        unavailable: [],
        event_id: eventId
      };
    }
  }

  /**
   * Lock seats for a user
   * @param seatIds Array of seat IDs to lock
   * @param userId User ID
   * @param eventId Event ID
   * @param lockDuration Lock duration in seconds (default: 15 minutes)
   * @returns Result of the operation
   */
  static async lockSeats(
    seatIds: string[],
    userId: string,
    eventId: string,
    lockDuration = 900
  ): Promise<{
    success: boolean;
    message?: string;
    lockedSeats?: string[];
    expiresAt?: Date;
  }> {
    try {
      // Check seat availability first
      const availabilityCheck = await this.checkBulkAvailability(seatIds, eventId);
      
      if (!availabilityCheck.complete) {
        return {
          success: false,
          message: availabilityCheck.message || 'Error checking seat availability'
        };
      }

      // If any seats are unavailable, return error
      if (availabilityCheck.unavailable.length > 0) {
        return {
          success: false,
          message: 'One or more seats are not available'
        };
      }

      // Set lock expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + lockDuration);

      // Lock the seats in a transaction
      await db.transaction(async trx => {
        // Update seat status to LOCKED
        await trx('seats')
          .whereIn('id', seatIds)
          .update({
            status: SeatStatus.LOCKED,
            locked_by: userId,
            lock_expires_at: expiresAt
          });

        // Create or update seat lock records
        for (const seatId of seatIds) {
          await trx('seat_locks')
            .insert({
              id: uuidv4(),
              seat_id: seatId,
              user_id: userId,
              event_id: eventId,
              expires_at: expiresAt
            })
            .onConflict(['seat_id', 'user_id'])
            .merge({
              expires_at: expiresAt
            });
        }
      });

      // Notify via WebSocket
      WebsocketService.broadcastSeatUpdate(eventId, seatIds, SeatStatus.LOCKED, userId);

      return {
        success: true,
        lockedSeats: seatIds,
        expiresAt
      };
    } catch (error) {
      console.error('Error locking seats:', error);
      return {
        success: false,
        message: 'Error locking seats'
      };
    }
  }

  /**
   * Unlock seats for a user
   * @param seatIds Array of seat IDs to unlock
   * @param userId User ID
   * @returns Result of the operation
   */
  static async unlockSeats(
    seatIds: string[],
    userId: string
  ): Promise<{
    success: boolean;
    message?: string;
    unlockedSeats?: string[];
  }> {
    try {
      // Verify that the user has locked these seats
      const seats = await db('seats')
        .whereIn('id', seatIds)
        .where('locked_by', userId)
        .select('id');

      if (seats.length !== seatIds.length) {
        return {
          success: false,
          message: 'User does not have permission to unlock all these seats'
        };
      }

      // Get event ID for WebSocket notification
      const seatLock = await db('seat_locks')
        .whereIn('seat_id', seatIds)
        .where('user_id', userId)
        .select('event_id')
        .first();

      // Unlock the seats in a transaction
      await db.transaction(async trx => {
        // Update seat status to AVAILABLE
        await trx('seats')
          .whereIn('id', seatIds)
          .where('locked_by', userId)
          .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null
          });

        // Remove seat lock records
        await trx('seat_locks')
          .whereIn('seat_id', seatIds)
          .where('user_id', userId)
          .delete();
      });

      // Notify via WebSocket
      if (seatLock?.event_id) {
        WebsocketService.broadcastSeatUpdate(seatLock.event_id, seatIds, SeatStatus.AVAILABLE);
      }

      return {
        success: true,
        unlockedSeats: seatIds
      };
    } catch (error) {
      console.error('Error unlocking seats:', error);
      return {
        success: false,
        message: 'Error unlocking seats'
      };
    }
  }

  /**
   * Book seats permanently for a booking
   * @param seatIds Array of seat IDs to book
   * @param bookingId Booking ID
   * @returns Result of the operation
   */
  static async bookSeats(
    seatIds: string[],
    bookingId: string
  ): Promise<{
    success: boolean;
    message?: string;
    bookedSeats?: string[];
  }> {
    try {
      // Get the booking to retrieve the event ID
      const booking = await db('bookings')
        .where('id', bookingId)
        .select('event_id')
        .first();

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found'
        };
      }

      // Update seats to booked status
      const updatedCount = await db('seats')
        .whereIn('id', seatIds)
        .whereNot('status', SeatStatus.BOOKED) // Don't update already booked seats
        .update({
          status: SeatStatus.BOOKED,
          booking_id: bookingId,
          locked_by: null,
          lock_expires_at: null
        });

      if (updatedCount !== seatIds.length) {
        // Some seats couldn't be booked, likely because they were already booked
        // In a real implementation, we might want to roll back the transaction
        return {
          success: false,
          message: 'Not all seats could be booked'
        };
      }

      // Remove any lock records
      await db('seat_locks')
        .whereIn('seat_id', seatIds)
        .delete();

      // Notify via WebSocket
      WebsocketService.broadcastSeatUpdate(booking.event_id, seatIds, SeatStatus.BOOKED);

      return {
        success: true,
        bookedSeats: seatIds
      };
    } catch (error) {
      console.error('Error booking seats:', error);
      return {
        success: false,
        message: 'Error booking seats'
      };
    }
  }

  /**
   * Release booked seats
   * @param seatIds Array of seat IDs to release
   * @param bookingId Booking ID
   * @returns Result of the operation
   */
  static async releaseBookedSeats(
    seatIds: string[],
    bookingId: string
  ): Promise<{
    success: boolean;
    message?: string;
    releasedSeats?: string[];
  }> {
    try {
      // Get the booking to retrieve the event ID
      const booking = await db('bookings')
        .where('id', bookingId)
        .select('event_id')
        .first();

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found'
        };
      }

      // Verify that these seats belong to the booking
      const seats = await db('seats')
        .whereIn('id', seatIds)
        .where('booking_id', bookingId)
        .select('id');

      if (seats.length !== seatIds.length) {
        return {
          success: false,
          message: 'Not all seats belong to this booking'
        };
      }

      // Update seats to available
      await db('seats')
        .whereIn('id', seatIds)
        .where('booking_id', bookingId)
        .update({
          status: SeatStatus.AVAILABLE,
          booking_id: null
        });

      // Notify via WebSocket
      WebsocketService.broadcastSeatUpdate(booking.event_id, seatIds, SeatStatus.AVAILABLE);

      return {
        success: true,
        releasedSeats: seatIds
      };
    } catch (error) {
      console.error('Error releasing booked seats:', error);
      return {
        success: false,
        message: 'Error releasing booked seats'
      };
    }
  }

  /**
   * Clean up expired seat locks
   * This could be called by a scheduled job
   * @returns Number of released seats
   */
  static async releaseExpiredLocks(): Promise<number> {
    try {
      const now = new Date();
      
      // Find expired locks
      const expiredLocks = await db('seats')
        .where('status', SeatStatus.LOCKED)
        .where('lock_expires_at', '<', now)
        .select('id', 'locked_by');
      
      const expiredSeatIds = expiredLocks.map(lock => lock.id);
      
      if (expiredSeatIds.length === 0) {
        return 0;
      }
      
      // Group by user for WebSocket notifications
      const seatsByUser: { [userId: string]: string[] } = {};
      expiredLocks.forEach(lock => {
        if (!lock.locked_by) return;
        
        if (!seatsByUser[lock.locked_by]) {
          seatsByUser[lock.locked_by] = [];
        }
        seatsByUser[lock.locked_by].push(lock.id);
      });
      
      // Get event IDs for WebSocket notifications
      const seatLocks = await db('seat_locks')
        .whereIn('seat_id', expiredSeatIds)
        .select('seat_id', 'event_id');
      
      const seatToEventMap: { [seatId: string]: string } = {};
      seatLocks.forEach(lock => {
        seatToEventMap[lock.seat_id] = lock.event_id;
      });
      
      // Release the locks
      await db.transaction(async trx => {
        // Update seats
        await trx('seats')
          .whereIn('id', expiredSeatIds)
          .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null
          });
        
        // Delete lock records
        await trx('seat_locks')
          .whereIn('seat_id', expiredSeatIds)
          .delete();
      });
      
      // Group seats by event ID for WebSocket notifications
      const seatsByEvent: { [eventId: string]: string[] } = {};
      expiredSeatIds.forEach(seatId => {
        const eventId = seatToEventMap[seatId];
        if (!eventId) return;
        
        if (!seatsByEvent[eventId]) {
          seatsByEvent[eventId] = [];
        }
        seatsByEvent[eventId].push(seatId);
      });
      
      // Send WebSocket notifications
      Object.entries(seatsByEvent).forEach(([eventId, seats]) => {
        WebsocketService.broadcastSeatUpdate(eventId, seats, SeatStatus.AVAILABLE);
      });
      
      // Notify users that their locks have expired
      Object.entries(seatsByUser).forEach(([userId, seats]) => {
        WebsocketService.sendToUser(userId, 'seat_lock_expired', {
          seat_ids: seats,
          message: 'Your seat locks have expired'
        });
      });
      
      return expiredSeatIds.length;
    } catch (error) {
      console.error('Error releasing expired locks:', error);
      return 0;
    }
  }

  /**
   * Get seat status
   * @param seatId Seat ID
   * @returns Seat status information
   */
  static async getSeatStatus(seatId: string): Promise<{
    status: SeatStatus;
    lockedBy?: string;
    lockExpiresAt?: Date;
    bookingId?: string;
  } | null> {
    try {
      const seat = await db('seats')
        .where('id', seatId)
        .select('status', 'locked_by', 'lock_expires_at', 'booking_id')
        .first();
      
      if (!seat) {
        return null;
      }
      
      return {
        status: seat.status as SeatStatus,
        lockedBy: seat.locked_by,
        lockExpiresAt: seat.lock_expires_at ? new Date(seat.lock_expires_at) : undefined,
        bookingId: seat.booking_id
      };
    } catch (error) {
      console.error('Error getting seat status:', error);
      throw new ApiError(500, 'Error getting seat status');
    }
  }

  /**
   * Schedule a seat reservation to expire after a certain time
   * This is a more reliable replacement for setTimeout directly in the controller
   * 
   * @param reservationId The ID of the reservation to expire
   * @param seatIds Array of seat IDs in the reservation
   * @param userId User ID who made the reservation
   * @param expirationSeconds Expiration time in seconds
   */
  static async scheduleReservationExpiry(
    reservationId: string,
    seatIds: string[],
    userId: string,
    expirationSeconds: number
  ): Promise<void> {
    try {
      // Instead of using setTimeout directly, which doesn't survive server restarts,
      // we'll use a more resilient approach
      
      // Create an entry in a dedicated expiration queue table
      // This table would be processed by a background job (cron)
      await db('reservation_expiry_queue').insert({
        id: uuidv4(),
        reservation_id: reservationId,
        seat_ids: JSON.stringify(seatIds),
        user_id: userId,
        expires_at: new Date(Date.now() + expirationSeconds * 1000),
        created_at: new Date()
      });
      
      // We still set up a setTimeout as a fallback mechanism
      // for immediate processing if the server stays up
      setTimeout(async () => {
        try {
          // Check if reservation is still pending
          const reservation = await db('seat_reservations')
            .where('id', reservationId)
            .where('status', 'pending')
            .first();
          
          if (reservation) {
            // Use a retry mechanism for better reliability
            await this.releaseReservation(reservationId, seatIds, userId);
          }
        } catch (error) {
          console.error('Error in reservation expiry timeout handler:', error);
          // The cron job will catch this if it fails
        }
      }, expirationSeconds * 1000);
    } catch (error) {
      console.error('Error scheduling reservation expiry:', error);
      throw new ApiError(500, 'Failed to schedule reservation expiry');
    }
  }
  
  /**
   * Release a specific reservation
   * Used by both manual release and automatic expiration
   * 
   * @param reservationId Reservation ID
   * @param seatIds Seat IDs to release
   * @param userId User ID who made the reservation
   */
  static async releaseReservation(
    reservationId: string,
    seatIds: string[],
    userId: string
  ): Promise<boolean> {
    try {
      // Get event ID for WebSocket notification
      const seatLock = await db('seat_locks')
        .whereIn('seat_id', seatIds)
        .where('user_id', userId)
        .select('event_id')
        .first();
      
      // Use transaction to ensure atomicity
      await db.transaction(async trx => {
        // Release the seats
        await trx('seats')
          .whereIn('id', seatIds)
          .where('locked_by', userId)
          .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null
          });
        
        // Update reservation status
        await trx('seat_reservations')
          .where('id', reservationId)
          .where('status', 'pending')
          .update({ 
            status: 'expired',
            updated_at: trx.fn.now()
          });
        
        // Remove from expiry queue
        await trx('reservation_expiry_queue')
          .where('reservation_id', reservationId)
          .delete();
      });
      
      // Notify via WebSocket
      if (seatLock?.event_id) {
        WebsocketService.broadcastSeatUpdate(seatLock.event_id, seatIds, SeatStatus.AVAILABLE);
      }
      
      // Notify the user that their reservation expired
      WebsocketService.sendToUser(userId, 'reservation_expired', {
        reservation_id: reservationId,
        seat_ids: seatIds,
        message: 'Your seat reservation has expired'
      });
      
      return true;
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return false;
    }
  }
  
  /**
   * Process expired reservations
   * This should be called by a cron job regularly
   */
  static async processExpiredReservations(): Promise<number> {
    try {
      const now = new Date();
      
      // Find expired reservations in the queue
      const expiredReservations = await db('reservation_expiry_queue')
        .where('expires_at', '<', now)
        .select('*');
      
      if (expiredReservations.length === 0) {
        return 0;
      }
      
      let releasedCount = 0;
      
      // Process each expired reservation
      for (const reservation of expiredReservations) {
        try {
          const seatIds = JSON.parse(reservation.seat_ids);
          const success = await this.releaseReservation(
            reservation.reservation_id,
            seatIds,
            reservation.user_id
          );
          
          if (success) {
            releasedCount++;
          }
        } catch (error) {
          console.error(`Error processing expired reservation ${reservation.id}:`, error);
        }
      }
      
      return releasedCount;
    } catch (error) {
      console.error('Error processing expired reservations:', error);
      return 0;
    }
  }
}