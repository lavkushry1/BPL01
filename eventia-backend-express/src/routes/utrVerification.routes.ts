import { Router } from 'express';
import * as reservationController from '../controllers/reservationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as paymentValidation from '../validations/payment.validation';

const router = Router();

// UTR verification endpoints
router.post('/verify',
  authenticate,
  validate(paymentValidation.verifyPaymentUtrSchema),
  reservationController.verifyUTR
);

router.get('/status/:utr', authenticate, async (req, res) => {
  try {
    // Retrieve verification status from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const payment = await prisma.bookingPayment.findFirst({
      where: { utrNumber: req.params.utr },
      include: {
        booking: {
          include: {
            event: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    await prisma.$disconnect();

    if (!payment) {
      return res.status(404).json({
        error: 'UTR not found',
        utr: req.params.utr
      });
    }

    res.json({
      utr: req.params.utr,
      status: payment.status,
      eventId: payment.booking.eventId,
      eventTitle: payment.booking.event?.title,
      amount: Number(payment.amount),
      verifiedAt: payment.updatedAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'UTR verification service operational' });
});

export default router;
