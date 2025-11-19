import express, { NextFunction, Request, Response } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { EventController } from '../controllers/event.controller';
import { PaymentController } from '../controllers/payment.controller';
import { UserController } from '../controllers/user.controller';
import { authenticate, checkAdmin } from '../middleware/auth';
import { DatabaseRequest } from '../middleware/database';
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

// Payment Verification Routes
router.get('/payments', PaymentController.getAllPayments);
router.post('/payments/:id/verify', PaymentController.verifyPayment);
router.post('/payments/:id/reject', PaymentController.rejectPayment);

// Mount admin sub-routes
// Note: We keep this for backward compatibility if other parts of the app use it
router.use('/events', adminEventRoutes);

// UPI Settings routes (TODO: Implement real controller)
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

// Admin event routes (direct controller methods)
// These might overlap with adminEventRoutes but are kept for explicit routing
router.post('/events', EventController.createEvent);
router.put('/events/:id', EventController.updateEvent);
// DELETE is already defined above

export default router;
