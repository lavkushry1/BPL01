import { Router } from 'express';
import authRoutes from './auth';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import paymentInitializeRoutes from './payment.initialize.routes';
import discountRoutes from './discount.routes';
import reservationRoutes from './reservation.routes';
import utrVerificationRoutes from './utrVerification.routes';
import ticketCategoryRoutes from './ticketCategory.routes';
import seatLockRoutes from './seat.lock.routes';
import eventRoutes from './event.routes';
import stripeRoutes from './stripe.routes';
import metricsRoutes from './metricsRoutes';
import { config } from '../config';

const router = Router();

/**
 * Set up base routes
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Eventia API',
    documentation: '/api-docs'
  });
});

/**
 * Set up health check route
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

/**
 * Register API routes
 */
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/', paymentInitializeRoutes); // Adds /payments/initialize, /payments/verify, and /payments/status endpoints
router.use('/discounts', discountRoutes);
// router.use('/dynamic-pricing', dynamicPricingRoutes); // Commenting out non-existent route
router.use('/reservations', reservationRoutes);
router.use('/verify-utr', utrVerificationRoutes);
router.use('/', ticketCategoryRoutes); // Routes have ticket-categories prefix internally
router.use('/metrics', metricsRoutes); // Mobile performance monitoring routes
router.use('/', seatLockRoutes); // Adds /seats/lock and /seats/unlock endpoints
router.use('/stripe', stripeRoutes);
// router.use('/users', userRoutes);

/**
 * Export router with API prefix
 */
export default Router().use(config.apiPrefix, router);