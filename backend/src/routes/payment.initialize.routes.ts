import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import * as paymentValidation from '../validations/payment.validation';

const router = Router();

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
router.post(
  '/payments/initialize',
  authenticate,
  validate(paymentValidation.initializePaymentSchema),
  PaymentController.initializePayment
);

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
router.post(
  '/payments/verify',
  authenticate,
  validate(paymentValidation.verifyPaymentUtrSchema),
  PaymentController.submitUtrVerification
);

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
router.get(
  '/payments/status/:paymentId',
  authenticate,
  PaymentController.getPaymentStatus
);

export default router;