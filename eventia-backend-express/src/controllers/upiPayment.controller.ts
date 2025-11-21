import { PaymentStatus as PrismaPaymentStatus, SeatStatus as PrismaSeatStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { WebsocketService } from '../services/websocket.service';
import { logger } from '../utils';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { generateQRCode } from '../utils/qrCode';

// UPI payment lock timeout in minutes
const PAYMENT_TIMEOUT_MINUTES = 10;

/**
 * UPI Payment Controller - Handles UPI payment related endpoints
 */
export class UpiPaymentController {
    /**
     * Initiates a UPI payment and generates a QR code
     */
    static initiatePayment = async (req: Request, res: Response) => {
        try {
            const { eventId, seatIds, amount } = req.body;
            const userId = req.user?.id;

            // Validation
            if (!eventId || !seatIds || !seatIds.length || !userId) {
                throw new ApiError(400, 'Missing required fields');
            }

            // Start a transaction to ensure atomicity
            const result = await prisma.$transaction(async (tx) => {
                // Check if the event exists
                const event = await tx.event.findUnique({
                    where: { id: eventId }
                });

                if (!event) {
                    throw new ApiError(404, 'Event not found');
                }

                // Check if seats are available
                const seats = await tx.seat.findMany({
                    where: {
                        id: { in: seatIds },
                        status: PrismaSeatStatus.AVAILABLE
                    }
                });

                if (seats.length !== seatIds.length) {
                    // Some seats are not available
                    throw new ApiError(400, 'One or more selected seats are not available');
                }

                // Get UPI settings
                const upiSettings = await tx.upiSettings.findFirst({
                    where: { isactive: true },
                    orderBy: { created_at: 'desc' }
                });

                if (!upiSettings) {
                    throw new ApiError(500, 'UPI payment settings not configured');
                }

                // Calculate total amount if not provided
                let totalAmount = amount;
                if (!totalAmount) {
                    totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
                }

                // Create reference ID
                const referenceId = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                // Create payment session
                const paymentSession = await tx.paymentSession.create({
                    data: {
                        userId,
                        eventId,
                        amount: totalAmount,
                        status: PrismaPaymentStatus.PENDING,
                        referenceId,
                        upiId: upiSettings.upivpa,
                        expiresAt: new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000)
                    }
                });

                // Link seats to the payment session
                await tx.paymentSessionSeat.createMany({
                    data: seatIds.map((id: string) => ({
                        paymentSessionId: paymentSession.id,
                        seatId: id
                    }))
                });

                // Lock the seats
                await tx.seat.updateMany({
                    where: { id: { in: seatIds } },
                    data: {
                        status: PrismaSeatStatus.LOCKED
                    }
                });

                // Generate UPI payment link
                const upiLink = UpiPaymentController.generateUpiLink(
                    upiSettings.upivpa,
                    totalAmount,
                    referenceId
                );

                // Generate QR code for UPI link
                const qrCodeDataUrl = await generateQRCode(upiLink);

                // Update payment session with QR code and UPI link
                await tx.paymentSession.update({
                    where: { id: paymentSession.id },
                    data: {
                        qrCodeUrl: qrCodeDataUrl,
                        upiDeeplink: upiLink
                    }
                });

                return {
                    sessionId: paymentSession.id,
                    referenceId,
                    amount: totalAmount,
                    upiId: upiSettings.upivpa,
                    qrCode: qrCodeDataUrl,
                    upiLink,
                    expiresAt: paymentSession.expiresAt
                };
            });

            // Emit seat locked events via WebSocket
            seatIds.forEach((seatId: string) => {
                WebsocketService.emitSeatStatusChange(eventId, seatId, 'LOCKED');
            });

            return ApiResponse.success(res, 200, 'Payment session initiated', result);
        } catch (error) {
            console.error('Error initiating payment:', error);
            if (error instanceof ApiError) {
                return ApiResponse.error(
                    res,
                    error.statusCode,
                    error.message
                );
            }
            return ApiResponse.error(
                res,
                500,
                'Failed to initiate payment'
            );
        }
    };

    /**
     * Check payment status
     * @route GET /api/payments/status/:sessionId
     */
    static getPaymentStatus = async (req: Request, res: Response) => {
        const { sessionId } = req.params;

        try {
            const paymentSession = await prisma.paymentSession.findUnique({
                where: { id: sessionId },
                include: { sessionSeats: true }
            });

            if (!paymentSession) {
                throw new ApiError(404, 'Payment session not found');
            }

            return ApiResponse.success(res, 200, 'Payment status retrieved', paymentSession);
        } catch (error) {
            logger.error('Error checking payment status:', error);
            if (error instanceof ApiError) {
                return ApiResponse.error(
                    res,
                    error.statusCode,
                    error.message
                );
            }
            return ApiResponse.error(
                res,
                500,
                'Failed to check payment status'
            );
        }
    };

    /**
     * Confirm a payment with UTR number
     * @route POST /api/payments/confirm
     */
    static confirmPayment = async (req: Request, res: Response) => {
        const { sessionId, utrNumber } = req.body;

        try {
            // Validation
            if (!sessionId || !utrNumber) {
                throw new ApiError(400, 'Session ID and UTR number are required');
            }

            // Find the payment session
            const paymentSession = await prisma.paymentSession.findUnique({
                where: { id: sessionId },
                include: { seats: true }
            });

            if (!paymentSession) {
                throw new ApiError(404, 'Payment session not found');
            }

            if (paymentSession.status !== PrismaPaymentStatus.PENDING) {
                throw new ApiError(400, `Payment already ${paymentSession.status.toLowerCase()}`);
            }

            // Check if payment session is expired
            if (new Date() > paymentSession.expiresAt) {
                // Release the seats
                await UpiPaymentController.releaseExpiredSession(paymentSession.id);
                throw new ApiError(400, 'Payment session expired');
            }

            // Update payment session status to verification pending
            // Use a string literal since the enum may not have this status
            await prisma.paymentSession.update({
                where: { id: sessionId },
                data: {
                    status: 'VERIFICATION_PENDING' as PrismaPaymentStatus,
                    utrNumber
                }
            });

            // For demo purposes, we'll immediately confirm the payment
            // In production, this would be handled via admin verification or a webhook
            const result = await UpiPaymentController.processPaymentConfirmation(sessionId);

            return ApiResponse.success(res, 200, 'Payment confirmed', result);
        } catch (error) {
            console.error('Error confirming payment:', error);
            if (error instanceof ApiError) {
                return ApiResponse.error(
                    res,
                    error.statusCode,
                    error.message
                );
            }
            return ApiResponse.error(
                res,
                500,
                'Failed to confirm payment'
            );
        }
    };

    /**
     * Process payment confirmation (internal method)
     */
    static processPaymentConfirmation = async (sessionId: string) => {
        return prisma.$transaction(async (tx) => {
            const paymentSession = await tx.paymentSession.findUnique({
                where: { id: sessionId },
                include: {
                    sessionSeats: {
                        include: {
                            seat: true
                        }
                    }
                }
            });

            if (!paymentSession) {
                throw new Error('Payment session not found');
            }

            const seatIds = paymentSession.sessionSeats.map(s => s.seatId);
            const seats = paymentSession.sessionSeats.map(s => s.seat).filter(Boolean) as any[];

            // Update payment session status
            const updatedSession = await tx.paymentSession.update({
                where: { id: sessionId },
                data: {
                    status: PrismaPaymentStatus.COMPLETED,
                    updatedAt: new Date()
                }
            });

            // Mark seats as booked
            await tx.seat.updateMany({
                where: { id: { in: seatIds } },
                data: {
                    status: PrismaSeatStatus.BOOKED
                }
            });

            // Create booking record
            const booking = await tx.booking.create({
                data: {
                    userId: paymentSession.userId,
                    eventId: paymentSession.eventId,
                    status: 'CONFIRMED',
                    finalAmount: paymentSession.amount,
                    seats: seats.map(seat => ({
                        id: seat.id,
                        section: seat.section,
                        row: seat.row,
                        seatNumber: seat.seatNumber
                    }))
                }
            });

            // Link payment session to booking
            await tx.paymentSession.update({
                where: { id: sessionId },
                data: {
                    booking: {
                        connect: { id: booking.id }
                    }
                }
            });

            // Create payment record
            await tx.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: paymentSession.amount,
                    status: PrismaPaymentStatus.COMPLETED,
                    method: 'UPI'
                }
            });

            // Emit seat booked events
            seatIds.forEach(seatId => {
                WebsocketService.emitSeatStatusChange(paymentSession.eventId, seatId, PrismaSeatStatus.BOOKED);
            });

            return {
                paymentSession: updatedSession,
                booking
            };
        });
    };

    /**
     * Release expired payment sessions (used by background job)
     */
    static releaseExpiredSessions = async () => {
        try {
            // Find all expired payment sessions that are still pending
            const expiredSessions = await prisma.paymentSession.findMany({
                where: {
                    status: PrismaPaymentStatus.PENDING,
                    expiresAt: { lt: new Date() }
                }
            });

            logger.info(`Found ${expiredSessions.length} expired payment sessions`);

            // Process each expired session
            for (const session of expiredSessions) {
                await UpiPaymentController.releaseExpiredSession(session.id);
            }

            return expiredSessions.length;
        } catch (error) {
            logger.error('Error releasing expired payment sessions:', error);
            throw error;
        }
    };

    /**
     * Release a specific expired payment session
     */
    static releaseExpiredSession = async (sessionId: string) => {
        return prisma.$transaction(async (tx) => {
            // Get the payment session with seats
            const session = await tx.paymentSession.findUnique({
                where: { id: sessionId },
                include: {
                    sessionSeats: true
                }
            });

            if (!session) {
                throw new Error(`Payment session ${sessionId} not found`);
            }

            // Update session status to expired
            // Use a string literal since the enum may not have this status
            await tx.paymentSession.update({
                where: { id: sessionId },
                data: {
                    status: PrismaPaymentStatus.FAILED,
                    updatedAt: new Date()
                }
            });

            // Release seats
            const seatIds = session.sessionSeats.map(seat => seat.seatId);
            await tx.seat.updateMany({
                where: { id: { in: seatIds } },
                data: {
                    status: PrismaSeatStatus.AVAILABLE
                }
            });

            // Emit seat released events
            seatIds.forEach(seatId => {
                WebsocketService.emitSeatStatusChange(session.eventId, seatId, PrismaSeatStatus.AVAILABLE);
            });

            return session;
        });
    };

    /**
     * Generate UPI deep link
     */
    private static generateUpiLink(upiId: string, amount: number | string, referenceId: string): string {
        // Format: upi://pay?pa=[VPA]&pn=[NAME]&tr=[TRANSACTION_REFERENCE]&am=[AMOUNT]&cu=[CURRENCY]&tn=[DESCRIPTION]
        const upiParams = new URLSearchParams({
            pa: upiId, // VPA (UPI ID)
            pn: 'Eventia Tickets',  // Merchant name
            tr: referenceId,                    // Transaction reference
            am: amount.toString(),              // Amount
            cu: 'INR',                          // Currency
            tn: `Ticket booking - ${referenceId}`  // Description
        });

        return `upi://pay?${upiParams.toString()}`;
    }
}

export default UpiPaymentController;
