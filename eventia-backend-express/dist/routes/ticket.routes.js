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
const ticket_controller_1 = require("../controllers/ticket.controller");
const auth_1 = require("../middleware/auth");
const database_1 = require("../middleware/database");
const validate_1 = require("../middleware/validate");
const ticketValidation = __importStar(require("../validations/ticket.validation"));
const router = (0, express_1.Router)();
// Add database middleware to all routes
router.use(database_1.databaseMiddleware);
/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *           format: uuid
 *         event_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         seat_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         ticket_number:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, used, cancelled]
 *         price:
 *           type: number
 *         ticket_type:
 *           type: string
 *         seat_info:
 *           type: string
 *           nullable: true
 *         check_in_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         check_in_location:
 *           type: string
 *           nullable: true
 *         cancellation_reason:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */
/**
 * @swagger
 * /api/tickets/generate:
 *   post:
 *     summary: Generate tickets for a booking
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - event_id
 *               - user_id
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               email:
 *                 type: string
 *                 format: email
 *               send_email:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tickets generated successfully
 */
router.post('/tickets/generate', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.generateTicketsSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.generateTickets(req, res, next);
});
/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket retrieved successfully
 */
router.get('/tickets/:id', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.getTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.getTicketById(req, res, next);
});
/**
 * @swagger
 * /api/tickets/booking/{bookingId}:
 *   get:
 *     summary: Get tickets by booking ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 */
router.get('/tickets/booking/:booking_id', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.getTicketsByBookingSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.getTicketsByBookingId(req, res, next);
});
/**
 * @swagger
 * /api/tickets/{id}/cancel:
 *   patch:
 *     summary: Cancel a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 */
router.post('/tickets/:id/cancel', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.cancelTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.cancelTicket(req, res, next);
});
/**
 * @swagger
 * /api/tickets/check-in:
 *   post:
 *     summary: Check in a ticket at event
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *               - event_id
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *                 description: Ticket ID
 *               event_id:
 *                 type: string
 *                 format: uuid
 *                 description: Event ID
 *               check_in_location:
 *                 type: string
 *                 description: Location where check-in occurred
 *               device_id:
 *                 type: string
 *                 description: ID of the device used for check-in
 *               notes:
 *                 type: string
 *                 description: Additional notes about check-in
 *     responses:
 *       200:
 *         description: Ticket checked in successfully
 */
router.post('/tickets/:id/checkin', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.checkInTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.checkInTicket(req, res, next);
});
/**
 * @swagger
 * /api/tickets/{id}/verify:
 *   get:
 *     summary: Verify a ticket's validity
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Ticket verification result
 */
router.post('/tickets/:id/verify', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.verifyTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.verifyTicket(req, res, next);
});
/**
 * @swagger
 * /api/tickets/{id}/resend:
 *   post:
 *     summary: Resend ticket to user's email
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Override email address (optional)
 *     responses:
 *       200:
 *         description: Ticket resent successfully
 */
router.post('/tickets/:id/resend', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.resendTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.resendTicket(req, res, next);
});
/**
 * @swagger
 * /api/tickets/{id}/pdf:
 *   get:
 *     summary: Download ticket as PDF
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: PDF ticket file
 */
router.get('/tickets/:id/pdf', (0, auth_1.auth)(), (0, validate_1.validate)(ticketValidation.getTicketSchema), (req, res, next) => {
    return ticket_controller_1.TicketController.downloadTicketPdf(req, res, next);
});
/**
 * @swagger
 * /api/events/{eventId}/tickets:
 *   get:
 *     summary: Get tickets for an event (admin only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event tickets retrieved successfully
 */
router.get('/events/:event_id/tickets', (0, auth_1.auth)(), (req, res, next) => {
    return ticket_controller_1.TicketController.getEventTickets(req, res, next);
});
/**
 * @swagger
 * /api/users/{userId}/tickets:
 *   get:
 *     summary: Get user's tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User tickets retrieved successfully
 */
router.get('/users/:userId/tickets', (0, auth_1.auth)(), (req, res, next) => {
    return ticket_controller_1.TicketController.getUserTickets(req, res, next);
});
exports.default = router;
//# sourceMappingURL=ticket.routes.js.map