"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookSchema = exports.updateUpiSettingsSchema = exports.upiSettingsValidationSchema = exports.rejectPaymentSchema = exports.verifyPaymentSchema = exports.getAllPaymentsSchema = exports.getPaymentByBookingIdSchema = exports.getPaymentSchema = exports.updateUtrSchema = exports.createPaymentSchema = exports.verifyPaymentUtrSchema = exports.initializePaymentSchema = void 0;
const zod_1 = require("zod");
const payment_1 = require("../models/payment");
exports.initializePaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        booking_id: zod_1.z.string().uuid('Invalid booking ID format'),
        amount: zod_1.z.number().positive('Amount must be positive'),
        payment_method: zod_1.z.enum(['upi', 'card', 'netbanking', 'wallet'], {
            errorMap: () => ({ message: 'Invalid payment method' })
        }),
        currency: zod_1.z.string().default('INR').optional(),
        user_id: zod_1.z.string().uuid('Invalid user ID format')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.verifyPaymentUtrSchema = zod_1.z.object({
    body: zod_1.z.object({
        payment_id: zod_1.z.string().uuid('Invalid payment ID format'),
        utr_number: zod_1.z.string().min(1, 'UTR number is required'),
        user_id: zod_1.z.string().uuid('Invalid user ID format')
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.createPaymentSchema = zod_1.z.object({
    body: payment_1.paymentSchema,
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.updateUtrSchema = zod_1.z.object({
    body: zod_1.z.object({
        utrNumber: zod_1.z.string().min(1, 'UTR number is required')
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Payment ID is required')
    }),
    query: zod_1.z.object({})
});
exports.getPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Payment ID is required')
    }),
    query: zod_1.z.object({})
});
exports.getPaymentByBookingIdSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        bookingId: zod_1.z.string().min(1, 'Booking ID is required')
    }),
    query: zod_1.z.object({})
});
exports.getAllPaymentsSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({}),
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        status: zod_1.z.enum(['pending', 'verified', 'rejected', 'refunded']).optional()
    })
});
exports.verifyPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Payment ID is required')
    }),
    query: zod_1.z.object({})
});
exports.rejectPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({}),
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Payment ID is required')
    }),
    query: zod_1.z.object({})
});
exports.upiSettingsValidationSchema = zod_1.z.object({
    body: payment_1.upiSettingsSchema,
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
exports.updateUpiSettingsSchema = zod_1.z.object({
    body: payment_1.upiSettingsSchema,
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Settings ID is required')
    }),
    query: zod_1.z.object({})
});
exports.webhookSchema = zod_1.z.object({
    body: zod_1.z.object({
        event: zod_1.z.string().min(1, 'Event type is required'),
        paymentId: zod_1.z.string().optional(),
        transactionId: zod_1.z.string().optional(),
        failureReason: zod_1.z.string().optional(),
        refundAmount: zod_1.z.number().optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional()
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({})
});
