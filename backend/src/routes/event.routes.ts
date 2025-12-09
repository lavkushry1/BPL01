import { Router, Request, Response, NextFunction } from 'express';
import { EventController, listCategories } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload, uploadSingle } from '../middleware/upload';
import { z } from 'zod';

// Create validation schemas using Zod
const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
    venue_id: z.string().uuid(),
    category: z.string().optional(),
    has_seat_map: z.boolean().optional(),
    seat_map_id: z.string().uuid().optional(),
    ticket_types: z.array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        quantity: z.number().int().positive()
      })
    ).optional(),
    images: z.array(
      z.object({
        url: z.string().url(),
        alt_text: z.string().optional(),
        is_featured: z.boolean().optional()
      })
    ).optional()
  })
});

const updateEventSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    venue_id: z.string().uuid().optional(),
    category: z.string().optional(),
    has_seat_map: z.boolean().optional(),
    seat_map_id: z.string().uuid().optional(),
    ticket_types: z.array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        quantity: z.number().int().positive()
      })
    ).optional(),
    images: z.array(
      z.object({
        id: z.string().uuid().optional(),
        url: z.string().url(),
        alt_text: z.string().optional(),
        is_featured: z.boolean().optional()
      })
    ).optional()
  })
});

const router = Router();

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
router.get('/', EventController.getAllEvents);

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
router.get('/:id', EventController.getEventById);

// Admin routes - protected
// Make sure users are authenticated and have admin role
const checkAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user as any).role === 'admin') {
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
router.post(
  '/admin/events',
  authenticate,
  checkAdmin,
  validate(createEventSchema),
  EventController.createEvent
);

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
router.put(
  '/admin/events/:id',
  authenticate,
  checkAdmin,
  validate(updateEventSchema),
  EventController.updateEvent
);

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
router.delete(
  '/admin/events/:id',
  authenticate,
  checkAdmin,
  EventController.deleteEvent
);

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
router.get('/:id/seats', EventController.getEventSeats);

// File upload route for event images
router.post('/upload-image', authenticate, uploadSingle, EventController.uploadEventImage);

// Add this route to expose /api/v1/events/categories
router.get('/categories', listCategories);

export default router; 