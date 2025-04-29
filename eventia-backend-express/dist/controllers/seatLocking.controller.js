"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeatStatus = exports.releaseSeats = exports.lockSeats = void 0;
const seat_1 = require("../models/seat");
const db_1 = require("../db");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiError_1 = require("../utils/apiError");
const websocket_service_1 = require("../services/websocket.service");
const logger_1 = require("../utils/logger");
const retry_1 = require("../utils/retry");
/**
 * Lock seats for a user
 */
exports.lockSeats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { seat_ids, user_id, expiration = 900 } = req.body;
    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        throw new apiError_1.ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
    }
    if (!user_id) {
        throw new apiError_1.ApiError(400, 'User ID is required', 'MISSING_USER_ID');
    }
    const result = await seat_1.SeatModel.reserveSeats(seat_ids, user_id, expiration);
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
exports.releaseSeats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { seat_ids, user_id } = req.body;
    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
        throw new apiError_1.ApiError(400, 'Valid seat IDs are required', 'INVALID_SEAT_IDS');
    }
    if (!user_id) {
        throw new apiError_1.ApiError(400, 'User ID is required', 'MISSING_USER_ID');
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
exports.getSeatStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { seat_ids } = req.query;
    if (!seat_ids) {
        throw new apiError_1.ApiError(400, 'Seat IDs are required', 'MISSING_SEAT_IDS');
    }
    const seatIdsArray = seat_ids.split(',');
    const seats = await seat_1.SeatModel.getByIds(seatIdsArray);
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
function setupSeatLockExpiration(seatIds, userId, expirationSeconds, reservationId) {
    setTimeout(() => {
        // Use retry mechanism for reliable seat release
        (0, retry_1.withRetry)(() => releaseExpiredReservation(seatIds, userId, reservationId), 3, 5000)
            .catch(error => {
            logger_1.logger.error('Failed to release seats after multiple attempts:', error);
            // Additional recovery mechanism could be implemented here
            // For example: Send an alert to admin dashboard or monitoring system
        });
    }, expirationSeconds * 1000);
}
/**
 * Release expired seat reservation with transaction
 */
async function releaseExpiredReservation(seatIds, userId, reservationId) {
    try {
        // Use transaction to ensure atomicity
        await db_1.db.transaction(async (trx) => {
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
                status: seat_1.SeatStatus.AVAILABLE,
                locked_by: null,
                lock_expires_at: null,
                updated_at: trx.fn.now()
            })
                .whereIn('id', seatIds)
                .where('locked_by', userId)
                .where('status', seat_1.SeatStatus.LOCKED)
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
                    websocket_service_1.WebsocketService.notifySeatStatusChange(releasedIds, seat_1.SeatStatus.AVAILABLE);
                }
                catch (wsError) {
                    logger_1.logger.error('Failed to send WebSocket notification:', wsError);
                    // Continue execution even if WebSocket fails
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error releasing seat reservation:', error);
        throw error; // Rethrow for retry mechanism
    }
}
/**
 * Release seat locks manually
 */
async function releaseSeatLocks(seatIds, userId) {
    try {
        await db_1.db.transaction(async (trx) => {
            const releasedSeats = await trx('seats')
                .update({
                status: seat_1.SeatStatus.AVAILABLE,
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
                    websocket_service_1.WebsocketService.notifySeatStatusChange(releasedIds, seat_1.SeatStatus.AVAILABLE);
                }
                catch (wsError) {
                    logger_1.logger.error('Failed to send WebSocket notification:', wsError);
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error manually releasing seats:', error);
        throw error;
    }
}
