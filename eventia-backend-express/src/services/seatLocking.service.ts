import { CacheService } from './cacheService';
import { logger } from '../utils/logger';

/**
 * Service for managing seat locking with Redis
 * Provides concurrency control for seat selection during booking process
 */
export class SeatLockingService {
  private static cacheService = new CacheService();
  private static readonly LOCK_EXPIRY = 10 * 60; // 10 minutes in seconds
  private static readonly PREFIX = 'seat_lock:';

  /**
   * Lock seats for a user during booking process
   * @param seatIds Array of seat IDs to lock
   * @param userId User ID who is locking the seats
   * @param eventId Event ID the seats belong to
   * @param duration Lock duration in seconds (default: 10 minutes)
   * @returns Object with success status and message
   */
  static async lockSeats(
    seatIds: string[],
    userId: string,
    eventId: string,
    duration: number = this.LOCK_EXPIRY
  ): Promise<{ success: boolean; message: string; lockedSeats?: string[] }> {
    try {
      if (!seatIds || seatIds.length === 0) {
        return { success: false, message: 'No seats provided for locking' };
      }

      const lockedSeats: string[] = [];
      const failedSeats: string[] = [];

      // Check if any seats are already locked by someone else
      for (const seatId of seatIds) {
        const key = this.getLockKey(eventId, seatId);
        const existingLock = await this.cacheService.get(key);

        if (existingLock && existingLock !== userId) {
          // Seat is locked by another user
          failedSeats.push(seatId);
        } else {
          lockedSeats.push(seatId);
        }
      }

      if (failedSeats.length > 0) {
        // Release any locks we might have acquired in this process
        await this.releaseSeats(lockedSeats, userId, eventId);
        
        return {
          success: false,
          message: `Some seats are already locked: ${failedSeats.join(', ')}`
        };
      }

      // Lock all seats for the user
      for (const seatId of seatIds) {
        const key = this.getLockKey(eventId, seatId);
        await this.cacheService.set(key, userId, duration);
      }

      return {
        success: true,
        message: `Successfully locked ${seatIds.length} seats for ${duration} seconds`,
        lockedSeats: seatIds
      };
    } catch (error) {
      logger.error('Error locking seats', { error, seatIds, userId, eventId });
      return { success: false, message: 'Failed to lock seats due to server error' };
    }
  }

  /**
   * Release locked seats
   * @param seatIds Array of seat IDs to release
   * @param userId User ID who locked the seats
   * @param eventId Event ID the seats belong to
   * @returns Object with success status and message
   */
  static async releaseSeats(
    seatIds: string[],
    userId: string,
    eventId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!seatIds || seatIds.length === 0) {
        return { success: false, message: 'No seats provided for release' };
      }

      const failedSeats: string[] = [];

      for (const seatId of seatIds) {
        const key = this.getLockKey(eventId, seatId);
        const existingLock = await this.cacheService.get(key);

        // Only allow the user who locked the seat to release it
        if (existingLock && existingLock === userId) {
          await this.cacheService.del(key);
        } else if (existingLock) {
          failedSeats.push(seatId);
        }
      }

      if (failedSeats.length > 0) {
        return {
          success: false,
          message: `Failed to release some seats: ${failedSeats.join(', ')}`
        };
      }

      return {
        success: true,
        message: `Successfully released ${seatIds.length} seats`
      };
    } catch (error) {
      logger.error('Error releasing seats', { error, seatIds, userId, eventId });
      return { success: false, message: 'Failed to release seats due to server error' };
    }
  }

  /**
   * Check if seats are locked
   * @param seatIds Array of seat IDs to check
   * @param eventId Event ID the seats belong to
   * @returns Object with locked status and locked seat IDs
   */
  static async checkSeatsLocked(
    seatIds: string[],
    eventId: string
  ): Promise<{ anyLocked: boolean; lockedSeats: string[]; lockedBy: Record<string, string> }> {
    try {
      const lockedSeats: string[] = [];
      const lockedBy: Record<string, string> = {};

      for (const seatId of seatIds) {
        const key = this.getLockKey(eventId, seatId);
        const lockOwner = await this.cacheService.get(key);

        if (lockOwner) {
          lockedSeats.push(seatId);
          lockedBy[seatId] = lockOwner;
        }
      }

      return {
        anyLocked: lockedSeats.length > 0,
        lockedSeats,
        lockedBy
      };
    } catch (error) {
      logger.error('Error checking seat locks', { error, seatIds, eventId });
      return { anyLocked: false, lockedSeats: [], lockedBy: {} };
    }
  }

  /**
   * Extend lock duration for seats
   * @param seatIds Array of seat IDs to extend lock for
   * @param userId User ID who locked the seats
   * @param eventId Event ID the seats belong to
   * @param duration New lock duration in seconds
   * @returns Object with success status and message
   */
  static async extendLock(
    seatIds: string[],
    userId: string,
    eventId: string,
    duration: number = this.LOCK_EXPIRY
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!seatIds || seatIds.length === 0) {
        return { success: false, message: 'No seats provided for lock extension' };
      }

      const failedSeats: string[] = [];

      for (const seatId of seatIds) {
        const key = this.getLockKey(eventId, seatId);
        const existingLock = await this.cacheService.get(key);

        // Only allow the user who locked the seat to extend it
        if (existingLock && existingLock === userId) {
          await this.cacheService.set(key, userId, duration);
        } else {
          failedSeats.push(seatId);
        }
      }

      if (failedSeats.length > 0) {
        return {
          success: false,
          message: `Failed to extend lock for some seats: ${failedSeats.join(', ')}`
        };
      }

      return {
        success: true,
        message: `Successfully extended lock for ${seatIds.length} seats for ${duration} seconds`
      };
    } catch (error) {
      logger.error('Error extending seat locks', { error, seatIds, userId, eventId });
      return { success: false, message: 'Failed to extend seat locks due to server error' };
    }
  }

  /**
   * Convert locked seats to confirmed bookings
   * @param seatIds Array of seat IDs to confirm
   * @param userId User ID who locked the seats
   * @param eventId Event ID the seats belong to
   * @param bookingId Booking ID to associate with the seats
   * @returns Object with success status and message
   */
  static async confirmSeats(
    seatIds: string[],
    userId: string,
    eventId: string,
    bookingId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First check if all seats are locked by this user
      const lockStatus = await this.checkSeatsLocked(seatIds, eventId);
      
      const notLockedByUser = seatIds.filter(seatId => {
        return !lockStatus.lockedBy[seatId] || lockStatus.lockedBy[seatId] !== userId;
      });
      
      if (notLockedByUser.length > 0) {
        return {
          success: false,
          message: `Some seats are not locked by this user: ${notLockedByUser.join(', ')}`
        };
      }
      
      // Release the locks as they are now confirmed in the database
      await this.releaseSeats(seatIds, userId, eventId);
      
      // In a real implementation, you would update the database to mark these seats as booked
      // This is handled by the booking service, so we just return success here
      
      return {
        success: true,
        message: `Successfully confirmed ${seatIds.length} seats for booking ${bookingId}`
      };
    } catch (error) {
      logger.error('Error confirming seats', { error, seatIds, userId, eventId, bookingId });
      return { success: false, message: 'Failed to confirm seats due to server error' };
    }
  }

  /**
   * Get Redis key for a seat lock
   * @param eventId Event ID
   * @param seatId Seat ID
   * @returns Formatted Redis key
   */
  private static getLockKey(eventId: string, seatId: string): string {
    return `${this.PREFIX}${eventId}:${seatId}`;
  }
}

export default SeatLockingService;