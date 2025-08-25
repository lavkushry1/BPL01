"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatModel = exports.SeatStatusUpdateSchema = exports.SeatReservationSchema = exports.SeatSchema = exports.SeatStatus = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
/**
 * Enum for seat status
 */
var SeatStatus;
(function (SeatStatus) {
    SeatStatus["AVAILABLE"] = "available";
    SeatStatus["LOCKED"] = "locked";
    SeatStatus["BOOKED"] = "booked";
    SeatStatus["RESERVED"] = "reserved";
    SeatStatus["UNAVAILABLE"] = "unavailable";
})(SeatStatus || (exports.SeatStatus = SeatStatus = {}));
// Zod schema for seat validation
exports.SeatSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    section_id: zod_1.z.string().uuid(),
    row: zod_1.z.string(),
    number: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    status: zod_1.z.enum([
        SeatStatus.AVAILABLE,
        SeatStatus.BOOKED,
        SeatStatus.LOCKED,
        SeatStatus.RESERVED,
        SeatStatus.UNAVAILABLE
    ]).default(SeatStatus.AVAILABLE),
    locked_by: zod_1.z.string().uuid().nullable().optional(),
    lock_expires_at: zod_1.z.date().nullable().optional(),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional()
});
// Schema for seat reservation
exports.SeatReservationSchema = zod_1.z.object({
    seat_ids: zod_1.z.array(zod_1.z.string().uuid()),
    user_id: zod_1.z.string().uuid(),
    expiration: zod_1.z.number().int().positive().optional().default(900) // Default 15 minutes
});
// Schema for updating seat status
exports.SeatStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum([
        SeatStatus.AVAILABLE,
        SeatStatus.BOOKED,
        SeatStatus.LOCKED,
        SeatStatus.RESERVED,
        SeatStatus.UNAVAILABLE
    ]),
    locked_by: zod_1.z.string().uuid().nullable().optional(),
    lock_expires_at: zod_1.z.date().nullable().optional()
});
class SeatModel {
    /**
     * Get all seats for a venue section
     */
    static async getBySection(sectionId) {
        return (0, db_1.db)('seats')
            .select('*')
            .where({ section_id: sectionId })
            .orderBy('row')
            .orderBy('number');
    }
    /**
     * Get seats by IDs
     */
    static async getByIds(seatIds) {
        return (0, db_1.db)('seats')
            .select('*')
            .whereIn('id', seatIds);
    }
    /**
     * Reserve seats temporarily
     * @returns Object containing success status, locked seats, and optional error message
     */
    static async reserveSeats(seatIds, userId, expirationSeconds) {
        const expiresAt = new Date(Date.now() + expirationSeconds * 1000);
        try {
            // Use transaction with row locking for atomicity
            const result = await db_1.db.transaction(async (trx) => {
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
                    id: db_1.db.raw('uuid_generate_v4()'),
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
        }
        catch (error) {
            console.error('Error reserving seats:', error);
            throw new Error('Failed to reserve seats due to database error');
        }
    }
    /**
     * Release seat reservation
     */
    static async releaseReservation(seatIds, userId) {
        await (0, db_1.db)('seats')
            .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null,
            updated_at: db_1.db.fn.now()
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
    static async updateStatus(seatId, update) {
        const { status, locked_by, lock_expires_at } = update;
        const result = await (0, db_1.db)('seats')
            .update({
            status,
            locked_by,
            lock_expires_at,
            updated_at: db_1.db.fn.now()
        })
            .where({ id: seatId })
            .returning('*');
        return result[0] || null;
    }
    /**
     * Automatically release expired seat reservations
     * This should be run by a cron job
     */
    static async releaseExpiredReservations() {
        const result = await (0, db_1.db)('seats')
            .update({
            status: SeatStatus.AVAILABLE,
            locked_by: null,
            lock_expires_at: null,
            updated_at: db_1.db.fn.now()
        })
            .where({ status: SeatStatus.LOCKED })
            .where('lock_expires_at', '<', db_1.db.fn.now())
            .returning('id');
        return result.length;
    }
}
exports.SeatModel = SeatModel;
//# sourceMappingURL=seat.js.map