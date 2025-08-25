"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmSeatsSchema = exports.extendLockSchema = exports.checkSeatsLockedSchema = exports.releaseSeatsSchema = exports.lockSeatsSchema = void 0;
const zod_1 = require("zod");
exports.lockSeatsSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().uuid('Invalid event ID format'),
        user_id: zod_1.z.string().uuid('Invalid user ID format'),
        duration: zod_1.z.number().positive('Duration must be positive').optional()
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.releaseSeatsSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().uuid('Invalid event ID format'),
        user_id: zod_1.z.string().uuid('Invalid user ID format')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.checkSeatsLockedSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({}),
    query: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().uuid('Invalid event ID format')
    })
});
exports.extendLockSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().uuid('Invalid event ID format'),
        user_id: zod_1.z.string().uuid('Invalid user ID format'),
        duration: zod_1.z.number().positive('Duration must be positive').optional()
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.confirmSeatsSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().uuid('Invalid event ID format'),
        user_id: zod_1.z.string().uuid('Invalid user ID format'),
        booking_id: zod_1.z.string().uuid('Invalid booking ID format')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
//# sourceMappingURL=seatLocking.validation.js.map