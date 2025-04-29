import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate } from '../middleware/validate';
import * as paymentValidation from '../validations/payment.validation';
import { auth } from '../middleware/auth';

const router = Router();

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
router.post(
  '/', 
  auth(), 
  validate(paymentValidation.createPaymentSchema), 
  PaymentController.createPayment
);

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
router.put(
  '/:id/utr', 
  validate(paymentValidation.updateUtrSchema), 
  PaymentController.updateUtrNumber
);

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
router.put(
  '/:id/verify', 
  auth('admin'), 
  validate(paymentValidation.verifyPaymentSchema), 
  PaymentController.verifyPayment
);

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
router.put(
  '/:id/reject', 
  auth('admin'), 
  validate(paymentValidation.rejectPaymentSchema), 
  PaymentController.rejectPayment
);

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
router.get(
  '/:id', 
  auth(), 
  validate(paymentValidation.getPaymentSchema), 
  PaymentController.getPaymentById
);

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
router.get(
  '/booking/:bookingId', 
  auth(), 
  validate(paymentValidation.getPaymentByBookingIdSchema), 
  PaymentController.getPaymentByBookingId
);

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
router.get(
  '/', 
  auth('admin'), 
  validate(paymentValidation.getAllPaymentsSchema), 
  PaymentController.getAllPayments
);

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
router.post(
  '/webhook',
  validate(paymentValidation.webhookSchema),
  PaymentController.handlePaymentWebhook
);

export default router;
