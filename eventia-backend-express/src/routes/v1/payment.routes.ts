import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import paymentService from '../../services/payment.service';
import { validate } from '../../middlewares/validation.middleware';
import { paymentSchema } from '../../schemas/payment.schema';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

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
router.get('/upi-settings', authMiddleware, async (req, res, next) => {
  try {
    const settings = await paymentService.getActiveUpiSettings();
    ApiResponse.success(res, settings, 'UPI settings retrieved successfully');
  } catch (error) {
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
router.post('/verify-utr', authMiddleware, validate(paymentSchema.verifyPayment), async (req, res, next) => {
  try {
    const verification = await paymentService.verifyUtrPayment(req.body);
    ApiResponse.success(res, verification, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
