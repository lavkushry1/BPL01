import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBookingById,
  saveDeliveryDetails,
  updateBookingStatus
} from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as bookingValidation from '../validations/booking.validation';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - seats
 *               - total_amount
 *               - final_amount
 *             properties:
 *               event_id:
 *                 type: string
 *               seats:
 *                 type: array
 *               total_amount:
 *                 type: number
 *               final_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post(
  '/',
  authenticate,
  validate(bookingValidation.createBookingSchema),
  createBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get(
  '/:id',
  validate(bookingValidation.getBookingSchema),
  getBookingById
);

/**
 * @swagger
 * /api/bookings/delivery-details:
 *   post:
 *     summary: Save delivery details for a booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - name
 *               - phone
 *               - address
 *               - city
 *               - pincode
 *     responses:
 *       201:
 *         description: Delivery details saved successfully
 */
router.post(
  '/delivery-details',
  validate(bookingValidation.saveDeliveryDetailsSchema),
  saveDeliveryDetails
);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 */
router.put(
  '/:id/status',
  validate(bookingValidation.updateBookingStatusSchema),
  updateBookingStatus
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellation_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Cannot cancel booking
 *       404:
 *         description: Booking not found
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate(bookingValidation.cancelBookingSchema),
  cancelBooking
);

export default router;
