"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_service_1 = require("../../services/payment.service");
const validate_1 = require("../../middleware/validate");
const apiResponse_1 = require("../../utils/apiResponse");
const paymentController = __importStar(require("../../controllers/payment.controller"));
const zod_1 = require("zod");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
// Zod validation schemas
const verifyUpiPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        payment_id: zod_1.z.string({
            required_error: 'Payment ID is required'
        }),
        utr_number: zod_1.z.string({
            required_error: 'UTR number is required'
        }).min(6, 'UTR number must be at least 6 characters')
            .max(30, 'UTR number cannot exceed 30 characters')
    })
});
const initiatePaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.string({
            required_error: 'Event ID is required'
        }),
        seatIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat must be selected'),
        userId: zod_1.z.string({
            required_error: 'User ID is required'
        })
    })
});
const getPaymentStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        intentId: zod_1.z.string({
            required_error: 'Payment intent ID is required'
        })
    })
});
const getPaymentByBookingSchema = zod_1.z.object({
    params: zod_1.z.object({
        bookingId: zod_1.z.string({
            required_error: 'Booking ID is required'
        })
    })
});
const recordUpiPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingId: zod_1.z.string({
            required_error: 'Booking ID is required'
        }),
        utrNumber: zod_1.z.string({
            required_error: 'UTR number is required'
        }).min(6, 'UTR number must be at least 6 characters')
            .max(30, 'UTR number cannot exceed 30 characters'),
        paymentDate: zod_1.z.string().datetime().optional().nullable()
    })
});
const generateUpiQrSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number({
            required_error: 'Amount is required',
            invalid_type_error: 'Amount must be a number'
        }),
        upiId: zod_1.z.string().optional()
    })
});
/**
 * @swagger
 * /api/v1/upi-settings:
 *   get:
 *     summary: Get active UPI payment settings
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: UPI settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpiSettings'
 */
router.get('/upi-settings', async (req, res, next) => {
    try {
        console.log('Accessing payment/upi-settings endpoint from payment routes');
        const settings = await payment_service_1.paymentService.getUpiSettings();
        apiResponse_1.ApiResponse.success(res, settings, 'UPI settings retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * @swagger
 * /api/v1/verify-utr:
 *   post:
 *     summary: Verify UTR payment
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentVerify'
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
router.post('/verify-utr', (0, validate_1.validate)(verifyUpiPaymentSchema), async (req, res, next) => {
    try {
        // For unauthenticated access, use a default admin ID or skip the user ID parameter
        const verification = await payment_service_1.paymentService.verifyPayment(req.body.payment_id, req.user?.id || 'system');
        apiResponse_1.ApiResponse.success(res, verification, 'Payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
// User routes (previously authenticated)
router.route('/initiate')
    .post((0, validate_1.validate)(initiatePaymentSchema), paymentController.initiatePayment);
router.route('/status/:intentId')
    .get((0, validate_1.validate)(getPaymentStatusSchema), paymentController.getPaymentStatus);
router.route('/booking/:bookingId')
    .get((0, validate_1.validate)(getPaymentByBookingSchema), (req, res, next) => paymentController.PaymentController.getPaymentByBookingId(req, res, next));
// UPI payment routes
router.route('/upi')
    .post((0, validate_1.validate)(recordUpiPaymentSchema), (req, res, next) => {
    payment_service_1.paymentService.createPayment(req.body)
        .then(result => apiResponse_1.ApiResponse.success(res, result, 'UPI payment recorded successfully'))
        .catch(error => {
        console.error('Error recording UPI payment:', error);
        next(error);
    });
});
router.route('/upi/verify')
    .post((0, validate_1.validate)(verifyUpiPaymentSchema), async (req, res, next) => {
    try {
        const result = await payment_service_1.paymentService.verifyPayment(req.body.payment_id, req.user?.id || 'system');
        apiResponse_1.ApiResponse.success(res, result, 'UPI payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
router.route('/generate-qr')
    .post((0, validate_1.validate)(generateUpiQrSchema), (req, res, next) => paymentController.PaymentController.generateUpiQr(req, res, next));
// Public endpoint for UPI ID configuration
router.get('/admin-upi', async (req, res, next) => {
    try {
        console.log('Accessing payment/admin-upi public endpoint');
        // Get the active UPI setting
        const activeSetting = await (0, db_1.db)('upi_settings')
            .select('*')
            .where({ isactive: true })
            .first();
        if (activeSetting) {
            logger_1.logger.info(`Returning active UPI setting: ${activeSetting.upivpa}`);
            return apiResponse_1.ApiResponse.success(res, {
                upivpa: activeSetting.upivpa,
                id: activeSetting.id
            }, 'Active UPI setting retrieved');
        }
        else {
            // Return a default fallback UPI setting when none exists in database
            const defaultSetting = {
                id: 'default',
                upivpa: '9122036484@hdfc', // Using the required UPI ID as default
                discountamount: 0,
                isactive: true
            };
            logger_1.logger.info('No active UPI setting found, using default');
            return apiResponse_1.ApiResponse.success(res, defaultSetting, 'Using default UPI setting');
        }
    }
    catch (error) {
        logger_1.logger.error('Error fetching UPI settings:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=payment.routes.js.map