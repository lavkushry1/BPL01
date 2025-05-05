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
const auth_1 = require("../../middleware/auth");
const payment_service_1 = require("../../services/payment.service");
const validate_1 = require("../../middleware/validate");
const apiResponse_1 = require("../../utils/apiResponse");
const paymentController = __importStar(require("../../controllers/payment.controller"));
const paymentValidations = __importStar(require("../../validations/payment.validations"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/v1/upi-settings:
 *   get:
 *     summary: Get active UPI payment settings
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: UPI settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpiSettings'
 */
router.get('/upi-settings', auth_1.authMiddleware, async (req, res, next) => {
    try {
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
 *     security:
 *       - bearerAuth: []
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
router.post('/verify-utr', auth_1.authMiddleware, (0, validate_1.validate)(paymentValidations.verifyUpiPayment), async (req, res, next) => {
    try {
        const verification = await payment_service_1.paymentService.verifyPayment(req.body.payment_id, req.user?.id);
        apiResponse_1.ApiResponse.success(res, verification, 'Payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
// User routes (authenticated)
router.route('/initiate')
    .post((0, auth_1.auth)(), (0, validate_1.validate)(paymentValidations.initiatePayment), paymentController.initiatePayment);
router.route('/status/:intentId')
    .get((0, auth_1.auth)(), (0, validate_1.validate)(paymentValidations.getPaymentStatus, 'params'), paymentController.getPaymentStatus);
router.route('/booking/:bookingId')
    .get((0, auth_1.auth)(), (0, validate_1.validate)(paymentValidations.getPaymentByBooking, 'params'), (req, res) => paymentController.PaymentController.getPaymentByBookingId(req, res));
// UPI payment routes
router.route('/upi')
    .post((0, auth_1.auth)(), (0, validate_1.validate)(paymentValidations.recordUpiPayment), (req, res) => payment_service_1.paymentService.createPayment(req.body)
    .then(result => apiResponse_1.ApiResponse.success(res, result, 'UPI payment recorded successfully'))
    .catch(error => {
    console.error('Error recording UPI payment:', error);
    next(error);
}));
router.route('/upi/verify')
    .post((0, auth_1.auth)(), (0, validate_1.validate)(paymentValidations.verifyUpiPayment), async (req, res, next) => {
    try {
        const result = await payment_service_1.paymentService.verifyPayment(req.body.payment_id, req.user?.id);
        apiResponse_1.ApiResponse.success(res, result, 'UPI payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
router.route('/upi/generate-qr')
    .post((0, auth_1.auth)(), (req, res) => paymentController.PaymentController.generateUpiQr(req, res));
exports.default = router;
