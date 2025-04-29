"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_controller_1 = require("../controllers/ticket.controller");
const auth_1 = require("../middleware/auth");
const database_1 = require("../middleware/database");
const router = (0, express_1.Router)();
// Add database middleware to all routes
router.use(database_1.databaseMiddleware);
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
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 */
router.post('/tickets/generate', (0, auth_1.auth)(), ticket_controller_1.TicketController.generateTickets);
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
 *     responses:
 *       200:
 *         description: Ticket retrieved successfully
 *       404:
 *         description: Ticket not found
 */
router.get('/tickets/:id', ticket_controller_1.TicketController.getTicketById);
/**
 * @swagger
 * /api/bookings/{bookingId}/tickets:
 *   get:
 *     summary: Get tickets for a booking
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
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 *       404:
 *         description: Booking not found
 */
router.get('/bookings/:bookingId/tickets', (0, auth_1.auth)(), ticket_controller_1.TicketController.getTicketsByBookingId);
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 *       400:
 *         description: Cannot cancel ticket
 *       404:
 *         description: Ticket not found
 */
router.patch('/tickets/:id/cancel', (0, auth_1.auth)(), ticket_controller_1.TicketController.cancelTicket);
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
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               check_in_location:
 *                 type: string
 *               device_id:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket checked in successfully
 *       400:
 *         description: Invalid input or ticket
 *       404:
 *         description: Ticket not found
 */
router.post('/tickets/check-in', (0, auth_1.auth)('admin', 'staff'), ticket_controller_1.TicketController.checkInTicket);
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
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket verification result
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Ticket not found
 */
router.get('/tickets/:id/verify', (0, auth_1.auth)('admin', 'staff'), ticket_controller_1.TicketController.verifyTicket);
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Ticket resent successfully
 *       404:
 *         description: Ticket not found
 */
router.post('/tickets/:id/resend', (0, auth_1.auth)(), ticket_controller_1.TicketController.resendTicket);
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
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/tickets/:id/pdf', ticket_controller_1.TicketController.downloadTicketPdf);
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, used, cancelled]
 *     responses:
 *       200:
 *         description: Event tickets retrieved successfully
 *       403:
 *         description: Unauthorized
 */
router.get('/events/:eventId/tickets', (0, auth_1.auth)('admin', 'organizer'), ticket_controller_1.TicketController.getEventTickets);
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, used, cancelled]
 *     responses:
 *       200:
 *         description: User tickets retrieved successfully
 *       403:
 *         description: Unauthorized
 */
router.get('/users/:userId/tickets', (0, auth_1.auth)(), ticket_controller_1.TicketController.getUserTickets);
exports.default = router;
