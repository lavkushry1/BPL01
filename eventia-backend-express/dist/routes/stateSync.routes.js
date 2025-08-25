"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stateSync_controller_1 = require("../controllers/stateSync.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const seatLock_1 = require("../models/seatLock");
const router = (0, express_1.Router)();
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
router.post('/locks', (0, auth_1.auth)(), (0, validate_1.validate)(seatLock_1.createSeatLockSchema), stateSync_controller_1.StateSyncController.createSeatLock);
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
router.delete('/locks', (0, auth_1.auth)(), (0, validate_1.validate)(seatLock_1.releaseSeatLockSchema), stateSync_controller_1.StateSyncController.releaseSeatLock);
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
router.get('/locks/:seatId', (0, validate_1.validate)(seatLock_1.checkSeatLockSchema), stateSync_controller_1.StateSyncController.checkSeatLock);
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
router.post('/locks/bulk-check', (0, validate_1.validate)(seatLock_1.bulkCheckSeatLocksSchema), stateSync_controller_1.StateSyncController.bulkCheckSeatLocks);
exports.default = router;
//# sourceMappingURL=stateSync.routes.js.map