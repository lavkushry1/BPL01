import { Router } from 'express';
import { SeatController } from '../controllers/seat.controller';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as seatValidation from '../validations/seat.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Seats
 *   description: Seat management endpoints
 */

/**
 * @swagger
 * /api/venues/{venueId}/sections/{sectionId}/seats:
 *   get:
 *     summary: Get all seats for a venue section
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seats retrieved successfully
 *       404:
 *         description: Venue or section not found
 */
router.get(
  '/venues/:venueId/sections/:sectionId/seats',
  validate(seatValidation.getSeatsSchema),
  SeatController.getSeats
);

/**
 * @swagger
 * /api/seats/reserve:
 *   post:
 *     summary: Reserve seats temporarily
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seat_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               user_id:
 *                 type: string
 *               expiration:
 *                 type: number
 *                 description: "Seconds until reservation expires (default: 900)"
 *     responses:
 *       200:
 *         description: Seats reserved successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: One or more seats not found
 *       409:
 *         description: One or more seats are not available
 */
router.post(
  '/seats/reserve',
  auth(),
  validate(seatValidation.seatReservationSchema),
  SeatController.reserveSeats
);

/**
 * @swagger
 * /api/seats/reserve:
 *   delete:
 *     summary: Release seat reservation
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seat_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation released successfully
 *       400:
 *         description: Invalid input
 */
router.delete(
  '/seats/reserve',
  auth(),
  validate(seatValidation.releaseReservationSchema),
  SeatController.releaseReservation
);

/**
 * @swagger
 * /api/seats/{id}/status:
 *   put:
 *     summary: Update seat status (admin only)
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
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
 *               status:
 *                 type: string
 *                 enum: [available, booked, locked, selected]
 *     responses:
 *       200:
 *         description: Seat status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Seat not found
 */
router.put(
  '/seats/:id/status',
  auth('admin'),
  validate(seatValidation.updateSeatStatusSchema),
  SeatController.updateSeatStatus
);

/**
 * @swagger
 * /api/v1/seats/bulk-availability:
 *   post:
 *     summary: Check availability for multiple seats at once
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seat_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               event_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seat availability checked successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/seats/bulk-availability',
  validate(seatValidation.bulkSeatAvailabilitySchema),
  SeatController.bulkCheckAvailability
);

/**
 * @swagger
 * /api/v1/events/{eventId}/stadium-layout:
 *   get:
 *     summary: Get stadium layout with block-level availability
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stadium layout retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get(
  '/events/:eventId/stadium-layout',
  SeatController.getStadiumLayout
);

/**
 * @swagger
 * /api/v1/events/{eventId}/blocks/{section}/seats:
 *   get:
 *     summary: Get individual seats for a specific block/section
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block seats retrieved successfully
 *       404:
 *         description: Block not found
 */
router.get(
  '/events/:eventId/blocks/:section/seats',
  SeatController.getBlockSeats
);

export default router;
