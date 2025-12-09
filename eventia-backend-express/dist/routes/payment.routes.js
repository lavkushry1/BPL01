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
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const paymentValidation = __importStar(require("../validations/payment.validation"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */
/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentCreate'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', (0, auth_1.auth)(), (0, validate_1.validate)(paymentValidation.createPaymentSchema), payment_controller_1.PaymentController.createPayment);
/**
 * @swagger
 * /api/v1/payments/initialize:
 *   post:
 *     summary: Initialize a payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment initialized successfully
 */
router.post('/initialize', (0, auth_1.auth)(), (0, validate_1.validate)(paymentValidation.initializePaymentSchema), payment_controller_1.PaymentController.initializePayment);
/**
 * @swagger
 * /api/v1/payments/verify:
 *   post:
 *     summary: Submit UTR verification for a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_id:
 *                 type: string
 *               utr_number:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: UTR verification submitted successfully
 */
router.post('/verify', (0, auth_1.auth)(), (0, validate_1.validate)(paymentValidation.verifyPaymentUtrSchema), payment_controller_1.PaymentController.submitUtrVerification);
/**
 * @swagger
 * /api/v1/payments/{id}/utr:
 *   put:
 *     summary: Update UTR number for payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               utrNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: UTR number updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put('/:id/utr', (0, validate_1.validate)(paymentValidation.updateUtrSchema), payment_controller_1.PaymentController.updateUtrNumber);
/**
 * @swagger
 * /api/v1/payments/{id}/verify:
 *   put:
 *     summary: Verify a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid payment status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put('/:id/verify', (0, auth_1.auth)('admin'), (0, validate_1.validate)(paymentValidation.verifyPaymentSchema), payment_controller_1.PaymentController.verifyPayment);
/**
 * @swagger
 * /api/v1/payments/{id}/reject:
 *   put:
 *     summary: Reject a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment rejected successfully
 *       400:
 *         description: Invalid payment status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put('/:id/reject', (0, auth_1.auth)('admin'), (0, validate_1.validate)(paymentValidation.rejectPaymentSchema), payment_controller_1.PaymentController.rejectPayment);
/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', (0, auth_1.auth)(), (0, validate_1.validate)(paymentValidation.getPaymentSchema), payment_controller_1.PaymentController.getPaymentById);
/**
 * @swagger
 * /api/v1/payments/booking/{bookingId}:
 *   get:
 *     summary: Get payment by booking ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/booking/:bookingId', (0, auth_1.auth)(), (0, validate_1.validate)(paymentValidation.getPaymentByBookingIdSchema), payment_controller_1.PaymentController.getPaymentByBookingId);
/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments with pagination and filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected, refunded]
 *         description: Filter by payment status
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Server error
 */
router.get('/', (0, auth_1.auth)('admin'), (0, validate_1.validate)(paymentValidation.getAllPaymentsSchema), payment_controller_1.PaymentController.getAllPayments);
/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Handle payment webhook notifications
 *     tags: [Payments]
 *     description: Endpoint for payment providers to send webhook notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: payment.success
 *               paymentId:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post('/webhook', (0, validate_1.validate)(paymentValidation.webhookSchema), payment_controller_1.PaymentController.handlePaymentWebhook);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map