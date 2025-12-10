import { Router } from 'express';
import { config } from '../config';
import authRoutes from './auth';
import bookingRoutes from './booking.routes';
import discountRoutes from './discount.routes';
import eventRoutes from './event.routes';
import iplRoutes from './ipl.routes';
import metricsRoutes from './metricsRoutes';
import paymentInitializeRoutes from './payment.initialize.routes';
import paymentRoutes from './payment.routes';
import reservationRoutes from './reservation.routes';
import seatLockRoutes from './seat.lock.routes';
import stripeRoutes from './stripe.routes';
import ticketCategoryRoutes from './ticketCategory.routes';
import utrVerificationRoutes from './utrVerification.routes';

const router = Router();

/**
 * Set up base routes
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IPL 2026 Tickets API',
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
router.use('/ipl', iplRoutes); // IPL 2026 teams, matches, venues
// router.use('/users', userRoutes);

/**
 * Export router with API prefix
 */
export default Router().use(config.apiPrefix, router);
