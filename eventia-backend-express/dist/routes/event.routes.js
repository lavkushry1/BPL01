"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_1 = require("../middleware/auth");
// Temporarily comment out the validation import until we install Joi
// import * as eventValidation from '../validations/event.validation';
// Create placeholder validation schemas until Joi is properly installed
const createEventSchema = {};
const updateEventSchema = {};
const router = (0, express_1.Router)();
// Public routes
router.get('/', event_controller_1.EventController.getAllEvents);
router.get('/:id', event_controller_1.EventController.getEventById);
// Admin routes - protected
// Make sure users are authenticated and have admin role
const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({
        status: 'error',
        message: 'Access forbidden. Requires admin privileges.'
    });
};
router.post('/admin/events', auth_1.authenticate, checkAdmin, 
// Temporarily disabled until Joi validation is properly set up
// validate(eventValidation.createEventSchema),
event_controller_1.EventController.createEvent);
router.put('/admin/events/:id', auth_1.authenticate, checkAdmin, 
// Temporarily disabled until Joi validation is properly set up
// validate(eventValidation.updateEventSchema),
event_controller_1.EventController.updateEvent);
router.delete('/admin/events/:id', auth_1.authenticate, checkAdmin, event_controller_1.EventController.deleteEvent);
/**
 * @swagger
 * /api/events/{id}/seats:
 *   get:
 *     summary: Get all seats for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The event ID
 *     responses:
 *       200:
 *         description: The seats for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seats:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             label:
 *                               type: string
 *                             section:
 *                               type: string
 *                             row:
 *                               type: string
 *                             seatNumber:
 *                               type: integer
 *                             status:
 *                               type: string
 *                               enum: [available, locked, booked]
 *                             price:
 *                               type: number
 *                             eventId:
 *                               type: string
 *                               format: uuid
 *                             locked_by:
 *                               type: string
 *                               nullable: true
 *                             lock_expires_at:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/events/:id/seats', event_controller_1.EventController.getEventSeats);
exports.default = router;
