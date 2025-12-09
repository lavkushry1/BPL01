import express from 'express';
import {
  createReservation,
  processPayment,
  verifyUTR,
  generateTickets
} from '../controllers/reservationController';

const router = express.Router();

// Create ticket reservation
router.post('/reservations', createReservation);

// Process payment
router.post('/payments', processPayment);

// Verify UTR number
router.post('/verify-utr', verifyUTR);

// Generate tickets PDF
router.post('/tickets/generate', generateTickets);

export default router;