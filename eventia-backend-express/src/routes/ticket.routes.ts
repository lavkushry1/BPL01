import { NextFunction, Request, Response, Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { auth } from '../middleware/auth';
import { DatabaseRequest, databaseMiddleware } from '../middleware/database';
import { validate } from '../middleware/validate';
import * as ticketValidation from '../validations/ticket.validation';

const router = Router();

// Add database middleware to all routes
router.use(databaseMiddleware);

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
router.post(
  '/tickets/generate',
  auth(),
  validate(ticketValidation.generateTicketsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.generateTickets(req as DatabaseRequest, res, next);
  }
);

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
router.get(
  '/tickets/:id',
  auth(),
  validate(ticketValidation.getTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.getTicketById(req as DatabaseRequest, res, next);
  }
);

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
router.get(
  '/tickets/booking/:booking_id',
  auth(),
  validate(ticketValidation.getTicketsByBookingSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.getTicketsByBookingId(req as DatabaseRequest, res, next);
  }
);

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
router.post(
  '/tickets/:id/cancel',
  auth(),
  validate(ticketValidation.cancelTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.cancelTicket(req as DatabaseRequest, res, next);
  }
);

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
router.post(
  '/tickets/:id/checkin',
  auth(),
  validate(ticketValidation.checkInTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.checkInTicket(req as DatabaseRequest, res, next);
  }
);

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
router.post(
  '/tickets/:id/verify',
  auth(),
  validate(ticketValidation.verifyTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.verifyTicket(req as DatabaseRequest, res, next);
  }
);

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
router.post(
  '/tickets/:id/resend',
  auth(),
  validate(ticketValidation.resendTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.resendTicket(req as DatabaseRequest, res, next);
  }
);

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
router.get(
  '/tickets/:id/pdf',
  auth(),
  validate(ticketValidation.getTicketSchema),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.downloadTicketPdf(req as DatabaseRequest, res, next);
  }
);

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
router.get(
  '/events/:event_id/tickets',
  auth(),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.getEventTickets(req as DatabaseRequest, res, next);
  }
);

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
router.get(
  '/users/:userId/tickets',
  auth(),
  (req: Request, res: Response, next: NextFunction) => {
    return TicketController.getUserTickets(req as DatabaseRequest, res, next);
  }
);

export default router;
