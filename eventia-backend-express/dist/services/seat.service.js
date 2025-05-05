"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatService = void 0;
const db_1 = require("../db");
const seat_1 = require("../models/seat");
const websocket_service_1 = require("./websocket.service");
const uuid_1 = require("uuid");
const apiError_1 = require("../utils/apiError");
/**
 * Service for seat-related operations
 */
class SeatService {
    /**
     * Check availability of seats in bulk
     * @param seatIds Array of seat IDs to check
     * @param eventId Event ID
     * @returns Result object with availability information
     */
    static async checkBulkAvailability(seatIds, eventId) {
        try {
            // Verify the event exists
            const event = await (0, db_1.db)('events').where('id', eventId).first();
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
            const seats = await (0, db_1.db)('seats')
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
            const available = [];
            const unavailable = [];
            // Check each seat's availability
            seats.forEach(seat => {
                if (seat.status === seat_1.SeatStatus.AVAILABLE) {
                    available.push(seat.id);
                }
                else if (seat.status === seat_1.SeatStatus.LOCKED &&
                    seat.lock_expires_at &&
                    new Date(seat.lock_expires_at) < now) {
                    // Seat lock has expired, consider it available
                    available.push(seat.id);
                }
                else {
                    const unavailableInfo = {
                        id: seat.id,
                        status: seat.status
                    };
                    if (seat.status === seat_1.SeatStatus.LOCKED && seat.lock_expires_at) {
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
        }
        catch (error) {
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
    static async lockSeats(seatIds, userId, eventId, lockDuration = 900) {
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
            await db_1.db.transaction(async (trx) => {
                // Update seat status to LOCKED
                await trx('seats')
                    .whereIn('id', seatIds)
                    .update({
                    status: seat_1.SeatStatus.LOCKED,
                    locked_by: userId,
                    lock_expires_at: expiresAt
                });
                // Create or update seat lock records
                for (const seatId of seatIds) {
                    await trx('seat_locks')
                        .insert({
                        id: (0, uuid_1.v4)(),
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
            websocket_service_1.WebsocketService.broadcastSeatUpdate(eventId, seatIds, seat_1.SeatStatus.LOCKED, userId);
            return {
                success: true,
                lockedSeats: seatIds,
                expiresAt
            };
        }
        catch (error) {
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
    static async unlockSeats(seatIds, userId) {
        try {
            // Verify that the user has locked these seats
            const seats = await (0, db_1.db)('seats')
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
            const seatLock = await (0, db_1.db)('seat_locks')
                .whereIn('seat_id', seatIds)
                .where('user_id', userId)
                .select('event_id')
                .first();
            // Unlock the seats in a transaction
            await db_1.db.transaction(async (trx) => {
                // Update seat status to AVAILABLE
                await trx('seats')
                    .whereIn('id', seatIds)
                    .where('locked_by', userId)
                    .update({
                    status: seat_1.SeatStatus.AVAILABLE,
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
                websocket_service_1.WebsocketService.broadcastSeatUpdate(seatLock.event_id, seatIds, seat_1.SeatStatus.AVAILABLE);
            }
            return {
                success: true,
                unlockedSeats: seatIds
            };
        }
        catch (error) {
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
    static async bookSeats(seatIds, bookingId) {
        try {
            // Get the booking to retrieve the event ID
            const booking = await (0, db_1.db)('bookings')
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
            const updatedCount = await (0, db_1.db)('seats')
                .whereIn('id', seatIds)
                .whereNot('status', seat_1.SeatStatus.BOOKED) // Don't update already booked seats
                .update({
                status: seat_1.SeatStatus.BOOKED,
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
            await (0, db_1.db)('seat_locks')
                .whereIn('seat_id', seatIds)
                .delete();
            // Notify via WebSocket
            websocket_service_1.WebsocketService.broadcastSeatUpdate(booking.event_id, seatIds, seat_1.SeatStatus.BOOKED);
            return {
                success: true,
                bookedSeats: seatIds
            };
        }
        catch (error) {
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
    static async releaseBookedSeats(seatIds, bookingId) {
        try {
            // Get the booking to retrieve the event ID
            const booking = await (0, db_1.db)('bookings')
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
            const seats = await (0, db_1.db)('seats')
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
            await (0, db_1.db)('seats')
                .whereIn('id', seatIds)
                .where('booking_id', bookingId)
                .update({
                status: seat_1.SeatStatus.AVAILABLE,
                booking_id: null
            });
            // Notify via WebSocket
            websocket_service_1.WebsocketService.broadcastSeatUpdate(booking.event_id, seatIds, seat_1.SeatStatus.AVAILABLE);
            return {
                success: true,
                releasedSeats: seatIds
            };
        }
        catch (error) {
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
    static async releaseExpiredLocks() {
        try {
            const now = new Date();
            // Find expired locks
            const expiredLocks = await (0, db_1.db)('seats')
                .where('status', seat_1.SeatStatus.LOCKED)
                .where('lock_expires_at', '<', now)
                .select('id', 'locked_by');
            const expiredSeatIds = expiredLocks.map(lock => lock.id);
            if (expiredSeatIds.length === 0) {
                return 0;
            }
            // Group by user for WebSocket notifications
            const seatsByUser = {};
            expiredLocks.forEach(lock => {
                if (!lock.locked_by)
                    return;
                if (!seatsByUser[lock.locked_by]) {
                    seatsByUser[lock.locked_by] = [];
                }
                seatsByUser[lock.locked_by].push(lock.id);
            });
            // Get event IDs for WebSocket notifications
            const seatLocks = await (0, db_1.db)('seat_locks')
                .whereIn('seat_id', expiredSeatIds)
                .select('seat_id', 'event_id');
            const seatToEventMap = {};
            seatLocks.forEach(lock => {
                seatToEventMap[lock.seat_id] = lock.event_id;
            });
            // Release the locks
            await db_1.db.transaction(async (trx) => {
                // Update seats
                await trx('seats')
                    .whereIn('id', expiredSeatIds)
                    .update({
                    status: seat_1.SeatStatus.AVAILABLE,
                    locked_by: null,
                    lock_expires_at: null
                });
                // Delete lock records
                await trx('seat_locks')
                    .whereIn('seat_id', expiredSeatIds)
                    .delete();
            });
            // Group seats by event ID for WebSocket notifications
            const seatsByEvent = {};
            expiredSeatIds.forEach(seatId => {
                const eventId = seatToEventMap[seatId];
                if (!eventId)
                    return;
                if (!seatsByEvent[eventId]) {
                    seatsByEvent[eventId] = [];
                }
                seatsByEvent[eventId].push(seatId);
            });
            // Send WebSocket notifications
            Object.entries(seatsByEvent).forEach(([eventId, seats]) => {
                websocket_service_1.WebsocketService.broadcastSeatUpdate(eventId, seats, seat_1.SeatStatus.AVAILABLE);
            });
            // Notify users that their locks have expired
            Object.entries(seatsByUser).forEach(([userId, seats]) => {
                websocket_service_1.WebsocketService.sendToUser(userId, 'seat_lock_expired', {
                    seat_ids: seats,
                    message: 'Your seat locks have expired'
                });
            });
            return expiredSeatIds.length;
        }
        catch (error) {
            console.error('Error releasing expired locks:', error);
            return 0;
        }
    }
    /**
     * Get seat status
     * @param seatId Seat ID
     * @returns Seat status information
     */
    static async getSeatStatus(seatId) {
        try {
            const seat = await (0, db_1.db)('seats')
                .where('id', seatId)
                .select('status', 'locked_by', 'lock_expires_at', 'booking_id')
                .first();
            if (!seat) {
                return null;
            }
            return {
                status: seat.status,
                lockedBy: seat.locked_by,
                lockExpiresAt: seat.lock_expires_at ? new Date(seat.lock_expires_at) : undefined,
                bookingId: seat.booking_id
            };
        }
        catch (error) {
            console.error('Error getting seat status:', error);
            throw new apiError_1.ApiError(500, 'Error getting seat status');
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
    static async scheduleReservationExpiry(reservationId, seatIds, userId, expirationSeconds) {
        try {
            // Instead of using setTimeout directly, which doesn't survive server restarts,
            // we'll use a more resilient approach
            // Create an entry in a dedicated expiration queue table
            // This table would be processed by a background job (cron)
            await (0, db_1.db)('reservation_expiry_queue').insert({
                id: (0, uuid_1.v4)(),
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
                    const reservation = await (0, db_1.db)('seat_reservations')
                        .where('id', reservationId)
                        .where('status', 'pending')
                        .first();
                    if (reservation) {
                        // Use a retry mechanism for better reliability
                        await this.releaseReservation(reservationId, seatIds, userId);
                    }
                }
                catch (error) {
                    console.error('Error in reservation expiry timeout handler:', error);
                    // The cron job will catch this if it fails
                }
            }, expirationSeconds * 1000);
        }
        catch (error) {
            console.error('Error scheduling reservation expiry:', error);
            throw new apiError_1.ApiError(500, 'Failed to schedule reservation expiry');
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
    static async releaseReservation(reservationId, seatIds, userId) {
        try {
            // Get event ID for WebSocket notification
            const seatLock = await (0, db_1.db)('seat_locks')
                .whereIn('seat_id', seatIds)
                .where('user_id', userId)
                .select('event_id')
                .first();
            // Use transaction to ensure atomicity
            await db_1.db.transaction(async (trx) => {
                // Release the seats
                await trx('seats')
                    .whereIn('id', seatIds)
                    .where('locked_by', userId)
                    .update({
                    status: seat_1.SeatStatus.AVAILABLE,
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
                websocket_service_1.WebsocketService.broadcastSeatUpdate(seatLock.event_id, seatIds, seat_1.SeatStatus.AVAILABLE);
            }
            // Notify the user that their reservation expired
            websocket_service_1.WebsocketService.sendToUser(userId, 'reservation_expired', {
                reservation_id: reservationId,
                seat_ids: seatIds,
                message: 'Your seat reservation has expired'
            });
            return true;
        }
        catch (error) {
            console.error('Error releasing reservation:', error);
            return false;
        }
    }
    /**
     * Process expired reservations
     * This should be called by a cron job regularly
     */
    static async processExpiredReservations() {
        try {
            const now = new Date();
            // Find expired reservations in the queue
            const expiredReservations = await (0, db_1.db)('reservation_expiry_queue')
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
                    const success = await this.releaseReservation(reservation.reservation_id, seatIds, reservation.user_id);
                    if (success) {
                        releasedCount++;
                    }
                }
                catch (error) {
                    console.error(`Error processing expired reservation ${reservation.id}:`, error);
                }
            }
            return releasedCount;
        }
        catch (error) {
            console.error('Error processing expired reservations:', error);
            return 0;
        }
    }
    /**
     * Get unavailable seats from a list of seat IDs
     * @param prisma Prisma client instance (can be transaction)
     * @param seatIds Array of seat IDs to check
     * @returns Array of unavailable seat IDs
     */
    static async getUnavailableSeats(prisma, seatIds) {
        try {
            const seats = await prisma.seat.findMany({
                where: {
                    id: { in: seatIds },
                    OR: [
                        { status: { not: 'AVAILABLE' } },
                        {
                            status: 'LOCKED',
                            lockedUntil: { gt: new Date() }
                        }
                    ]
                },
                select: { id: true }
            });
            return seats.map((seat) => seat.id);
        }
        catch (error) {
            console.error('Error getting unavailable seats:', error);
            return [];
        }
    }
}
exports.SeatService = SeatService;
