import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { SeatStatus } from '../models/seat';
import { SeatService } from '../services/seat.service';
import { WebsocketService } from '../services/websocket.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * @class SeatController
 * @description Controller for managing venue seats and their status
 */
export class SeatController {
  /**
   * Get seats by venue and section
   * @route GET /api/venues/:venueId/sections/:sectionId/seats
   */
  static async getSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venueId, sectionId } = req.params;

      // Validate venue and section exist
      const venue = await db('venues').where('id', venueId).first();
      if (!venue) {
        throw new ApiError(404, 'Venue not found');
      }

      const section = await db('venue_sections')
        .where('id', sectionId)
        .where('venue_id', venueId)
        .first();

      if (!section) {
        throw new ApiError(404, 'Section not found');
      }

      // Get all seats for the section
      const seats = await db('seats')
        .where('venue_id', venueId)
        .where('section_id', sectionId)
        .orderBy(['row', 'number']);

      ApiResponse.success(res, 200, 'Seats retrieved successfully', seats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reserve seats temporarily (15 minutes)
   * @route POST /api/seats/reserve
   */
  static async reserveSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seat_ids, user_id, expiration = 900 } = req.body; // Default: 15 minutes

      // Check if seats are available
      const seats = await db('seats')
        .whereIn('id', seat_ids)
        .select('id', 'status');

      if (seats.length !== seat_ids.length) {
        throw new ApiError(404, 'One or more seats not found');
      }

      const unavailableSeats = seats.filter(seat =>
        seat.status !== SeatStatus.AVAILABLE
      );

      if (unavailableSeats.length > 0) {
        throw new ApiError(409, 'One or more seats are not available', 'SEAT_UNAVAILABLE', {
          unavailableSeats: unavailableSeats.map(s => s.id)
        });
      }

      // Lock seats for the specified duration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiration);

      const reservationId = await db.transaction(async trx => {
        // Update seat status to LOCKED
        await trx('seats')
          .whereIn('id', seat_ids)
          .update({
            status: SeatStatus.LOCKED,
            locked_by: user_id,
            lock_expires_at: expiresAt
          });

        // Create reservation record
        const reservationId = uuidv4();
        await trx('seat_reservations').insert({
          id: reservationId,
          user_id,
          seats: seat_ids,
          expires_at: expiresAt,
          status: 'pending'
        });

        return reservationId;
      });

      // Notify connected clients about seat status change
      WebsocketService.notifySeatStatusChange(seat_ids, SeatStatus.LOCKED);

      // Schedule seat release job using a dedicated service
      // This is more reliable than using setTimeout directly
      try {
        await SeatService.scheduleReservationExpiry(
          reservationId,
          seat_ids,
          user_id,
          expiration
        );
      } catch (error) {
        logger.error('Failed to schedule seat reservation expiry:', error);
        // Continue execution - the cron job will catch expired reservations
      }

      ApiResponse.success(res, 200, 'Seats reserved successfully', {
        reservationId,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Release seat reservation
   * @route DELETE /api/seats/reserve
   */
  static async releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seat_ids, user_id } = req.body;

      // Release the seats
      await db('seats')
        .whereIn('id', seat_ids)
        .where('locked_by', user_id)
        .update({
          status: SeatStatus.AVAILABLE,
          locked_by: null,
          lock_expires_at: null
        });

      // Update reservation status
      await db('seat_reservations')
        .where('user_id', user_id)
        .whereRaw('seats @> ?', [JSON.stringify(seat_ids)])
        .where('status', 'pending')
        .update({ status: 'cancelled' });

      // Notify connected clients
      WebsocketService.notifySeatStatusChange(seat_ids, SeatStatus.AVAILABLE);

      ApiResponse.success(res, 200, 'Reservation released successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update seat status (admin only)
   * @route PUT /api/seats/:id/status
   */
  static async updateSeatStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(SeatStatus).includes(status)) {
        throw new ApiError(400, 'Invalid seat status');
      }

      const seat = await db('seats').where('id', id).first();

      if (!seat) {
        throw new ApiError(404, 'Seat not found');
      }

      // Update the seat status
      await db('seats')
        .where('id', id)
        .update({
          status,
          updated_at: new Date()
        });

      // Notify connected clients
      WebsocketService.notifySeatStatusChange([id], status);

      ApiResponse.success(res, 200, 'Seat status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check availability for multiple seats at once
   * @route POST /api/v1/seats/bulk-availability
   */
  static async bulkCheckAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seat_ids, event_id } = req.body;

      // Use the SeatService to check availability
      const result = await SeatService.checkBulkAvailability(seat_ids, event_id);

      if (!result.complete) {
        throw new ApiError(404, result.message || 'Error checking seat availability');
      }

      ApiResponse.success(res, 200, 'Seat availability checked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lock seats for a specific user
   * @route POST /api/seats/lock
   */
  static async lockSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seat_ids, user_id, event_id, lock_duration = 900 } = req.body;

      // Check if seats exist and are available
      const seats = await db('seats')
        .whereIn('id', seat_ids)
        .select('id', 'status', 'locked_by', 'lock_expires_at');

      if (seats.length !== seat_ids.length) {
        throw new ApiError(404, 'One or more seats not found');
      }

      // Check if any seats are already locked by someone else
      const currentTime = new Date();
      const lockedByOthers = seats.filter(seat => {
        return seat.status === SeatStatus.LOCKED &&
          seat.locked_by !== user_id &&
          seat.lock_expires_at &&
               new Date(seat.lock_expires_at) > currentTime;
      });

      if (lockedByOthers.length > 0) {
        throw new ApiError(409, 'One or more seats are already locked by another user', 'SEAT_LOCKED', {
          lockedSeats: lockedByOthers.map(s => s.id)
        });
      }

      // Set lock expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + lock_duration);

      // Lock the seats
      await db.transaction(async trx => {
        // Update seat status to LOCKED
        await trx('seats')
          .whereIn('id', seat_ids)
          .update({
            status: SeatStatus.LOCKED,
            locked_by: user_id,
            lock_expires_at: expiresAt
          });

        // Create or update seat lock records
        for (const seatId of seat_ids) {
          await trx('seat_locks').insert({
            id: uuidv4(),
            seat_id: seatId,
            user_id,
            event_id,
            expires_at: expiresAt
          }).onConflict(['seat_id', 'user_id'])
            .merge({
              expires_at: expiresAt
            });
        }
      });

      // Notify other clients about seat status change via WebSocket
      WebsocketService.broadcastSeatUpdate(event_id, seat_ids, SeatStatus.LOCKED, user_id);

      ApiResponse.success(res, 200, 'Seats locked successfully', {
        seat_ids,
        locked_until: expiresAt,
        lock_duration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlock previously locked seats
   * @route DELETE /api/seats/unlock
   */
  static async unlockSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seat_ids, user_id } = req.body;

      // Check if seats exist
      const seats = await db('seats')
        .whereIn('id', seat_ids)
        .select('id', 'status', 'locked_by', 'lock_expires_at');

      if (seats.length !== seat_ids.length) {
        throw new ApiError(404, 'One or more seats not found');
      }

      // Check if user has permission to unlock these seats
      const lockedByUser = seats.filter(seat =>
        seat.status === SeatStatus.LOCKED && seat.locked_by === user_id
      );

      if (lockedByUser.length !== seats.length) {
        throw new ApiError(403, 'You can only unlock seats that you have locked');
      }

      // Get event_id for WebSocket notification
      const seatLocks = await db('seat_locks')
        .whereIn('seat_id', seat_ids)
        .where('user_id', user_id)
        .select('event_id')
        .first();

      const event_id = seatLocks?.event_id;

      // Unlock the seats
      await db.transaction(async trx => {
        // Update seat status to AVAILABLE
        await trx('seats')
          .whereIn('id', seat_ids)
          .where('locked_by', user_id)
          .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null
          });

        // Remove seat lock records
        await trx('seat_locks')
          .whereIn('seat_id', seat_ids)
          .where('user_id', user_id)
          .delete();
      });

      // Notify other clients about seat status change via WebSocket
      if (event_id) {
        WebsocketService.broadcastSeatUpdate(event_id, seat_ids, SeatStatus.AVAILABLE);
      }

      ApiResponse.success(res, 200, 'Seats unlocked successfully', {
        seat_ids,
        unlocked_by: user_id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stadium layout with block-level availability
   * @route GET /api/v1/events/:eventId/stadium-layout
   */
  static async getStadiumLayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;

      const layout = await SeatService.getStadiumLayout(eventId);

      if (!layout) {
        throw new ApiError(404, 'Event not found or has no seats configured');
      }

      ApiResponse.success(res, 200, 'Stadium layout retrieved successfully', layout);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get individual seats for a specific block/section
   * @route GET /api/v1/events/:eventId/blocks/:section/seats
   */
  static async getBlockSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, section } = req.params;

      const blockSeats = await SeatService.getBlockSeats(eventId, section);

      if (!blockSeats) {
        throw new ApiError(404, 'Block not found or has no seats');
      }

      ApiResponse.success(res, 200, 'Block seats retrieved successfully', blockSeats);
    } catch (error) {
      next(error);
    }
  }
}

export default SeatController;
