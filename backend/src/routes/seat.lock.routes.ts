import { Router } from 'express';
import { SeatController } from '../controllers/seat.controller';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import * as seatValidation from '../validations/seat.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SeatLocking
 *   description: Seat locking and unlocking endpoints
 */

/**
 * @swagger
 * /api/seats/lock:
 *   post:
 *     summary: Lock seats temporarily for a user
 *     tags: [SeatLocking]
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
 *               event_id:
 *                 type: string
 *               lock_duration:
 *                 type: number
 *                 description: "Duration in seconds (default: 900 - 15 minutes)"
 *             required:
 *               - seat_ids
 *               - user_id
 *               - event_id
 *     responses:
 *       200:
 *         description: Seats locked successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: One or more seats are already locked
 */
router.post(
  '/seats/lock',
  auth(),
  validate(seatValidation.lockSeatsSchema),
  SeatController.lockSeats
);

/**
 * @swagger
 * /api/seats/unlock:
 *   delete:
 *     summary: Unlock previously locked seats
 *     tags: [SeatLocking]
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
 *             required:
 *               - seat_ids
 *               - user_id
 *     responses:
 *       200:
 *         description: Seats unlocked successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized to unlock these seats
 */
router.delete(
  '/seats/unlock',
  auth(),
  validate(seatValidation.unlockSeatsSchema),
  SeatController.unlockSeats
);

export default router;