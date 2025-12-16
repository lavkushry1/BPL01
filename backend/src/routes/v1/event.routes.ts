import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { EventControllerV1 } from '../../controllers/v1/event.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { standardLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { createEventSchema } from '../../validators/event.validator';

/**
 * Event routes
 * Contains standard event operations for authenticated users
 */
const router = Router();

// Schema for event queries
const eventQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    date: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).optional()
  }),
  params: z.object({}),
  body: z.object({}).optional()
});

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEvent'
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/',
  standardLimiter,
  validate(eventQuerySchema),
  asyncHandler(EventControllerV1.getAllEvents)
);

router.post('/',
  authenticate,
  authorize(['ADMIN', 'ORGANIZER']),
  validate(createEventSchema),
  asyncHandler(EventControllerV1.createEvent)
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Event not found
 */
router.get('/:id',
  standardLimiter,
  asyncHandler(EventControllerV1.getEventById)
);

/**
 * @route GET /api/v1/events/:id/tickets
 * @desc Get available tickets for an event
 * @access Public
 */
router.get('/:id/tickets',
  standardLimiter,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Get event ID from URL params


    try {
      // This would normally call a service to get ticket data
      // For now returning a sample response
      const ticketCategories = [
        { id: 'cat1', name: 'VIP', price: 100, availableSeats: 50, totalSeats: 100 },
        { id: 'cat2', name: 'Standard', price: 50, availableSeats: 200, totalSeats: 300 },
        { id: 'cat3', name: 'Economy', price: 25, availableSeats: 400, totalSeats: 500 }
      ];

      return ApiResponse.success(res, 200, 'Event tickets fetched successfully', ticketCategories);
    } catch (error) {
      // Let the error middleware handle the error
      next(error);
    }
  })
);

/**
 * @route GET /api/v1/events/:id/seats
 * @desc Get seat map for an event
 * @access Public
 */
router.get('/:id/seats',
  standardLimiter,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Get event ID from URL params


    try {
      // This would normally call a service to get seat map data
      // For now returning a sample response
      const seatMap = {
        sections: [
          {
            id: 'section1',
            name: 'Section A',
            rows: [
              {
                id: 'rowA',
                name: 'Row A',
                seats: Array.from({ length: 10 }, (_, i) => ({
                  id: `A${i+1}`,
                  number: `A${i+1}`,
                  status: 'available',
                  price: 100
                }))
              },
              {
                id: 'rowB',
                name: 'Row B',
                seats: Array.from({ length: 10 }, (_, i) => ({
                  id: `B${i+1}`,
                  number: `B${i+1}`,
                  status: 'available',
                  price: 80
                }))
              }
            ]
          }
        ]
      };

      return ApiResponse.success(res, 200, 'Event seat map fetched successfully', seatMap);
    } catch (error) {
      // Let the error middleware handle the error
      next(error);
    }
  })
);

export default router;
