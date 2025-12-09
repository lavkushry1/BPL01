import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { paymentService } from '../services/payment.service';
import { reservationService } from '../services/reservation.service';
import { ApiError } from '../utils/apiError';

// Payment gateway interface (Mock for now, but integrated into flow)
class PaymentGateway {
  static async verifyUTRPayment(utrNumber: string): Promise<boolean> {
    // In a real app, this would call a banking API
    // For now, we validate the format (12 digits)
    return /^\d{12}$/.test(utrNumber);
  }
}

export const createReservation = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, tickets, totalAmount } = req.body;

    const userId = req.user.id;

    const booking = await reservationService.createReservation({
      userId,
      eventId,
      tickets,
      totalAmount // Optional, service will calculate if missing
    });

    res.status(201).json({
      success: true,
      reservationId: booking.id,
      paymentDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  } catch (error) {
    console.error('Reservation error:', error);
    const status = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof ApiError ? error.message : 'Failed to create reservation';
    res.status(status).json({ error: message });
  }
};

export const updateReservation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status enum if needed, but service/prisma will throw if invalid
    const booking = await reservationService.updateReservation(id, { status });

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation: booking
    });
  } catch (error: any) {
    console.error('Update reservation error:', error);
    res.status(500).json({
      error: 'Failed to update reservation',
      details: error.message
    });
  }
};

export const processPayment = async (_req: Request, res: Response) => {
  // Payment processing logic placeholder
  res.status(501).json({});
};

export const verifyUTR = async (req: Request, res: Response) => {
  try {
    const { utrNumber, reservationId } = req.body;

    // Validate UTR format
    const isValidUTR = /^\d{12}$/.test(utrNumber);
    if (!isValidUTR) {
      return res.status(400).json({ error: 'Invalid UTR format' });
    }

    // Fetch the booking to get the amount
    const booking = await reservationService.getReservationById(reservationId);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Verify payment with "Banking API"
    const paymentVerified = await PaymentGateway.verifyUTRPayment(utrNumber);
    if (!paymentVerified) {
      return res.status(402).json({ error: 'Payment verification failed' });
    }

    // Record the UTR submission
    await paymentService.createUTRPayment({
      booking_id: reservationId,
      amount: booking.finalAmount.toNumber(),
      utr_number: utrNumber,
      status: 'pending' // Pending admin approval
    });

    res.json({
      success: true,
      message: 'Payment submitted for verification',
      verifiedAt: new Date().toISOString(),
      nextSteps: ['wait_for_admin_verification']
    });
  } catch (error: any) {
    console.error('UTR verification error:', error);
    res.status(500).json({
      error: 'Payment verification failed',
      details: error.message
    });
  }
};

export const generateTickets = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.body;

    // Fetch actual reservation data
    const booking = await reservationService.getReservationById(reservationId);

    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking is not confirmed' });
    }

    // Prepare data for PDF
    const reservationData = {
      eventId: booking.eventId,
      eventTitle: booking.event?.title || 'Event',
      tickets: booking.seats as Record<string, number>,
      totalAmount: Number(booking.finalAmount),
      userEmail: booking.user?.email || 'user@example.com'
    };

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPDF(reservationData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=tickets-${reservationId}.pdf`);

    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Ticket generation error:', error);
    res.status(500).json({
      error: 'Failed to generate tickets',
      details: error.message
    });
  }
};

const generateTicketPDF = async (reservation: any): Promise<Buffer> => {
  const doc = new PDFDocument({ margin: 50 });
  const buffers: any[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: any) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    qrCode.toBuffer(`EventID:${reservation.eventId}|Email:${reservation.userEmail}`)
      .then(qrImage => {
        if (reservation.tickets) {
          Object.entries(reservation.tickets).forEach(([category, quantity]: [string, any]) => {
            for (let i = 0; i < quantity; i++) {
              doc.fontSize(18).text(`Event: ${reservation.eventTitle}`);
              doc.fontSize(12).text(`Category: ${category}`);
              doc.text(`Ticket ${i + 1} of ${quantity}`);
              doc.image(qrImage, { width: 100 });
              doc.moveDown(2);
            }
          });
        } else {
          doc.text('No seat details available');
        }
        doc.end();
      })
      .catch(reject);
  });
};
