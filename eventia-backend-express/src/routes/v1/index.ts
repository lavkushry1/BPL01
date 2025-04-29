
import { Router } from 'express';
import authRoutes from '../auth';
import paymentRoutes from '../payment.routes';
import bookingRoutes from '../booking.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/bookings', bookingRoutes);

export default router;
