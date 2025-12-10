import { Router } from 'express';
import { registerRoutes } from '../../utils/routeHelper';
import adminRoutes from './admin';
import publicRoutes from './public';

// Import direct routes
import bookingRoutes from '../booking.routes';
import discountRoutes from '../discount.routes';
import healthRoutes from '../health.routes';
import paymentInitializeRoutes from '../payment.initialize.routes';
import paymentRoutes from '../payment.routes';
import seatLockRoutes from '../seat.lock.routes';
import seatRoutes from '../seat.routes';
import stateSyncRoutes from '../stateSync.routes';
import ticketRoutes from '../ticket.routes';
import ticketCategoryRoutes from '../ticketCategory.routes';
import utrVerificationRoutes from '../utrVerification.routes';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import userRoutes from './user.routes';

import iplRoutes from '../ipl.routes';
import upiSettingsRoutes from '../upiSettings.routes';

const router = Router();

// Register direct resource routes
const resourceRoutes = {
  'auth': authRoutes,
  'users': userRoutes,
  'events': eventRoutes,
  'bookings': bookingRoutes,
  'payments': paymentRoutes,
  'discounts': discountRoutes,
  'seats': seatRoutes,
  'seat-locks': seatLockRoutes,
  'ticket-categories': ticketCategoryRoutes,
  'tickets': ticketRoutes,
  'payment-initialize': paymentInitializeRoutes,
  'verify-utr': utrVerificationRoutes,
  'health': healthRoutes,
  'state-sync': stateSyncRoutes,
  'ipl': iplRoutes
};

// Register all resource routes
registerRoutes(router, resourceRoutes);

// Register grouped routes
router.use('/admin/upi-settings', upiSettingsRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

export default router;
