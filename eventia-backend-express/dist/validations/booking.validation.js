"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBookingSchema = void 0;
const zod_1 = require("zod");
exports.cancelBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        cancellation_reason: zod_1.z.string().optional()
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Booking ID is required')
    }),
    query: zod_1.z.object({})
});
//# sourceMappingURL=booking.validation.js.map