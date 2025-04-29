"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reservationController_1 = require("../controllers/reservationController");
const router = express_1.default.Router();
// Create ticket reservation
router.post('/reservations', reservationController_1.createReservation);
// Process payment
router.post('/payments', reservationController_1.processPayment);
// Verify UTR number
router.post('/verify-utr', reservationController_1.verifyUTR);
// Generate tickets PDF
router.post('/tickets/generate', reservationController_1.generateTickets);
exports.default = router;
