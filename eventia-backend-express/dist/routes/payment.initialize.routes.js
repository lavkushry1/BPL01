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
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const paymentValidation = __importStar(require("../validations/payment.validation"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: PaymentProcessing
 *   description: Payment processing endpoints
 */
/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a new payment
 *     tags: [PaymentProcessing]
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
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 format: float
 *               payment_method:
 *                 type: string
 *                 enum: [upi, card, netbanking, wallet]
 *               currency:
 *                 type: string
 *                 default: INR
 *               user_id:
 *                 type: string
 *                 format: uuid
 *             required:
 *               - booking_id
 *               - amount
 *               - payment_method
 *               - user_id
 *     responses:
 *       201:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 */
router.post('/payments/initialize', auth_1.authenticate, (0, validate_1.validate)(paymentValidation.initializePaymentSchema), payment_controller_1.PaymentController.initializePayment);
/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify a payment with UTR number
 *     tags: [PaymentProcessing]
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
 *                 format: uuid
 *               utr_number:
 *                 type: string
 *               user_id:
 *                 type: string
 *                 format: uuid
 *             required:
 *               - payment_id
 *               - utr_number
 *               - user_id
 *     responses:
 *       200:
 *         description: Payment verification submitted successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Payment not found
 */
router.post('/payments/verify', auth_1.authenticate, (0, validate_1.validate)(paymentValidation.verifyPaymentUtrSchema), payment_controller_1.PaymentController.submitUtrVerification);
/**
 * @swagger
 * /api/payments/status/{paymentId}:
 *   get:
 *     summary: Check payment status
 *     tags: [PaymentProcessing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/payments/status/:paymentId', auth_1.authenticate, payment_controller_1.PaymentController.getPaymentStatus);
exports.default = router;
