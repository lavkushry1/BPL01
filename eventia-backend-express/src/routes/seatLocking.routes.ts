import { Router } from 'express';
import { SeatLockingController } from '../controllers/seatLocking.controller';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import * as seatLockingValidation from '../validations/seatLocking.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SeatLocking
 *   description: Seat locking and reservation endpoints
 */

/**
 * @swagger
 * /api/seats/lock:
 *   post:
 *     summary: Lock seats for a user during booking process
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
 *                   format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               duration:
 *                 type: number
 *                 description: Lock duration in seconds
 *             required:
 *               - seat_ids
 *               - event_id
 *               - user_id
 *     responses:
 *       200:
 *         description: Seats locked successfully
 *       400:
 *         description: Invalid input or seats already locked
 */
router.post(
  '/seats/lock',
  auth(),
  validate(seatLockingValidation.lockSeatsSchema),
  SeatLockingController.lockSeats
);

/**
 * @swagger
 * /api/seats/release:
 *   post:
 *     summary: Release locked seats
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
 *                   format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *             required:
 *               - seat_ids
 *               - event_id
 *               - user_id
 *     responses:
 *       200:
 *         description: Seats released successfully
 *       400:
 *         description: Invalid input or unauthorized release attempt
 */
router.post(
  '/seats/release',
  auth(),
  validate(seatLockingValidation.releaseSeatsSchema),
  SeatLockingController.releaseSeats
);

/**
 * @swagger
 * /api/seats/check-locks:
 *   get:
 *     summary: Check if seats are locked
 *     tags: [SeatLocking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: seat_ids
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seat lock status retrieved
 *       400:
 *         description: Invalid input
 */
router.get(
  '/seats/check-locks',
  auth(),
  validate(seatLockingValidation.checkSeatsLockedSchema),
  SeatLockingController.checkSeatsLocked
);

/**
 * @swagger
 * /api/seats/extend-lock:
 *   post:
 *     summary: Extend lock duration for seats
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
 *                   format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               duration:
 *                 type: number
 *                 description: New lock duration in seconds
 *             required:
 *               - seat_ids
 *               - event_id
 *               - user_id
 *     responses:
 *       200:
 *         description: Lock extended successfully
 *       400:
 *         description: Invalid input or unauthorized extension attempt
 */
router.post(
  '/seats/extend-lock',
  auth(),
  validate(seatLockingValidation.extendLockSchema),
  SeatLockingController.extendLock
);

/**
 * @swagger
 * /api/seats/confirm:
 *   post:
 *     summary: Confirm seats for a booking
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
 *                   format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *             required:
 *               - seat_ids
 *               - event_id
 *               - user_id
 *               - booking_id
 *     responses:
 *       200:
 *         description: Seats confirmed successfully
 *       400:
 *         description: Invalid input or unauthorized confirmation attempt
 */
router.post(
  '/seats/confirm',
  auth(),
  validate(seatLockingValidation.confirmSeatsSchema),
  SeatLockingController.confirmSeats
);

export default router;