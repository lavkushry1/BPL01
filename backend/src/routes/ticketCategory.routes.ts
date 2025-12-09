import { Router } from 'express';
import { TicketCategoryController } from '../controllers/ticketCategory.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TicketCategories
 *   description: Ticket category management endpoints
 */

/**
 * @swagger
 * /api/ticket-categories:
 *   post:
 *     summary: Create a new ticket category
 *     tags: [TicketCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - totalSeats
 *               - eventId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               minimumPrice:
 *                 type: number
 *                 format: float
 *               totalSeats:
 *                 type: integer
 *                 minimum: 1
 *               eventId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Ticket category created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Event not found
 */
router.post('/ticket-categories', auth('admin'), TicketCategoryController.createTicketCategory);

/**
 * @swagger
 * /api/events/{eventId}/ticket-categories:
 *   get:
 *     summary: Get all ticket categories for an event
 *     tags: [TicketCategories]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of ticket categories
 */
router.get('/events/:eventId/ticket-categories', TicketCategoryController.getTicketCategoriesByEventId);

/**
 * @swagger
 * /api/ticket-categories/{id}:
 *   get:
 *     summary: Get a ticket category by ID
 *     tags: [TicketCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket category details
 *       404:
 *         description: Ticket category not found
 */
router.get('/ticket-categories/:id', TicketCategoryController.getTicketCategoryById);

/**
 * @swagger
 * /api/ticket-categories/{id}:
 *   patch:
 *     summary: Update a ticket category
 *     tags: [TicketCategories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               minimumPrice:
 *                 type: number
 *                 format: float
 *               totalSeats:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Ticket category updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Ticket category not found
 */
router.patch('/ticket-categories/:id', auth('admin'), TicketCategoryController.updateTicketCategory);

/**
 * @swagger
 * /api/ticket-categories/{id}:
 *   delete:
 *     summary: Delete a ticket category
 *     tags: [TicketCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Ticket category deleted successfully
 *       404:
 *         description: Ticket category not found
 */
router.delete('/ticket-categories/:id', auth('admin'), TicketCategoryController.deleteTicketCategory);

/**
 * @swagger
 * /api/ticket-categories/{id}/booked-seats:
 *   patch:
 *     summary: Update booked seats count
 *     tags: [TicketCategories]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookedSeats
 *             properties:
 *               bookedSeats:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Booked seats updated successfully
 *       400:
 *         description: Invalid input or booked seats exceeds total seats
 *       404:
 *         description: Ticket category not found
 */
router.patch('/ticket-categories/:id/booked-seats', auth('admin'), TicketCategoryController.updateBookedSeats);

export default router;