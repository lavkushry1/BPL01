"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const payment_service_1 = __importDefault(require("../../services/payment.service"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const payment_schema_1 = require("../../schemas/payment.schema");
const apiResponse_1 = require("../../utils/apiResponse");
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
router.get('/upi-settings', auth_middleware_1.authMiddleware, async (req, res, next) => {
    try {
        const settings = await payment_service_1.default.getActiveUpiSettings();
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
router.post('/verify-utr', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(payment_schema_1.paymentSchema.verifyPayment), async (req, res, next) => {
    try {
        const verification = await payment_service_1.default.verifyUtrPayment(req.body);
        apiResponse_1.ApiResponse.success(res, verification, 'Payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
