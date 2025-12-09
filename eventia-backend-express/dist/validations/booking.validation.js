"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingSchema = exports.cancelBookingSchema = exports.saveDeliveryDetailsSchema = exports.updateBookingStatusSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        event_id: zod_1.z.string().uuid('Invalid event ID format'),
        seat_ids: zod_1.z.array(zod_1.z.string().uuid('Invalid seat ID format')).optional(),
        amount: zod_1.z.number().positive('Amount must be positive'),
        payment_method: zod_1.z.enum(['STRIPE', 'UPI', 'CASH', 'CARD']).optional().default('STRIPE'),
    }),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid booking ID format'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED']),
    }),
});
exports.saveDeliveryDetailsSchema = zod_1.z.object({
    body: zod_1.z.object({
        booking_id: zod_1.z.string().uuid('Invalid booking ID format'),
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
        phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
        address: zod_1.z.string().min(5, 'Address must be at least 5 characters'),
        city: zod_1.z.string().min(2, 'City must be at least 2 characters'),
        pincode: zod_1.z.string().regex(/^\d{4,10}$/, 'Invalid pincode format'),
    }),
});
exports.cancelBookingSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid booking ID format'),
    }),
    body: zod_1.z.object({
        cancellation_reason: zod_1.z.string().optional(),
    }),
});
exports.getBookingSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid booking ID format'),
    }),
});
//# sourceMappingURL=booking.validation.js.map