"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SeatLockingController = __importStar(require("../controllers/seatLocking.controller"));
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const seatLockingValidation = __importStar(require("../validations/seatLocking.validation"));
const router = (0, express_1.Router)();
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
router.post('/seats/lock', (0, auth_1.auth)(), (0, validate_1.validate)(seatLockingValidation.lockSeatsSchema), SeatLockingController.lockSeats);
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
router.post('/seats/release', (0, auth_1.auth)(), (0, validate_1.validate)(seatLockingValidation.releaseSeatsSchema), SeatLockingController.releaseSeats);
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
router.get('/seats/check-locks', (0, auth_1.auth)(), (0, validate_1.validate)(seatLockingValidation.checkSeatsLockedSchema), SeatLockingController.checkSeatsLocked);
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
router.post('/seats/extend-lock', (0, auth_1.auth)(), (0, validate_1.validate)(seatLockingValidation.extendLockSchema), SeatLockingController.extendLock);
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
router.post('/seats/confirm', (0, auth_1.auth)(), (0, validate_1.validate)(seatLockingValidation.confirmSeatsSchema), SeatLockingController.confirmSeats);
exports.default = router;
//# sourceMappingURL=seatLocking.routes.js.map