import { Router } from 'express';
import { PublicController } from '../../../controllers/public.controller';
import { cacheMiddleware } from '../../../middleware/cache';

const router = Router();

/**
 * @swagger
 * /api/v1/public/upi:
 *   get:
 *     summary: Get active UPI setting for payment
 *     tags: [Public, UPI]
 *     responses:
 *       200:
 *         description: Active UPI setting details
 */
router.get('/', 
  // Apply caching for public UPI endpoint (5 minutes)
  cacheMiddleware({ ttl: 300, keyPrefix: 'public:upi:' }),
  PublicController.getActiveUpiSetting
);

/**
 * @swagger
 * /api/v1/public/upi/generate-qr:
 *   post:
 *     summary: Generate QR code for UPI payment
 *     tags: [Public, UPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: string
 *                 description: Data to encode in the QR code
 *     responses:
 *       200:
 *         description: Generated QR code
 *       400:
 *         description: Invalid input
 */
router.post('/generate-qr', PublicController.generateQrCode);

export default router; 