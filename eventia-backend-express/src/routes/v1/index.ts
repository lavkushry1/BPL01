import { Router } from 'express';
import { registerRoutes } from '../../utils/routeHelper';
import adminRoutes from './admin';
import publicRoutes from './public';

// Import direct routes
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import bookingRoutes from '../booking.routes';
import paymentRoutes from '../payment.routes';
import discountRoutes from '../discount.routes';
import seatRoutes from '../seat.routes';
import seatLockRoutes from '../seat.lock.routes';
import ticketCategoryRoutes from '../ticketCategory.routes';
import ticketRoutes from '../ticket.routes';
import paymentInitializeRoutes from '../payment.initialize.routes';
import utrVerificationRoutes from '../utrVerification.routes';
import healthRoutes from '../health.routes';
import stateSyncRoutes from '../stateSync.routes';

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
  'state-sync': stateSyncRoutes
};

// Register all resource routes
registerRoutes(router, resourceRoutes);

// Register grouped routes
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

export default router;
