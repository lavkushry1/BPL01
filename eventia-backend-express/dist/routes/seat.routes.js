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
const seat_1 = require("../models/seat");
const seatValidation = __importStar(require("../validations/seat.validation"));
const router = (0, express_1.Router)();
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
router.get('/venues/:venueId/sections/:sectionId/seats', seat_controller_1.SeatController.getSeats);
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
router.post('/seats/reserve', (0, auth_1.auth)(), (0, validate_1.validate)(seat_1.SeatReservationSchema), seat_controller_1.SeatController.reserveSeats);
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
router.delete('/seats/reserve', (0, auth_1.auth)(), seat_controller_1.SeatController.releaseReservation);
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
router.put('/seats/:id/status', (0, auth_1.auth)('admin'), seat_controller_1.SeatController.updateSeatStatus);
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
router.post('/seats/bulk-availability', (0, validate_1.validate)(seatValidation.bulkSeatAvailabilitySchema), seat_controller_1.SeatController.bulkCheckAvailability);
exports.default = router;
