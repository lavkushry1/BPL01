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
const seat_controller_1 = require("../controllers/seat.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const seatValidation = __importStar(require("../validations/seat.validation"));
const router = (0, express_1.Router)();
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
router.post('/seats/lock', (0, auth_1.auth)(), (0, validate_1.validate)(seatValidation.lockSeatsSchema), seat_controller_1.SeatController.lockSeats);
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
router.delete('/seats/unlock', (0, auth_1.auth)(), (0, validate_1.validate)(seatValidation.unlockSeatsSchema), seat_controller_1.SeatController.unlockSeats);
exports.default = router;
//# sourceMappingURL=seat.lock.routes.js.map