import { Router } from 'express';
import authRoutes from '../auth';
import paymentRoutes from '../payment.routes';
import bookingRoutes from '../booking.routes';
import adminEventRoutes from '../admin/events.routes';
import eventRoutes from '../events.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/events', eventRoutes);

// Admin routes
router.use('/admin/events', adminEventRoutes);

export default router;
