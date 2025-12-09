import { Router } from 'express';
import { registerRoutes } from '../../../utils/routeHelper';
import { auth, checkAdmin } from '../../../middleware/auth';
import upiSettingsRoutes from './upiSettings.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import { UpiSettingsController } from '../../../controllers/admin/upiSettings.controller';
import { logger } from '../../../utils/logger';

const router = Router();

// Apply admin authentication middleware to all admin routes
router.use(auth);
router.use(checkAdmin);

// Register all admin routes
registerRoutes(router, {
  'upi-settings': upiSettingsRoutes,
  'events': eventRoutes,
  'users': userRoutes
});

// Add a debug middleware
router.use((req, res, next) => {
    logger.info(`Admin route accessed: ${req.method} ${req.path}`);
    logger.info(`Auth header: ${req.headers.authorization ? 'Present' : 'Not present'}`);
    next();
});

// Public endpoint to get active UPI setting without authentication
router.get('/upi', (req, res, next) => {
    logger.info('Admin UPI endpoint accessed');
    UpiSettingsController.getActiveUpiSetting(req, res, next);
});

export default router; 