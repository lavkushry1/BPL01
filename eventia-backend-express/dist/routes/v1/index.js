"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../auth"));
const payment_routes_1 = __importDefault(require("../payment.routes"));
const booking_routes_1 = __importDefault(require("../booking.routes"));
const router = (0, express_1.Router)();
// API routes
router.use('/auth', auth_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/bookings', booking_routes_1.default);
exports.default = router;
