"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeHelper_1 = require("../../utils/routeHelper");
const admin_1 = __importDefault(require("./admin"));
const public_1 = __importDefault(require("./public"));
// Import direct routes
const booking_routes_1 = __importDefault(require("../booking.routes"));
const discount_routes_1 = __importDefault(require("../discount.routes"));
const health_routes_1 = __importDefault(require("../health.routes"));
const payment_initialize_routes_1 = __importDefault(require("../payment.initialize.routes"));
const payment_routes_1 = __importDefault(require("../payment.routes"));
const seat_lock_routes_1 = __importDefault(require("../seat.lock.routes"));
const seat_routes_1 = __importDefault(require("../seat.routes"));
const stateSync_routes_1 = __importDefault(require("../stateSync.routes"));
const ticket_routes_1 = __importDefault(require("../ticket.routes"));
const ticketCategory_routes_1 = __importDefault(require("../ticketCategory.routes"));
const utrVerification_routes_1 = __importDefault(require("../utrVerification.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const upiSettings_routes_1 = __importDefault(require("../upiSettings.routes"));
const router = (0, express_1.Router)();
// Register direct resource routes
const resourceRoutes = {
    'auth': auth_routes_1.default,
    'users': user_routes_1.default,
    'events': event_routes_1.default,
    'bookings': booking_routes_1.default,
    'payments': payment_routes_1.default,
    'discounts': discount_routes_1.default,
    'seats': seat_routes_1.default,
    'seat-locks': seat_lock_routes_1.default,
    'ticket-categories': ticketCategory_routes_1.default,
    'tickets': ticket_routes_1.default,
    'payment-initialize': payment_initialize_routes_1.default,
    'verify-utr': utrVerification_routes_1.default,
    'health': health_routes_1.default,
    'state-sync': stateSync_routes_1.default
};
// Register all resource routes
(0, routeHelper_1.registerRoutes)(router, resourceRoutes);
// Register grouped routes
router.use('/admin/upi-settings', upiSettings_routes_1.default);
router.use('/admin', admin_1.default);
router.use('/public', public_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map