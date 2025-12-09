"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatController = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../db");
const seat_1 = require("../models/seat");
const seat_service_1 = require("../services/seat.service");
const websocket_service_1 = require("../services/websocket.service");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
/**
 * @class SeatController
 * @description Controller for managing venue seats and their status
 */
class SeatController {
    /**
     * Get seats by venue and section
     * @route GET /api/venues/:venueId/sections/:sectionId/seats
     */
    static async getSeats(req, res, next) {
        try {
            const { venueId, sectionId } = req.params;
            // Validate venue and section exist
            const venue = await (0, db_1.db)('venues').where('id', venueId).first();
            if (!venue) {
                throw new apiError_1.ApiError(404, 'Venue not found');
            }
            const section = await (0, db_1.db)('venue_sections')
                .where('id', sectionId)
                .where('venue_id', venueId)
                .first();
            if (!section) {
                throw new apiError_1.ApiError(404, 'Section not found');
            }
            // Get all seats for the section
            const seats = await (0, db_1.db)('seats')
                .where('venue_id', venueId)
                .where('section_id', sectionId)
                .orderBy(['row', 'number']);
            apiResponse_1.ApiResponse.success(res, 200, 'Seats retrieved successfully', seats);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reserve seats temporarily (15 minutes)
     * @route POST /api/seats/reserve
     */
    static async reserveSeats(req, res, next) {
        try {
            const { seat_ids, user_id, expiration = 900 } = req.body; // Default: 15 minutes
            // Check if seats are available
            const seats = await (0, db_1.db)('seats')
                .whereIn('id', seat_ids)
                .select('id', 'status');
            if (seats.length !== seat_ids.length) {
                throw new apiError_1.ApiError(404, 'One or more seats not found');
            }
            const unavailableSeats = seats.filter(seat => seat.status !== seat_1.SeatStatus.AVAILABLE);
            if (unavailableSeats.length > 0) {
                throw new apiError_1.ApiError(409, 'One or more seats are not available', 'SEAT_UNAVAILABLE', {
                    unavailableSeats: unavailableSeats.map(s => s.id)
                });
            }
            // Lock seats for the specified duration
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expiration);
            const reservationId = await db_1.db.transaction(async (trx) => {
                // Update seat status to LOCKED
                await trx('seats')
                    .whereIn('id', seat_ids)
                    .update({
                    status: seat_1.SeatStatus.LOCKED,
                    locked_by: user_id,
                    lock_expires_at: expiresAt
                });
                // Create reservation record
                const reservationId = (0, uuid_1.v4)();
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
            websocket_service_1.WebsocketService.notifySeatStatusChange(seat_ids, seat_1.SeatStatus.LOCKED);
            // Schedule seat release job using a dedicated service
            // This is more reliable than using setTimeout directly
            try {
                await seat_service_1.SeatService.scheduleReservationExpiry(reservationId, seat_ids, user_id, expiration);
            }
            catch (error) {
                logger_1.logger.error('Failed to schedule seat reservation expiry:', error);
                // Continue execution - the cron job will catch expired reservations
            }
            apiResponse_1.ApiResponse.success(res, 200, 'Seats reserved successfully', {
                reservationId,
                expiresAt: expiresAt.toISOString()
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Release seat reservation
     * @route DELETE /api/seats/reserve
     */
    static async releaseReservation(req, res, next) {
        try {
            const { seat_ids, user_id } = req.body;
            // Release the seats
            await (0, db_1.db)('seats')
                .whereIn('id', seat_ids)
                .where('locked_by', user_id)
                .update({
                status: seat_1.SeatStatus.AVAILABLE,
                locked_by: null,
                lock_expires_at: null
            });
            // Update reservation status
            await (0, db_1.db)('seat_reservations')
                .where('user_id', user_id)
                .whereRaw('seats @> ?', [JSON.stringify(seat_ids)])
                .where('status', 'pending')
                .update({ status: 'cancelled' });
            // Notify connected clients
            websocket_service_1.WebsocketService.notifySeatStatusChange(seat_ids, seat_1.SeatStatus.AVAILABLE);
            apiResponse_1.ApiResponse.success(res, 200, 'Reservation released successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update seat status (admin only)
     * @route PUT /api/seats/:id/status
     */
    static async updateSeatStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!Object.values(seat_1.SeatStatus).includes(status)) {
                throw new apiError_1.ApiError(400, 'Invalid seat status');
            }
            const seat = await (0, db_1.db)('seats').where('id', id).first();
            if (!seat) {
                throw new apiError_1.ApiError(404, 'Seat not found');
            }
            // Update the seat status
            await (0, db_1.db)('seats')
                .where('id', id)
                .update({
                status,
                updated_at: new Date()
            });
            // Notify connected clients
            websocket_service_1.WebsocketService.notifySeatStatusChange([id], status);
            apiResponse_1.ApiResponse.success(res, 200, 'Seat status updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Check availability for multiple seats at once
     * @route POST /api/v1/seats/bulk-availability
     */
    static async bulkCheckAvailability(req, res, next) {
        try {
            const { seat_ids, event_id } = req.body;
            // Use the SeatService to check availability
            const result = await seat_service_1.SeatService.checkBulkAvailability(seat_ids, event_id);
            if (!result.complete) {
                throw new apiError_1.ApiError(404, result.message || 'Error checking seat availability');
            }
            apiResponse_1.ApiResponse.success(res, 200, 'Seat availability checked successfully', result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Lock seats for a specific user
     * @route POST /api/seats/lock
     */
    static async lockSeats(req, res, next) {
        try {
            const { seat_ids, user_id, event_id, lock_duration = 900 } = req.body;
            // Check if seats exist and are available
            const seats = await (0, db_1.db)('seats')
                .whereIn('id', seat_ids)
                .select('id', 'status', 'locked_by', 'lock_expires_at');
            if (seats.length !== seat_ids.length) {
                throw new apiError_1.ApiError(404, 'One or more seats not found');
            }
            // Check if any seats are already locked by someone else
            const currentTime = new Date();
            const lockedByOthers = seats.filter(seat => {
                return seat.status === seat_1.SeatStatus.LOCKED &&
                    seat.locked_by !== user_id &&
                    seat.lock_expires_at &&
                    new Date(seat.lock_expires_at) > currentTime;
            });
            if (lockedByOthers.length > 0) {
                throw new apiError_1.ApiError(409, 'One or more seats are already locked by another user', 'SEAT_LOCKED', {
                    lockedSeats: lockedByOthers.map(s => s.id)
                });
            }
            // Set lock expiration time
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + lock_duration);
            // Lock the seats
            await db_1.db.transaction(async (trx) => {
                // Update seat status to LOCKED
                await trx('seats')
                    .whereIn('id', seat_ids)
                    .update({
                    status: seat_1.SeatStatus.LOCKED,
                    locked_by: user_id,
                    lock_expires_at: expiresAt
                });
                // Create or update seat lock records
                for (const seatId of seat_ids) {
                    await trx('seat_locks').insert({
                        id: (0, uuid_1.v4)(),
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
            websocket_service_1.WebsocketService.broadcastSeatUpdate(event_id, seat_ids, seat_1.SeatStatus.LOCKED, user_id);
            apiResponse_1.ApiResponse.success(res, 200, 'Seats locked successfully', {
                seat_ids,
                locked_until: expiresAt,
                lock_duration
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Unlock previously locked seats
     * @route DELETE /api/seats/unlock
     */
    static async unlockSeats(req, res, next) {
        try {
            const { seat_ids, user_id } = req.body;
            // Check if seats exist
            const seats = await (0, db_1.db)('seats')
                .whereIn('id', seat_ids)
                .select('id', 'status', 'locked_by', 'lock_expires_at');
            if (seats.length !== seat_ids.length) {
                throw new apiError_1.ApiError(404, 'One or more seats not found');
            }
            // Check if user has permission to unlock these seats
            const lockedByUser = seats.filter(seat => seat.status === seat_1.SeatStatus.LOCKED && seat.locked_by === user_id);
            if (lockedByUser.length !== seats.length) {
                throw new apiError_1.ApiError(403, 'You can only unlock seats that you have locked');
            }
            // Get event_id for WebSocket notification
            const seatLocks = await (0, db_1.db)('seat_locks')
                .whereIn('seat_id', seat_ids)
                .where('user_id', user_id)
                .select('event_id')
                .first();
            const event_id = seatLocks?.event_id;
            // Unlock the seats
            await db_1.db.transaction(async (trx) => {
                // Update seat status to AVAILABLE
                await trx('seats')
                    .whereIn('id', seat_ids)
                    .where('locked_by', user_id)
                    .update({
                    status: seat_1.SeatStatus.AVAILABLE,
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
                websocket_service_1.WebsocketService.broadcastSeatUpdate(event_id, seat_ids, seat_1.SeatStatus.AVAILABLE);
            }
            apiResponse_1.ApiResponse.success(res, 200, 'Seats unlocked successfully', {
                seat_ids,
                unlocked_by: user_id
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SeatController = SeatController;
exports.default = SeatController;
//# sourceMappingURL=seat.controller.js.map