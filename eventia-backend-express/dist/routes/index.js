"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const payment_initialize_routes_1 = __importDefault(require("./payment.initialize.routes"));
const discount_routes_1 = __importDefault(require("./discount.routes"));
const reservation_routes_1 = __importDefault(require("./reservation.routes"));
const utrVerification_routes_1 = __importDefault(require("./utrVerification.routes"));
const ticketCategory_routes_1 = __importDefault(require("./ticketCategory.routes"));
const seat_lock_routes_1 = __importDefault(require("./seat.lock.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const config_1 = require("../config");
const router = (0, express_1.Router)();
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
router.use('/auth', auth_1.default);
router.use('/events', event_routes_1.default);
router.use('/bookings', booking_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/', payment_initialize_routes_1.default); // Adds /payments/initialize, /payments/verify, and /payments/status endpoints
router.use('/discounts', discount_routes_1.default);
// router.use('/dynamic-pricing', dynamicPricingRoutes); // Commenting out non-existent route
router.use('/reservations', reservation_routes_1.default);
router.use('/verify-utr', utrVerification_routes_1.default);
router.use('/', ticketCategory_routes_1.default); // Routes have ticket-categories prefix internally
router.use('/', seat_lock_routes_1.default); // Adds /seats/lock and /seats/unlock endpoints
// router.use('/users', userRoutes);
/**
 * Export router with API prefix
 */
exports.default = (0, express_1.Router)().use(config_1.config.apiPrefix, router);
