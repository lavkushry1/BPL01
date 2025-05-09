"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../auth"));
const payment_routes_1 = __importDefault(require("../payment.routes"));
const booking_routes_1 = __importDefault(require("../booking.routes"));
const events_routes_1 = __importDefault(require("../admin/events.routes"));
const upiSettings_routes_1 = __importDefault(require("./admin/upiSettings.routes"));
const events_routes_2 = __importDefault(require("../events.routes"));
const upiPayment_routes_1 = __importDefault(require("./upiPayment.routes"));
const router = (0, express_1.Router)();
// API routes
router.use('/auth', auth_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/upi-payments', upiPayment_routes_1.default);
router.use('/bookings', booking_routes_1.default);
router.use('/events', events_routes_2.default);
// Admin routes
router.use('/admin/events', events_routes_1.default);
router.use('/admin/upi-settings', upiSettings_routes_1.default);
exports.default = router;
