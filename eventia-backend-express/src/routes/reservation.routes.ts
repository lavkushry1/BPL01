import { Router } from 'express';
import * as reservationController from '../controllers/reservationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Seat reservation endpoints
router.post('/', authenticate, reservationController.createReservation);

router.put('/:id', authenticate, (req, res) => {
  // TODO: Implement update reservation logic
  res.json({ message: 'Reservation update not yet implemented' });
});

router.get('/:eventId', authenticate, async (req, res) => {
  try {
    const { reservationService } = await import('../services/reservation.service');
    const reservations = await reservationService.getReservationsByEventId(req.params.eventId);
    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'Reservation service operational' });
});

export default router;
