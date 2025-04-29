"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockSeatsSchema = exports.lockSeatsSchema = exports.updateSeatStatusSchema = exports.releaseReservationSchema = exports.seatReservationSchema = exports.bulkSeatAvailabilitySchema = void 0;
const zod_1 = require("zod");
exports.bulkSeatAvailabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat ID is required'),
        event_id: zod_1.z.string().min(1, 'Event ID is required')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.seatReservationSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat ID is required'),
        user_id: zod_1.z.string().min(1, 'User ID is required'),
        expiration: zod_1.z.number().min(1).optional()
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.releaseReservationSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat ID is required'),
        user_id: zod_1.z.string().min(1, 'User ID is required')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.updateSeatStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['available', 'booked', 'locked', 'selected'], {
            errorMap: () => ({ message: 'Invalid seat status' })
        })
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Seat ID is required')
    }),
    query: zod_1.z.object({})
});
exports.lockSeatsSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat ID is required'),
        user_id: zod_1.z.string().min(1, 'User ID is required'),
        event_id: zod_1.z.string().min(1, 'Event ID is required'),
        lock_duration: zod_1.z.number().min(1).optional()
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.unlockSeatsSchema = zod_1.z.object({
    body: zod_1.z.object({
        seat_ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat ID is required'),
        user_id: zod_1.z.string().min(1, 'User ID is required')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
