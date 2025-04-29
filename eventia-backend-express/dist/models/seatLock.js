"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCheckSeatLocksSchema = exports.checkSeatLockSchema = exports.releaseSeatLockSchema = exports.createSeatLockSchema = exports.SeatLockStatus = exports.seatLockSchema = void 0;
const zod_1 = require("zod");
/**
 * SeatLock Schema
 * Represents a temporary lock on a seat during the booking process
 */
exports.seatLockSchema = zod_1.z.object({
    seatId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    expiresAt: zod_1.z.date(),
});
/**
 * SeatLock status enum
 */
var SeatLockStatus;
(function (SeatLockStatus) {
    SeatLockStatus["ACTIVE"] = "active";
    SeatLockStatus["EXPIRED"] = "expired";
    SeatLockStatus["RELEASED"] = "released";
})(SeatLockStatus || (exports.SeatLockStatus = SeatLockStatus = {}));
/**
 * Create SeatLock schema
 */
exports.createSeatLockSchema = zod_1.z.object({
    body: zod_1.z.object({
        seatId: zod_1.z.string().uuid("Invalid seat ID format"),
        userId: zod_1.z.string().uuid("Invalid user ID format"),
        duration: zod_1.z.number().positive().optional(),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * Release SeatLock schema
 */
exports.releaseSeatLockSchema = zod_1.z.object({
    body: zod_1.z.object({
        seatId: zod_1.z.string().uuid("Invalid seat ID format"),
        userId: zod_1.z.string().uuid("Invalid user ID format"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
/**
 * Check SeatLock schema
 */
exports.checkSeatLockSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        seatId: zod_1.z.string().uuid("Invalid seat ID format"),
    }),
    query: zod_1.z.object({}),
});
/**
 * Bulk Check SeatLocks schema
 */
exports.bulkCheckSeatLocksSchema = zod_1.z.object({
    body: zod_1.z.object({
        seatIds: zod_1.z.array(zod_1.z.string().uuid("Invalid seat ID format")).min(1, "At least one seat ID is required"),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
