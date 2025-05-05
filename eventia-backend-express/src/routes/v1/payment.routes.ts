import { Router } from 'express';
import { auth, authMiddleware } from '../../middleware/auth';
import { paymentService } from '../../services/payment.service';
import { validate } from '../../middleware/validate';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import express, { Request, Response, NextFunction } from 'express';
import * as paymentController from '../../controllers/payment.controller';
import * as paymentValidations from '../../validations/payment.validations';
import { z } from 'zod';
import { db } from '../../db';
import { logger } from '../../utils/logger';

const router = Router();

// Zod validation schemas
const verifyUpiPaymentSchema = z.object({
  body: z.object({
    payment_id: z.string({
      required_error: 'Payment ID is required'
    }),
    utr_number: z.string({
      required_error: 'UTR number is required'
    }).min(6, 'UTR number must be at least 6 characters')
      .max(30, 'UTR number cannot exceed 30 characters')
  })
});

const initiatePaymentSchema = z.object({
  body: z.object({
    eventId: z.string({
      required_error: 'Event ID is required'
    }),
    seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
    userId: z.string({
      required_error: 'User ID is required'
    })
  })
});

const getPaymentStatusSchema = z.object({
  params: z.object({
    intentId: z.string({
      required_error: 'Payment intent ID is required'
    })
  })
});

const getPaymentByBookingSchema = z.object({
  params: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required'
    })
  })
});

const recordUpiPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string({
      required_error: 'Booking ID is required'
    }),
    utrNumber: z.string({
      required_error: 'UTR number is required'
    }).min(6, 'UTR number must be at least 6 characters')
      .max(30, 'UTR number cannot exceed 30 characters'),
    paymentDate: z.string().datetime().optional().nullable()
  })
});

const generateUpiQrSchema = z.object({
  body: z.object({
    amount: z.number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number'
    }),
    upiId: z.string().optional()
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
router.get('/upi-settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Accessing payment/upi-settings endpoint from payment routes');
    const settings = await paymentService.getUpiSettings();
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
router.post('/verify-utr', validate(verifyUpiPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For unauthenticated access, use a default admin ID or skip the user ID parameter
    const verification = await paymentService.verifyPayment(req.body.payment_id, req.user?.id || 'system');
    ApiResponse.success(res, verification, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
});

// User routes (previously authenticated)
router.route('/initiate')
  .post(
    validate(initiatePaymentSchema),
    paymentController.initiatePayment
  );

router.route('/status/:intentId')
  .get(
    validate(getPaymentStatusSchema),
    paymentController.getPaymentStatus
  );

router.route('/booking/:bookingId')
  .get(
    validate(getPaymentByBookingSchema),
    (req: Request, res: Response, next: NextFunction) => paymentController.PaymentController.getPaymentByBookingId(req, res, next)
  );

// UPI payment routes
router.route('/upi')
  .post(
    validate(recordUpiPaymentSchema),
    (req: Request, res: Response, next: NextFunction) => {
      paymentService.createPayment(req.body)
        .then(result => ApiResponse.success(res, result, 'UPI payment recorded successfully'))
        .catch(error => {
          console.error('Error recording UPI payment:', error);
          next(error);
        });
    }
  );

router.route('/upi/verify')
  .post(
    validate(verifyUpiPaymentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await paymentService.verifyPayment(req.body.payment_id, req.user?.id || 'system');
        ApiResponse.success(res, result, 'UPI payment verified successfully');
      } catch (error) {
        next(error);
      }
    }
  );

router.route('/generate-qr')
  .post(
    validate(generateUpiQrSchema),
    (req: Request, res: Response, next: NextFunction) => paymentController.PaymentController.generateUpiQr(req, res, next)
  );

// Public endpoint for UPI ID configuration
router.get('/admin-upi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Accessing payment/admin-upi public endpoint');

    // Get the active UPI setting
    const activeSetting = await db('upi_settings')
      .select('*')
      .where({ isactive: true })
      .first();

    if (activeSetting) {
      logger.info(`Returning active UPI setting: ${activeSetting.upivpa}`);
      return ApiResponse.success(res, {
        upivpa: activeSetting.upivpa,
        id: activeSetting.id
      }, 'Active UPI setting retrieved');
    } else {
      // Return a default fallback UPI setting when none exists in database
      const defaultSetting = {
        id: 'default',
        upivpa: '9122036484@hdfc', // Using the required UPI ID as default
        discountamount: 0,
        isactive: true
      };

      logger.info('No active UPI setting found, using default');
      return ApiResponse.success(res, defaultSetting, 'Using default UPI setting');
    }
  } catch (error) {
    logger.error('Error fetching UPI settings:', error);
    next(error);
  }
});

export default router;
