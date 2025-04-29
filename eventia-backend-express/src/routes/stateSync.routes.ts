import { Router } from 'express';
import { StateSyncController } from '../controllers/stateSync.controller';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import {
  createSeatLockSchema,
  releaseSeatLockSchema,
  checkSeatLockSchema,
  bulkCheckSeatLocksSchema
} from '../models/seatLock';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: State
 *   description: State synchronization and seat lock management
 */

/**
 * @swagger
 * /api/v1/state/locks:
 *   post:
 *     summary: Create a seat lock
 *     tags: [State]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seatId
 *               - userId
 *             properties:
 *               seatId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               duration:
 *                 type: number
 *                 description: Duration in seconds (default 300)
 *     responses:
 *       201:
 *         description: Seat lock created successfully
 *       409:
 *         description: Seat is already locked
 */
router.post(
  '/locks',
  auth(),
  validate(createSeatLockSchema),
  StateSyncController.createSeatLock
);

/**
 * @swagger
 * /api/v1/state/locks:
 *   delete:
 *     summary: Release a seat lock
 *     tags: [State]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seatId
 *               - userId
 *             properties:
 *               seatId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Seat lock released successfully
 *       403:
 *         description: Cannot release lock owned by another user
 *       404:
 *         description: Seat lock not found
 */
router.delete(
  '/locks',
  auth(),
  validate(releaseSeatLockSchema),
  StateSyncController.releaseSeatLock
);

/**
 * @swagger
 * /api/v1/state/locks/{seatId}:
 *   get:
 *     summary: Check if a seat is locked
 *     tags: [State]
 *     parameters:
 *       - in: path
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seat lock information
 */
router.get(
  '/locks/:seatId',
  validate(checkSeatLockSchema),
  StateSyncController.checkSeatLock
);

/**
 * @swagger
 * /api/v1/state/locks/bulk-check:
 *   post:
 *     summary: Bulk check seat locks
 *     tags: [State]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seatIds
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Bulk seat lock information
 */
router.post(
  '/locks/bulk-check',
  validate(bulkCheckSeatLocksSchema),
  StateSyncController.bulkCheckSeatLocks
);

export default router; 