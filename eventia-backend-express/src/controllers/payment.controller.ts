import { PaymentStatus, SeatStatus } from '@prisma/client';
import { Request, Response } from 'express';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { prisma } from '../db/prisma';
import * as bookingService from '../services/booking.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import TicketService from '../services/ticket.service';
import { WebsocketService } from '../services/websocket.service';
import { withRetry } from '../utils';
  RESERVED = 'RESERVED',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED'
}

// Lock timeout in minutes
const SEAT_LOCK_TIMEOUT_MINUTES = 10;

/**
 * Controller for handling payment operations
 */
export class PaymentController {
  /**
   * Initialize a new payment
   * @route POST /api/payments/initialize
   */
  static initializePayment = asyncHandler(async (req: Request, res: Response) => {
    const { booking_id, payment_method, currency = 'INR' } = req.body;

    if (!booking_id || !payment_method) {
      throw new ApiError(400, 'Booking ID and payment method are required', 'MISSING_REQUIRED_FIELDS');
    }

    // Validate if booking exists and is in pending state
    const booking = await db('bookings')
      .select('*')
      .where({ id: booking_id })
      .first();

    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'pending') {
      throw new ApiError(400, `Cannot initialize payment for booking in ${booking.status} state`, 'INVALID_BOOKING_STATUS');
    }

    // Check if payment already exists for this booking
    const existingPayment = await db('booking_payments')
      .select('id', 'status')
      .where({ booking_id })
      .first();

    if (existingPayment) {
      // If payment exists but was rejected, allow re-initialization
      if (existingPayment.status === 'rejected') {
        await db('booking_payments')
          .where({ id: existingPayment.id })
          .update({
            status: 'pending',
            updated_at: db.fn.now()
          });

        return ApiResponse.success(res, 200, 'Payment re-initialized successfully', {
          payment_id: existingPayment.id,
          booking_id,
          payment_method,
          amount: booking.final_amount,
          currency,
          status: 'pending'
        });
      }

      // If payment exists and is not rejected, prevent re-initialization
      throw new ApiError(400, `Payment already initialized with status: ${existingPayment.status}`, 'PAYMENT_ALREADY_EXISTS');
    }

    // Create new payment record
    try {
      const result = await db.transaction(async trx => {
        // Create payment record
        const [payment] = await trx('booking_payments').insert({
          id: uuidv4(),
          booking_id,
          amount: booking.final_amount,
          status: 'pending',
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        }).returning('*');

        // Update booking to link to payment
        await trx('bookings')
          .where({ id: booking_id })
          .update({
            payment_id: payment.id,
            updated_at: trx.fn.now()
          });

        return payment;
      });

      return ApiResponse.success(res, 201, 'Payment initialized successfully', result);
    } catch (error) {
      logger.error('Error initializing payment:', error);
      throw new ApiError(500, 'Failed to initialize payment', 'PAYMENT_INITIALIZATION_FAILED');
    }
  });

  /**
   * Create a new payment
   * @route POST /api/payments
   */
  static createPayment = asyncHandler(async (req: Request, res: Response) => {
    const { booking_id, amount, payment_method } = req.body;

    if (!booking_id || !amount || !payment_method) {
      throw new ApiError(400, 'Booking ID, amount, and payment method are required', 'MISSING_REQUIRED_FIELDS');
    }

    try {
      const newPayment = await db.transaction(async trx => {
        // Create payment record
        const [payment] = await trx('booking_payments').insert({
          id: uuidv4(),
          booking_id,
          amount,
          payment_method,
          status: 'pending',
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        }).returning('*');

        return payment;
      });

      return ApiResponse.success(res, 201, 'Payment created successfully', newPayment);
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw new ApiError(500, 'Failed to create payment', 'PAYMENT_CREATION_FAILED');
    }
  });

  /**
   * Update UTR number for a payment
   * @route PUT /api/payments/:id/utr
   */
  static updateUtrNumber = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { utrNumber } = req.body;

    if (!utrNumber) {
      throw new ApiError(400, 'UTR number is required', 'MISSING_UTR_NUMBER');
    }

    // Validate payment exists
    const payment = await db('booking_payments')
      .select('*')
      .where({ id })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    try {
      // Update UTR number
      const [updatedPayment] = await db('booking_payments')
        .where({ id })
        .update({
          utr_number: utrNumber,
          updated_at: db.fn.now()
        })
        .returning('*');

      return ApiResponse.success(res, 200, 'UTR number updated successfully', updatedPayment);
    } catch (error) {
      logger.error('Error updating UTR number:', error);
      throw new ApiError(500, 'Failed to update UTR number', 'UTR_UPDATE_FAILED');
    }
  });

  /**
   * Get payment by ID
   * @route GET /api/payments/:id
   */
  static getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate payment exists
    const payment = await db('booking_payments')
      .select('*')
      .where({ id })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    return ApiResponse.success(res, 200, 'Payment fetched successfully', payment);
  });

  /**
   * Get payment by booking ID
   * @route GET /api/payments/booking/:bookingId
   */
  static getPaymentByBookingId = asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    // Validate booking ID
    if (!bookingId) {
      throw new ApiError(400, 'Booking ID is required', 'MISSING_BOOKING_ID');
    }

    // Fetch payment by booking ID
    const payment = await db('booking_payments')
      .select('*')
      .where({ booking_id: bookingId })
      .first();

    if (!payment) {
      return ApiResponse.success(res, 200, 'No payment found for this booking', {});
    }

    return ApiResponse.success(res, 200, 'Payment fetched successfully', payment);
  });

  /**
   * Get all payments with pagination and filters
   * @route GET /api/payments
   */
  static getAllPayments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, startDate, endDate, sort = 'createdAt', order = 'desc' } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build Prisma where clause
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }


      // Map frontend sort field to Prisma field names
      const sortFieldMap: Record<string, string> = {
        'created_at': 'createdAt',
        'createdAt': 'createdAt',
        'amount': 'amount',
        'status': 'status'
      };

      const prismaSort = sortFieldMap[sort as string] || 'createdAt';

      // Get payments with related data
      const rawPayments = await prisma.bookingPayment.findMany({
        where,
        include: {
          booking: {
            include: {
              user: true,
              event: true
            }
          }
        },
        orderBy: {
          [prismaSort]: order === 'asc' ? 'asc' : 'desc'
        },
        take: Number(limit),
        skip: offset
      });


      // Format payments for frontend
      const payments = rawPayments.map(payment => ({
        id: payment.id,
        customer: {
          name: payment.booking?.user?.name || 'Unknown User',
          email: payment.booking?.user?.email || 'No Email',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(payment.booking?.user?.name || 'U')}&background=random`
        },
        event: payment.booking?.event?.title || 'Unknown Event',
        amount: Number(payment.amount),
        status: payment.status,
        utr: payment.utrNumber || 'N/A',
        timestamp: payment.createdAt
      }));

      return ApiResponse.success(res, 200, 'Payments fetched successfully', payments);
    } catch (error) {
      logger.error('Error in getAllPayments:', error);
      throw error;
    }
  });

  /**
   * Verify payment (admin only)
   * @route PUT /api/payments/:id/verify
   */
  static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    // Validate payment exists
    const payment = await db('booking_payments')
      .select('*')
      .where({ id })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Allow verification only if payment is in awaiting_verification state
    // or if it was previously rejected but has a UTR number (to support retry)
    const canBeVerified = payment.status === 'awaiting_verification' ||
      (payment.status === 'rejected' && payment.utr_number);

    if (!canBeVerified) {
      throw new ApiError(400, `Cannot verify payment in ${payment.status} state`, 'INVALID_PAYMENT_STATUS');
    }

    try {
      // Use retry mechanism with transaction for better reliability
      const result = await withRetry(async () => {
        return await db.transaction(async trx => {
          // Update payment record
          const [updatedPayment] = await trx('booking_payments')
            .where({ id })
            .update({
              status: 'verified',
              verified_at: trx.fn.now(),
              verified_by: adminId,
              updated_at: trx.fn.now()
            })
            .returning('*');

          // Get booking details
          const booking = await trx('bookings')
            .select('*')
            .where({ id: payment.booking_id })
            .first();

          if (!booking) {
            throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
          }

          // Update booking status
          const [updatedBooking] = await trx('bookings')
            .where({ id: booking.id })
            .update({
              status: 'confirmed',
              updated_at: trx.fn.now()
            })
            .returning('*');

          return {
            payment: updatedPayment,
            booking: updatedBooking
          };
        });
      }, {
        maxAttempts: 3,
        delay: 500,
        backoff: true,
        maxDelay: 3000
      });

      // Generate tickets after successful payment verification
      try {
        // Use a dedicated ticket generation service that should have its own
        // retry and error handling mechanism
        await TicketService.generateTicketsForBooking(result.booking.id, adminId);
        logger.info(`Tickets generated for booking ${result.booking.id}`);
      } catch (ticketError) {
        // Log ticket generation error but don't fail the verification
        // We can use a queue system to retry ticket generation later
        logger.error('Error generating tickets:', ticketError);

        // Update a retry queue for ticket generation
        await db('ticket_generation_queue').insert({
          id: uuidv4(),
          booking_id: result.booking.id,
          admin_id: adminId,
          attempts: 0,
          max_attempts: 5,
          next_attempt_at: new Date(Date.now() + 60000), // 1 minute later
          created_at: new Date()
        }).onConflict('booking_id').merge();
      }

      // Notify customer via WebSocket if available
      try {
        WebsocketService.notifyPaymentVerified(id, payment.booking_id);
      } catch (wsError) {
        // Just log the error but don't fail the operation
        logger.warn('WebSocket payment verification notification failed:', wsError);
      }

      return ApiResponse.success(res, 200, 'Payment verified successfully', result);
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw new ApiError(500, 'Failed to verify payment', 'PAYMENT_VERIFICATION_FAILED');
    }
  });

  /**
   * Reject payment (admin only)
   * @route PUT /api/payments/:id/reject
   */
  static rejectPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    // Validate payment exists
    const payment = await db('booking_payments')
      .select('*')
      .where({ id })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'awaiting_verification') {
      throw new ApiError(400, `Cannot reject payment in ${payment.status} state`, 'INVALID_PAYMENT_STATUS');
    }

    try {
      const result = await db.transaction(async trx => {
        // Update payment record
        const [updatedPayment] = await trx('booking_payments')
          .where({ id })
          .update({
            status: 'rejected',
            rejection_reason: rejection_reason || 'Payment verification failed',
            verified_by: adminId,
            updated_at: trx.fn.now()
          })
          .returning('*');

        // Update booking status
        const [updatedBooking] = await trx('bookings')
          .where({ id: payment.booking_id })
          .update({
            status: 'payment_rejected',
            updated_at: trx.fn.now()
          })
          .returning('*');

        return {
          payment: updatedPayment,
          booking: updatedBooking
        };
      });

      // Notify customer via WebSocket if available
      try {
        WebsocketService.notifyPaymentRejected(id, payment.booking_id, rejection_reason);
      } catch (wsError) {
        logger.warn('WebSocket payment rejection notification failed:', wsError);
      }

      return ApiResponse.success(res, 200, 'Payment rejected successfully', result);
    } catch (error) {
      logger.error('Error rejecting payment:', error);
      throw new ApiError(500, 'Failed to reject payment', 'PAYMENT_REJECTION_FAILED');
    }
  });

  /**
   * Handle payment webhooks for external payment providers
   * @route POST /api/payments/webhook
   */
  static handlePaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
    const anyPrisma = prisma as any;

    try {
      // Validate UPI webhook signature
      const isValid = upiPaymentService.validateWebhookSignature(
        req.body,
        req.headers['x-signature'] as string
      );

      if (!isValid) {
        throw new ApiError(400, 'Invalid webhook signature');
      }

      const event = req.body;
      let paymentSession;

      // Handle payment success
      if (event.event === 'payment.success') {
        const paymentId = event.payload.payment.id;
        const referenceId = event.payload.payment.reference_id;
        const utrNumber = event.payload.payment.utr_number;

        // Find payment session by reference id
        paymentSession = await anyPrisma.paymentSession.findFirst({
          where: { referenceId: referenceId },
          include: { seats: true }
        });

        if (!paymentSession) {
          throw new ApiError(404, 'Payment session not found');
        }

        // Update payment session status
        await anyPrisma.paymentSession.update({
          where: { id: paymentSession.id },
          data: {
            status: PaymentStatus.COMPLETED,
            utrNumber: utrNumber
          }
        });

        // Create booking for the payment
        await bookingService.createBookingFromPaymentSession(paymentSession.id, paymentId);
      }

      return ApiResponse.success(
        res,
        200,
        'Webhook processed successfully'
      );
    } catch (error) {
      logger.error('Error processing webhook:', error);
      if (error instanceof ApiError) {
        return ApiResponse.error(
          res,
          error.statusCode,
          error.message,
          error.code
        );
      }
      return ApiResponse.error(
        res,
        500,
        'Failed to process webhook',
        'WEBHOOK_PROCESSING_FAILED'
      );
    }
  });

  /**
   * Submit UTR verification for a payment
   * @route POST /api/payments/verify
   */
  static submitUtrVerification = asyncHandler(async (req: Request, res: Response) => {
    const { payment_id, utr_number, user_id } = req.body;

    if (!payment_id || !utr_number || !user_id) {
      throw new ApiError(400, 'Payment ID, UTR number, and user ID are required', 'MISSING_REQUIRED_FIELDS');
    }

    // Check if payment exists
    const payment = await db('booking_payments')
      .select('*')
      .where({ id: payment_id })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Validate payment is in pending status
    if (payment.status !== 'pending') {
      throw new ApiError(400, `Cannot verify payment with status: ${payment.status}`, 'INVALID_PAYMENT_STATUS');
    }

    try {
      // Update payment with UTR number
      const [updatedPayment] = await db('booking_payments')
        .where({ id: payment_id })
        .update({
          utr_number,
          status: 'verification_pending',
          updated_at: db.fn.now()
        })
        .returning('*');

      // Notify admins about new verification request
      WebsocketService.sendToAdmins('new_payment_verification', {
        payment_id,
        booking_id: payment.booking_id,
        amount: payment.amount,
        utr_number,
        user_id
      });

      return ApiResponse.success(res, 200, 'Payment verification submitted successfully', updatedPayment);
    } catch (error) {
      logger.error('Error submitting UTR verification:', error);
      throw new ApiError(500, 'Failed to submit payment verification', 'VERIFICATION_SUBMISSION_FAILED');
    }
  });

  /**
   * Get payment status
   * @route GET /api/payments/status/:paymentId
   */
  static getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const anyPrisma = prisma as any;

    if (!paymentId) {
      throw new ApiError(400, 'Payment ID is required', 'MISSING_PAYMENT_ID');
    }

    // Get payment details
    const payment = await anyPrisma.booking_payments
      .select('*')
      .where({ id: paymentId })
      .first();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Get booking details
    const booking = await anyPrisma.bookings
      .select('*')
      .where({ id: payment.booking_id })
      .first();

    return ApiResponse.success(res, 200, 'Payment status fetched successfully', {
      payment,
      booking
    });
  });

  /**
   * Generates a QR code for UPI payment
   */
  static generateUpiQr = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { amount, upiId: providedUpiId } = req.body;

      if (!amount) {
        throw new ApiError(400, 'Amount is required for payment QR generation', 'MISSING_AMOUNT');
      }

      // Fetch active UPI setting from database
      const activeSetting = await db('upi_settings')
        .select('*')
        .where({ isactive: true })
        .first();

      // Use the provided UPI ID or get from the database, or use the default required UPI ID
      let upiId = providedUpiId;

      if (!upiId) {
        if (activeSetting) {
          upiId = activeSetting.upivpa;
          logger.info(`Using active UPI ID from database: ${upiId}`);
        } else {
          // Use the required UPI ID as fallback
          upiId = '9122036484@hdfc';
          logger.info(`No active UPI setting found, using fallback UPI ID: ${upiId}`);
        }
      } else {
        logger.info(`Using provided UPI ID: ${upiId}`);
      }

      // Generate reference ID for tracking
      const referenceId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // Create UPI payment link
      const upiLink = `upi://pay?pa=${upiId}&pn=Eventia&am=${amount}&tr=${referenceId}&cu=INR`;
      logger.info(`Generated UPI payment link with ID ${upiId} for amount ${amount}`);

      // Generate QR code as data URL
      const qrCodeUrl = await qrcode.toDataURL(upiLink, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 6
      });

      return ApiResponse.success(
        res,
        200,
        'QR code generated successfully',
        {
          qrImageUrl: qrCodeUrl,
          qrText: upiLink,
          referenceId,
          upiId,
          amount
        }
      );
    } catch (error) {
      logger.error('Error generating QR code:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to generate QR code', 'QR_GENERATION_ERROR');
    }
  });
}

/**
 * Initiates a payment and locks selected seats
 */
export const initiatePayment = async (req: Request, res: Response) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user?.id;

  if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return ApiResponse.error(
      res,
      400,
      'EventId and seatIds are required',
      'MISSING_REQUIRED_FIELDS'
    );
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Check if seats are available
      const unavailableSeats = await seatService.SeatService.getUnavailableSeats(tx, seatIds);

      if (unavailableSeats.length > 0) {
        throw new ApiError(
          400,
          'Some selected seats are not available',
          'SEATS_UNAVAILABLE'
        );
      }

      // Fetch seats with pricing information
      const seats = await tx.seat.findMany({
        where: { id: { in: seatIds } }
      });

      // Calculate total amount
      const totalAmount = seats.reduce((sum: number, seat: any) => sum + Number(seat.price), 0);

      // Create payment session instead of payment intent
      const paymentSession = await tx.paymentSession.create({
        data: {
          userId,
          eventId,
          amount: totalAmount,
          status: PaymentStatus.PENDING,
          upiId: 'eventia@okicici',
          expiresAt: new Date(Date.now() + SEAT_LOCK_TIMEOUT_MINUTES * 60 * 1000),
          seats: {
            connect: seatIds.map((id: string) => ({ id }))
          }
        }
      });

      // Update seat status to LOCKED
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: SeatStatus.LOCKED,
          lockedAt: new Date()
        }
      });

      return paymentSession;
    });

    return ApiResponse.success(res, 200, 'Payment initiated successfully', result);
  } catch (error) {
    logger.error('Error initiating payment:', error);
    if (error instanceof ApiError) {
      return ApiResponse.error(res, error.statusCode, error.message, error.code);
    }
    return ApiResponse.error(res, 500, 'Failed to initiate payment', 'PAYMENT_INITIATION_FAILED');
  }
};
