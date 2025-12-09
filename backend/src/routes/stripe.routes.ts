import { Router } from 'express';
import { stripeController } from '../controllers/stripe.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/v1/stripe/payment
 * @desc Initialize a Stripe payment
 * @access Private
 */
router.post('/payment', authMiddleware, stripeController.initializePayment.bind(stripeController));

/**
 * @route POST /api/v1/stripe/webhook
 * @desc Handle Stripe webhook events
 * @access Public
 */
router.post('/webhook', stripeController.handleWebhook.bind(stripeController));

/**
 * @route GET /api/v1/stripe/payment/:paymentIntentId
 * @desc Get payment status
 * @access Private
 */
router.get('/payment/:paymentIntentId', authMiddleware, stripeController.getPaymentStatus.bind(stripeController));

export default router;