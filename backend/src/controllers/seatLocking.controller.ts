import { Request, Response } from 'express';
import { db } from '../db';
import { SeatModel, SeatStatus } from '../models/seat';
import { WebsocketService } from '../services/websocket.service';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { withRetry } from '../utils/retry';

/**
 * Lock seats for a user
 */
export const lockSeats = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids, user_id, expiration = 900 } = req.body;

  if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    throw new ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
  }

  if (!user_id) {
    throw new ApiError(400, 'User ID is required', 'MISSING_USER_ID');
  }

  const result = await SeatModel.reserveSeats(seat_ids, user_id, expiration);

  if (!result.success) {
    return res.status(400).json({
      status: 'error',
      message: result.message || 'Failed to reserve seats',
      data: {
        lockedSeats: result.lockedSeats,
        unavailableSeats: result.unavailableSeats || []
      }
    });
  }

  // Set up automatic release after expiration
  setupSeatLockExpiration(seat_ids, user_id, expiration, result.reservationId);

  return res.status(200).json({
    status: 'success',
    message: 'Seats locked successfully',
    data: {
      lockedSeats: result.lockedSeats,
      expiresIn: expiration,
      reservationId: result.reservationId
    }
  });
});

/**
 * Release locked seats
 */
export const releaseSeats = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids, user_id } = req.body;

  if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    throw new ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
  }

  if (!user_id) {
    throw new ApiError(400, 'User ID is required', 'MISSING_USER_ID');
  }

  await releaseSeatLocks(seat_ids, user_id);

  return res.status(200).json({
    status: 'success',
    message: 'Seats released successfully',
    data: {
      releasedSeats: seat_ids
    }
  });
});

/**
 * Check seat status
 */
export const getSeatStatus = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids } = req.query as { seat_ids: string };

  if (!seat_ids) {
    throw new ApiError(400, 'Seat IDs are required', 'MISSING_SEAT_IDS');
  }

  const seatIdsArray = seat_ids.split(',');
  const seats = await SeatModel.getByIds(seatIdsArray);

  return res.status(200).json({
    status: 'success',
    data: {
      seats: seats.map(seat => ({
        id: seat.id,
        status: seat.status,
        locked_by: seat.locked_by,
        lock_expires_at: seat.lock_expires_at
      }))
    }
  });
});

/**
 * Setup automatic release of seats after expiration
 */
function setupSeatLockExpiration(
  seatIds: string[],
  userId: string,
  expirationSeconds: number,
  reservationId?: string
): void {
  setTimeout(() => {
    // Use retry mechanism for reliable seat release
    withRetry(() => releaseExpiredReservation(seatIds, userId, reservationId), { maxAttempts: 3, delay: 5000 })
      .catch(error => {
        logger.error('Failed to release seats after multiple attempts:', error);
        // Additional recovery mechanism could be implemented here
        // For example: Send an alert to admin dashboard or monitoring system
      });
  }, expirationSeconds * 1000);
}

/**
 * Release expired seat reservation with transaction
 */
async function releaseExpiredReservation(
  seatIds: string[],
  userId: string,
  reservationId?: string
): Promise<void> {
  try {
    // Use transaction to ensure atomicity
    await db.transaction(async trx => {
      // Check if reservation is still pending
      if (reservationId) {
        const reservation = await trx('seat_reservations')
          .where('id', reservationId)
          .where('status', 'pending')
          .first();

        if (!reservation) {
          // Reservation already processed, no need to release
          return;
        }

        // Update reservation status
        await trx('seat_reservations')
          .where('id', reservationId)
          .update({
            status: 'expired',
            updated_at: trx.fn.now()
          });
      }

      // Release the seats that are still locked by this user
      const releasedSeats = await trx('seats')
        .update({
          status: SeatStatus.AVAILABLE,
          locked_by: null,
          lock_expires_at: null,
          updated_at: trx.fn.now()
        })
        .whereIn('id', seatIds)
        .where('locked_by', userId)
        .where('status', SeatStatus.LOCKED)
        .returning('id');

      // If seats were released, notify connected clients
      if (releasedSeats.length > 0) {
        const releasedIds = releasedSeats.map(seat => seat.id);
        // We'll handle WebSocket notifications outside the transaction
        return releasedIds;
      }

      return [];
    })
    .then(releasedIds => {
      // Send WebSocket notifications after transaction completes
      if (Array.isArray(releasedIds) && releasedIds.length > 0) {
        try {
          WebsocketService.notifySeatStatusChange(releasedIds, SeatStatus.AVAILABLE);
        } catch (wsError) {
          logger.error('Failed to send WebSocket notification:', wsError);
          // Continue execution even if WebSocket fails
        }
      }
    });
  } catch (error) {
    logger.error('Error releasing seat reservation:', error);
    throw error; // Rethrow for retry mechanism
  }
}

/**
 * Release seat locks manually
 */
async function releaseSeatLocks(seatIds: string[], userId: string): Promise<void> {
  try {
    await db.transaction(async trx => {
      const releasedSeats = await trx('seats')
        .update({
          status: SeatStatus.AVAILABLE,
          locked_by: null,
          lock_expires_at: null,
          updated_at: trx.fn.now()
        })
        .whereIn('id', seatIds)
        .where('locked_by', userId)
        .returning('id');

      // Update any related reservation
      await trx('seat_reservations')
        .update({
          status: 'released',
          updated_at: trx.fn.now()
        })
        .where('user_id', userId)
        .whereRaw(`seats @> ?::jsonb`, [JSON.stringify(seatIds)])
        .where('status', 'pending');

      return releasedSeats.map(seat => seat.id);
    })
    .then(releasedIds => {
      // Send WebSocket notifications after transaction completes
      if (releasedIds.length > 0) {
        try {
          WebsocketService.notifySeatStatusChange(releasedIds, SeatStatus.AVAILABLE);
        } catch (wsError) {
          logger.error('Failed to send WebSocket notification:', wsError);
        }
      }
    });
  } catch (error) {
    logger.error('Error manually releasing seats:', error);
    throw error;
  }
}

/**
 * Check if seats are locked
 */
export const checkSeatsLocked = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids, event_id } = req.query as { seat_ids: string; event_id: string };

  if (!seat_ids || !event_id) {
    throw new ApiError(400, 'Seat IDs and event ID are required', 'MISSING_PARAMS');
  }

  const seatIdsArray = seat_ids.split(',');
  const seats = await SeatModel.getByIds(seatIdsArray);

  const lockedSeats = seats.filter(seat => seat.status === SeatStatus.LOCKED);

  return res.status(200).json({
    status: 'success',
    data: {
      anyLocked: lockedSeats.length > 0,
      lockedSeats: lockedSeats.map(s => s.id),
      lockedBy: lockedSeats.reduce((acc, s) => ({ ...acc, [s.id]: s.locked_by }), {})
    }
  });
});

/**
 * Extend lock duration for seats
 */
export const extendLock = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids, user_id, duration = 900 } = req.body;

  if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    throw new ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
  }

  if (!user_id) {
    throw new ApiError(400, 'User ID is required', 'MISSING_USER_ID');
  }

  // Extend locks by updating expiration time
  await db('seats')
    .whereIn('id', seat_ids)
    .where('locked_by', user_id)
    .where('status', SeatStatus.LOCKED)
    .update({
      lock_expires_at: db.raw(`NOW() + INTERVAL '${duration} seconds'`),
      updated_at: db.fn.now()
    });

  return res.status(200).json({
    status: 'success',
    message: `Lock extended for ${duration} seconds`,
    data: { extendedSeats: seat_ids }
  });
});

/**
 * Confirm seats for a booking
 */
export const confirmSeats = asyncHandler(async (req: Request, res: Response) => {
  const { seat_ids, user_id, booking_id } = req.body;

  if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    throw new ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
  }

  if (!user_id || !booking_id) {
    throw new ApiError(400, 'User ID and booking ID are required', 'MISSING_PARAMS');
  }

  await db.transaction(async trx => {
    // Confirm seats by updating status to BOOKED
    await trx('seats')
      .whereIn('id', seat_ids)
      .where('locked_by', user_id)
      .update({
        status: SeatStatus.BOOKED,
        booking_id,
        locked_by: null,
        lock_expires_at: null,
        updated_at: trx.fn.now()
      });
  });

  // Notify clients
  WebsocketService.notifySeatStatusChange(seat_ids, SeatStatus.BOOKED);

  return res.status(200).json({
    status: 'success',
    message: 'Seats confirmed successfully',
    data: { confirmedSeats: seat_ids, bookingId: booking_id }
  });
});
