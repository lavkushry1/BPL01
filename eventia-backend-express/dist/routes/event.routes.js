"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
// Create validation schemas using Zod
const createEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).max(100),
        description: zod_1.z.string().optional(),
        start_date: zod_1.z.string().datetime(),
        end_date: zod_1.z.string().datetime().optional(),
        venue_id: zod_1.z.string().uuid(),
        category: zod_1.z.string().optional(),
        has_seat_map: zod_1.z.boolean().optional(),
        seat_map_id: zod_1.z.string().uuid().optional(),
        ticket_types: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number().positive(),
            quantity: zod_1.z.number().int().positive()
        })).optional(),
        images: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string().url(),
            alt_text: zod_1.z.string().optional(),
            is_featured: zod_1.z.boolean().optional()
        })).optional()
    })
});
const updateEventSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid()
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).max(100).optional(),
        description: zod_1.z.string().optional(),
        start_date: zod_1.z.string().datetime().optional(),
        end_date: zod_1.z.string().datetime().optional(),
        venue_id: zod_1.z.string().uuid().optional(),
        category: zod_1.z.string().optional(),
        has_seat_map: zod_1.z.boolean().optional(),
        seat_map_id: zod_1.z.string().uuid().optional(),
        ticket_types: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid().optional(),
            name: zod_1.z.string().min(1),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number().positive(),
            quantity: zod_1.z.number().int().positive()
        })).optional(),
        images: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid().optional(),
            url: zod_1.z.string().url(),
            alt_text: zod_1.z.string().optional(),
            is_featured: zod_1.z.boolean().optional()
        })).optional()
    })
});
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with pagination and filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter events by category
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events by date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 */
router.get('/', event_controller_1.EventController.getAllEvents);
/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
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
/**
 * @swagger
 * /api/admin/events:
 *   post:
 *     summary: Create a new event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - start_date
 *               - venue_id
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               venue_id:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *               has_seat_map:
 *                 type: boolean
 *               seat_map_id:
 *                 type: string
 *                 format: uuid
 *               ticket_types:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - price
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                       format: float
 *                     quantity:
 *                       type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - url
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                     alt_text:
 *                       type: string
 *                     is_featured:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/admin/events', auth_1.authenticate, checkAdmin, (0, validate_1.validate)(createEventSchema), event_controller_1.EventController.createEvent);
/**
 * @swagger
 * /api/admin/events/{id}:
 *   put:
 *     summary: Update an existing event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               venue_id:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *               has_seat_map:
 *                 type: boolean
 *               seat_map_id:
 *                 type: string
 *                 format: uuid
 *               ticket_types:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                       format: float
 *                     quantity:
 *                       type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     url:
 *                       type: string
 *                       format: uri
 *                     alt_text:
 *                       type: string
 *                     is_featured:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Event not found
 */
router.put('/admin/events/:id', auth_1.authenticate, checkAdmin, (0, validate_1.validate)(updateEventSchema), event_controller_1.EventController.updateEvent);
/**
 * @swagger
 * /api/admin/events/{id}:
 *   delete:
 *     summary: Delete an event (Admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Event not found
 */
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
 *                           $ref: '#/components/schemas/Seat'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/:id/seats', event_controller_1.EventController.getEventSeats);
exports.default = router;
