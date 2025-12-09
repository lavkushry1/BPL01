"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutoApplyDiscountSchema = exports.getByCodeSchema = exports.getByIdSchema = exports.validateDiscountSchema = exports.applyDiscountSchema = exports.updateDiscountSchema = exports.createDiscountSchema = void 0;
const zod_1 = require("zod");
exports.createDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(3).max(30),
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED']),
        value: zod_1.z.number().positive(),
        max_uses: zod_1.z.number().int().min(0).optional(),
        min_amount: zod_1.z.number().min(0).optional(),
        start_date: zod_1.z.string().datetime(),
        end_date: zod_1.z.string().datetime(),
        is_active: zod_1.z.boolean().optional(),
        description: zod_1.z.string().optional(),
        event_ids: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }),
});
exports.updateDiscountSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        code: zod_1.z.string().min(3).max(30).optional(),
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED']).optional(),
        value: zod_1.z.number().positive().optional(),
        max_uses: zod_1.z.number().int().min(0).optional(),
        min_amount: zod_1.z.number().min(0).optional(),
        start_date: zod_1.z.string().datetime().optional(),
        end_date: zod_1.z.string().datetime().optional(),
        is_active: zod_1.z.boolean().optional(),
        description: zod_1.z.string().optional(),
        event_ids: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }),
});
exports.applyDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        amount: zod_1.z.number().positive(),
        event_id: zod_1.z.string().uuid().optional(),
    }),
});
exports.validateDiscountSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Discount code is required'),
        booking_id: zod_1.z.string().uuid('Invalid booking ID format'),
        total_amount: zod_1.z.number().positive('Total amount must be positive')
    })
});
exports.getByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
exports.getByCodeSchema = zod_1.z.object({
    params: zod_1.z.object({
        code: zod_1.z.string().min(1),
    }),
});
exports.getAutoApplyDiscountSchema = zod_1.z.object({
    query: zod_1.z.object({
        eventId: zod_1.z.string().uuid()
    })
});
//# sourceMappingURL=discount.validation.js.map