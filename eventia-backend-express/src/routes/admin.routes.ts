import express, { Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { UserController } from '../controllers/user.controller';
import { EventController } from '../controllers/event.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { DatabaseRequest } from '../middleware/database';
import { authenticate } from '../middleware/auth';
import { checkAdmin } from '../middleware/auth';
import adminEventRoutes from './admin/events.routes';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

// Protect all admin routes
router.use(authenticate);
router.use(checkAdmin);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', (req: Request, res: Response, next: NextFunction) => {
  return UserController.getAllUsers(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/dashboard/stats', (req: Request, res: Response, next: NextFunction) => {
  return DashboardController.getStats(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/dashboard/sales:
 *   get:
 *     summary: Get sales statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/dashboard/sales', (req: Request, res: Response, next: NextFunction) => {
  return DashboardController.getSalesStats(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: Get all events with admin details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/events', (req: Request, res: Response, next: NextFunction) => {
  return EventController.getAllEvents(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete an event (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/events/:id', (req: Request, res: Response, next: NextFunction) => {
  return EventController.deleteEvent(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.get('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  return UserController.getUserById(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.put('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  return UserController.updateUser(req as DatabaseRequest, res, next);
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', (req: Request, res: Response, next: NextFunction) => {
  return UserController.deleteUser(req as DatabaseRequest, res, next);
});

// Mount admin sub-routes
router.use('/events', adminEventRoutes);

// Admin dashboard routes
router.get('/dashboard/stats', (req, res) => {
  // This would be a real implementation in a production environment
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalEvents: 45,
      totalBookings: 5670,
      revenueLastMonth: 2345000
    }
  });
});

// UPI Settings routes
router.get('/settings/upi', (req, res) => {
  res.json({
    success: true,
    data: {
      settings: {
        upiId: '9122036484@hdfc',
        merchantName: 'Eventia Tickets',
        isActive: true
      }
    }
  });
});

router.put('/settings/upi', (req, res) => {
  const { upiId, merchantName, isActive } = req.body;

  // In a real implementation, this would update the database
  res.json({
    success: true,
    message: 'UPI settings updated successfully',
    data: {
      settings: {
        upiId,
        merchantName,
        isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: req.user?.id,
          name: 'Admin User'
        }
      }
    }
  });
});

// Admin event routes (fallback for direct event controller methods)
router.post('/events', EventController.createEvent);
router.put('/events/:id', EventController.updateEvent);
router.delete('/events/:id', EventController.deleteEvent);

export default router; 