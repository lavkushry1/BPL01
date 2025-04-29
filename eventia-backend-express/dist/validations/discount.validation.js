"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDiscountSchema = void 0;
const zod_1 = require("zod");
exports.validateDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Discount code is required'),
        booking_id: zod_1.z.string().uuid('Invalid booking ID format'),
        total_amount: zod_1.z.number().positive('Total amount must be positive')
    })
});
