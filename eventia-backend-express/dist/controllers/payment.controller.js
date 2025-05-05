"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentStatus = exports.releaseExpiredSeatLocks = exports.getPaymentStatus = exports.initiatePayment = exports.PaymentController = void 0;
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db");
const uuid_1 = require("uuid");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const websocket_service_1 = require("../services/websocket.service");
const retry_1 = require("../utils/retry");
const ticket_service_1 = require("../services/ticket.service");
const client_1 = require("@prisma/client");
const seatService = __importStar(require("../services/seat.service"));
const bookingService = __importStar(require("../services/booking.service"));
const socketService = __importStar(require("../services/websocket.service"));
const upiPaymentService = __importStar(require("../services/upiPayment.service"));
const qrcode = __importStar(require("qrcode"));
// Define seat status enum values
var SeatStatus;
(function (SeatStatus) {
    SeatStatus["AVAILABLE"] = "AVAILABLE";
    SeatStatus["RESERVED"] = "RESERVED";
    SeatStatus["LOCKED"] = "LOCKED";
    SeatStatus["BOOKED"] = "BOOKED";
})(SeatStatus || (SeatStatus = {}));
const prisma = new client_1.PrismaClient();
// Lock timeout in minutes
const SEAT_LOCK_TIMEOUT_MINUTES = 10;
/**
 * Controller for handling payment operations
 */
class PaymentController {
    /**
     * Initialize a new payment
     * @route POST /api/payments/initialize
     */
    static initializePayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { booking_id, payment_method, currency = 'INR' } = req.body;
        if (!booking_id || !payment_method) {
            throw new apiError_1.ApiError(400, 'Booking ID and payment method are required', 'MISSING_REQUIRED_FIELDS');
        }
        // Validate if booking exists and is in pending state
        const booking = await (0, db_1.db)('bookings')
            .select('*')
            .where({ id: booking_id })
            .first();
        if (!booking) {
            throw new apiError_1.ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
        }
        if (booking.status !== 'pending') {
            throw new apiError_1.ApiError(400, `Cannot initialize payment for booking in ${booking.status} state`, 'INVALID_BOOKING_STATUS');
        }
        // Check if payment already exists for this booking
        const existingPayment = await (0, db_1.db)('booking_payments')
            .select('id', 'status')
            .where({ booking_id })
            .first();
        if (existingPayment) {
            // If payment exists but was rejected, allow re-initialization
            if (existingPayment.status === 'rejected') {
                await (0, db_1.db)('booking_payments')
                    .where({ id: existingPayment.id })
                    .update({
                    status: 'pending',
                    updated_at: db_1.db.fn.now()
                });
                return apiResponse_1.ApiResponse.success(res, 200, 'Payment re-initialized successfully', {
                    payment_id: existingPayment.id,
                    booking_id,
                    payment_method,
                    amount: booking.final_amount,
                    currency,
                    status: 'pending'
                });
            }
            // If payment exists and is not rejected, prevent re-initialization
            throw new apiError_1.ApiError(400, `Payment already initialized with status: ${existingPayment.status}`, 'PAYMENT_ALREADY_EXISTS');
        }
        // Create new payment record
        try {
            const result = await db_1.db.transaction(async (trx) => {
                // Create payment record
                const [payment] = await trx('booking_payments').insert({
                    id: (0, uuid_1.v4)(),
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
            return apiResponse_1.ApiResponse.success(res, 201, 'Payment initialized successfully', result);
        }
        catch (error) {
            logger_1.logger.error('Error initializing payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to initialize payment', 'PAYMENT_INITIALIZATION_FAILED');
        }
    });
    /**
     * Create a new payment
     * @route POST /api/payments
     */
    static createPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { booking_id, amount, payment_method } = req.body;
        if (!booking_id || !amount || !payment_method) {
            throw new apiError_1.ApiError(400, 'Booking ID, amount, and payment method are required', 'MISSING_REQUIRED_FIELDS');
        }
        try {
            const newPayment = await db_1.db.transaction(async (trx) => {
                // Create payment record
                const [payment] = await trx('booking_payments').insert({
                    id: (0, uuid_1.v4)(),
                    booking_id,
                    amount,
                    payment_method,
                    status: 'pending',
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now()
                }).returning('*');
                return payment;
            });
            return apiResponse_1.ApiResponse.success(res, 201, 'Payment created successfully', newPayment);
        }
        catch (error) {
            logger_1.logger.error('Error creating payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to create payment', 'PAYMENT_CREATION_FAILED');
        }
    });
    /**
     * Update UTR number for a payment
     * @route PUT /api/payments/:id/utr
     */
    static updateUtrNumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { utrNumber } = req.body;
        if (!utrNumber) {
            throw new apiError_1.ApiError(400, 'UTR number is required', 'MISSING_UTR_NUMBER');
        }
        // Validate payment exists
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        try {
            // Update UTR number
            const [updatedPayment] = await (0, db_1.db)('booking_payments')
                .where({ id })
                .update({
                utr_number: utrNumber,
                updated_at: db_1.db.fn.now()
            })
                .returning('*');
            return apiResponse_1.ApiResponse.success(res, 200, 'UTR number updated successfully', updatedPayment);
        }
        catch (error) {
            logger_1.logger.error('Error updating UTR number:', error);
            throw new apiError_1.ApiError(500, 'Failed to update UTR number', 'UTR_UPDATE_FAILED');
        }
    });
    /**
     * Get payment by ID
     * @route GET /api/payments/:id
     */
    static getPaymentById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        // Validate payment exists
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        return apiResponse_1.ApiResponse.success(res, 200, 'Payment fetched successfully', payment);
    });
    /**
     * Get payment by booking ID
     * @route GET /api/payments/booking/:bookingId
     */
    static getPaymentByBookingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { bookingId } = req.params;
        // Validate booking ID
        if (!bookingId) {
            throw new apiError_1.ApiError(400, 'Booking ID is required', 'MISSING_BOOKING_ID');
        }
        // Fetch payment by booking ID
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ booking_id: bookingId })
            .first();
        if (!payment) {
            return apiResponse_1.ApiResponse.success(res, 200, 'No payment found for this booking', {});
        }
        return apiResponse_1.ApiResponse.success(res, 200, 'Payment fetched successfully', payment);
    });
    /**
     * Get all payments with pagination and filters
     * @route GET /api/payments
     */
    static getAllPayments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { page = 1, limit = 10, status, startDate, endDate, sort = 'created_at', order = 'desc' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        // Build query with filters
        let query = (0, db_1.db)('booking_payments').select('*');
        // Apply filters if provided
        if (status) {
            query = query.where({ status });
        }
        if (startDate) {
            query = query.where('created_at', '>=', new Date(startDate));
        }
        if (endDate) {
            query = query.where('created_at', '<=', new Date(endDate));
        }
        // Get total count for pagination
        const [{ count }] = await (0, db_1.db)('booking_payments')
            .count('id as count')
            .modify(builder => {
            if (status) {
                builder.where({ status });
            }
            if (startDate) {
                builder.where('created_at', '>=', new Date(startDate));
            }
            if (endDate) {
                builder.where('created_at', '<=', new Date(endDate));
            }
        });
        // Apply sorting and pagination
        const payments = await query
            .orderBy(sort, order)
            .limit(Number(limit))
            .offset(offset);
        const totalPages = Math.ceil(Number(count) / Number(limit));
        return apiResponse_1.ApiResponse.success(res, 200, 'Payments fetched successfully', {
            payments,
            pagination: {
                total: Number(count),
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    });
    /**
     * Verify payment (admin only)
     * @route PUT /api/payments/:id/verify
     */
    static verifyPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const adminId = req.user?.id;
        if (!adminId) {
            throw new apiError_1.ApiError(401, 'Authentication required', 'UNAUTHORIZED');
        }
        // Validate payment exists
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Allow verification only if payment is in awaiting_verification state
        // or if it was previously rejected but has a UTR number (to support retry)
        const canBeVerified = payment.status === 'awaiting_verification' ||
            (payment.status === 'rejected' && payment.utr_number);
        if (!canBeVerified) {
            throw new apiError_1.ApiError(400, `Cannot verify payment in ${payment.status} state`, 'INVALID_PAYMENT_STATUS');
        }
        try {
            // Use retry mechanism with transaction for better reliability
            const result = await (0, retry_1.withRetry)(async () => {
                return await db_1.db.transaction(async (trx) => {
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
                        throw new apiError_1.ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
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
                await ticket_service_1.TicketService.generateTicketsForBooking(result.booking.id, adminId);
                logger_1.logger.info(`Tickets generated for booking ${result.booking.id}`);
            }
            catch (ticketError) {
                // Log ticket generation error but don't fail the verification
                // We can use a queue system to retry ticket generation later
                logger_1.logger.error('Error generating tickets:', ticketError);
                // Update a retry queue for ticket generation
                await (0, db_1.db)('ticket_generation_queue').insert({
                    id: (0, uuid_1.v4)(),
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
                websocket_service_1.WebsocketService.notifyPaymentVerified(id, payment.booking_id);
            }
            catch (wsError) {
                // Just log the error but don't fail the operation
                logger_1.logger.warn('WebSocket payment verification notification failed:', wsError);
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Payment verified successfully', result);
        }
        catch (error) {
            logger_1.logger.error('Error verifying payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to verify payment', 'PAYMENT_VERIFICATION_FAILED');
        }
    });
    /**
     * Reject payment (admin only)
     * @route PUT /api/payments/:id/reject
     */
    static rejectPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user?.id;
        if (!adminId) {
            throw new apiError_1.ApiError(401, 'Authentication required', 'UNAUTHORIZED');
        }
        // Validate payment exists
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        if (payment.status !== 'awaiting_verification') {
            throw new apiError_1.ApiError(400, `Cannot reject payment in ${payment.status} state`, 'INVALID_PAYMENT_STATUS');
        }
        try {
            const result = await db_1.db.transaction(async (trx) => {
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
                websocket_service_1.WebsocketService.notifyPaymentRejected(id, payment.booking_id, rejection_reason);
            }
            catch (wsError) {
                logger_1.logger.warn('WebSocket payment rejection notification failed:', wsError);
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Payment rejected successfully', result);
        }
        catch (error) {
            logger_1.logger.error('Error rejecting payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to reject payment', 'PAYMENT_REJECTION_FAILED');
        }
    });
    /**
     * Handle payment webhooks for external payment providers
     * @route POST /api/payments/webhook
     */
    static handlePaymentWebhook = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const anyPrisma = prisma;
        try {
            // Validate UPI webhook signature
            const isValid = upiPaymentService.validateWebhookSignature(req.body, req.headers['x-signature']);
            if (!isValid) {
                throw new apiError_1.ApiError(400, 'Invalid webhook signature');
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
                    throw new apiError_1.ApiError(404, 'Payment session not found');
                }
                // Update payment session status
                await anyPrisma.paymentSession.update({
                    where: { id: paymentSession.id },
                    data: {
                        status: client_1.PaymentStatus.COMPLETED,
                        utrNumber: utrNumber
                    }
                });
                // Create booking for the payment
                await bookingService.createBookingFromPaymentSession(paymentSession.id, paymentId);
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Webhook processed successfully');
        }
        catch (error) {
            console.error('Error processing webhook:', error);
            if (error instanceof apiError_1.ApiError) {
                return apiResponse_1.ApiResponse.error(res, error.statusCode, error.message, error.code);
            }
            return apiResponse_1.ApiResponse.error(res, 500, 'Failed to process webhook', 'WEBHOOK_PROCESSING_FAILED');
        }
    });
    /**
     * Submit UTR verification for a payment
     * @route POST /api/payments/verify
     */
    static submitUtrVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { payment_id, utr_number, user_id } = req.body;
        if (!payment_id || !utr_number || !user_id) {
            throw new apiError_1.ApiError(400, 'Payment ID, UTR number, and user ID are required', 'MISSING_REQUIRED_FIELDS');
        }
        // Check if payment exists
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id: payment_id })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Validate payment is in pending status
        if (payment.status !== 'pending') {
            throw new apiError_1.ApiError(400, `Cannot verify payment with status: ${payment.status}`, 'INVALID_PAYMENT_STATUS');
        }
        try {
            // Update payment with UTR number
            const [updatedPayment] = await (0, db_1.db)('booking_payments')
                .where({ id: payment_id })
                .update({
                utr_number,
                status: 'verification_pending',
                updated_at: db_1.db.fn.now()
            })
                .returning('*');
            // Notify admins about new verification request
            websocket_service_1.WebsocketService.sendToAdmins('new_payment_verification', {
                payment_id,
                booking_id: payment.booking_id,
                amount: payment.amount,
                utr_number,
                user_id
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'Payment verification submitted successfully', updatedPayment);
        }
        catch (error) {
            logger_1.logger.error('Error submitting UTR verification:', error);
            throw new apiError_1.ApiError(500, 'Failed to submit payment verification', 'VERIFICATION_SUBMISSION_FAILED');
        }
    });
    /**
     * Get payment status
     * @route GET /api/payments/status/:paymentId
     */
    static getPaymentStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { paymentId } = req.params;
        const anyPrisma = prisma;
        if (!paymentId) {
            throw new apiError_1.ApiError(400, 'Payment ID is required', 'MISSING_PAYMENT_ID');
        }
        // Get payment details
        const payment = await anyPrisma.booking_payments
            .select('*')
            .where({ id: paymentId })
            .first();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Get booking details
        const booking = await anyPrisma.bookings
            .select('*')
            .where({ id: payment.booking_id })
            .first();
        return apiResponse_1.ApiResponse.success(res, 200, 'Payment status fetched successfully', {
            payment,
            booking
        });
    });
    /**
     * Generates a QR code for UPI payment
     */
    static generateUpiQr = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            const { data } = req.body;
            if (!data || typeof data !== 'string') {
                throw new apiError_1.ApiError(400, 'Valid UPI payment data is required', 'MISSING_UPI_DATA');
            }
            // Generate QR code as data URL
            const qrCodeUrl = await qrcode.toDataURL(data, {
                errorCorrectionLevel: 'H',
                margin: 1,
                scale: 6
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'QR code generated successfully', {
                qrCodeUrl
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating QR code:', error);
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            throw new apiError_1.ApiError(500, 'Failed to generate QR code', 'QR_GENERATION_ERROR');
        }
    });
}
exports.PaymentController = PaymentController;
/**
 * Initiates a payment and locks selected seats
 */
const initiatePayment = async (req, res) => {
    const { eventId, seatIds } = req.body;
    const userId = req.user?.id;
    if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return apiResponse_1.ApiResponse.error(res, 400, 'EventId and seatIds are required', 'MISSING_REQUIRED_FIELDS');
    }
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Check if seats are available
            const unavailableSeats = await seatService.SeatService.getUnavailableSeats(tx, seatIds);
            if (unavailableSeats.length > 0) {
                throw new apiError_1.ApiError(400, 'Some selected seats are not available', 'SEATS_UNAVAILABLE');
            }
            // Fetch seats with pricing information
            const seats = await tx.seat.findMany({
                where: { id: { in: seatIds } }
            });
            // Calculate total amount
            const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
            // Create payment session instead of payment intent
            const paymentSession = await tx.paymentSession.create({
                data: {
                    userId,
                    eventId,
                    amount: totalAmount,
                    status: client_1.PaymentStatus.PENDING,
                    upiId: 'eventia@okicici',
                    expiresAt: new Date(Date.now() + SEAT_LOCK_TIMEOUT_MINUTES * 60 * 1000),
                    seats: {
                        connect: seatIds.map((id) => ({ id }))
                    }
                }
            });
            // Update seat status to LOCKED
            await tx.seat.updateMany({
                where: { id: { in: seatIds } },
                data: {
                    status: SeatStatus.LOCKED.toString()
                }
            });
            return paymentSession;
        });
        // Notify seat lock via websocket
        seatIds.forEach((seatId) => {
            socketService.WebsocketService.notifySeatStatusChange([seatId], SeatStatus.LOCKED.toString(), eventId);
        });
        return apiResponse_1.ApiResponse.success(res, 200, 'Payment initiated successfully', result);
    }
    catch (error) {
        console.error('Error initiating payment:', error);
        if (error instanceof apiError_1.ApiError) {
            return apiResponse_1.ApiResponse.error(res, error.statusCode, error.message, error.code);
        }
        return apiResponse_1.ApiResponse.error(res, 500, 'Failed to initiate payment', 'PAYMENT_INITIATION_FAILED');
    }
};
exports.initiatePayment = initiatePayment;
/**
 * Checks payment status
 */
const getPaymentStatus = async (req, res) => {
    const { id } = req.params;
    const anyPrisma = prisma;
    try {
        const paymentSession = await anyPrisma.paymentSession.findUnique({
            where: { id },
            include: {
                seats: true
            }
        });
        if (!paymentSession) {
            return apiResponse_1.ApiResponse.error(res, 404, 'Payment session not found', 'PAYMENT_SESSION_NOT_FOUND');
        }
        // Check if it's expired and update status if needed
        if (paymentSession.status === client_1.PaymentStatus.PENDING && new Date() > paymentSession.expiresAt) {
            const updatedSession = await anyPrisma.paymentSession.update({
                where: { id },
                data: { status: client_1.PaymentStatus.FAILED },
                include: { seats: true }
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'Payment status retrieved', updatedSession);
        }
        return apiResponse_1.ApiResponse.success(res, 200, 'Payment status retrieved', paymentSession);
    }
    catch (error) {
        console.error('Error checking payment status:', error);
        if (error instanceof apiError_1.ApiError) {
            return apiResponse_1.ApiResponse.error(res, error.statusCode, error.message, error.code);
        }
        return apiResponse_1.ApiResponse.error(res, 500, 'Failed to check payment status', 'PAYMENT_STATUS_CHECK_FAILED');
    }
};
exports.getPaymentStatus = getPaymentStatus;
/**
 * Releases expired seat locks
 */
const releaseExpiredSeatLocks = async () => {
    try {
        const anyPrisma = prisma;
        const expiredSessions = await anyPrisma.paymentSession.findMany({
            where: {
                status: client_1.PaymentStatus.PENDING,
                expiresAt: { lt: new Date() }
            },
            include: { seats: true }
        });
        for (const session of expiredSessions) {
            // Update payment session status to FAILED (for expiry)
            await (0, exports.updatePaymentStatus)(session.id, client_1.PaymentStatus.FAILED);
        }
        return expiredSessions.length;
    }
    catch (error) {
        console.error('Error releasing expired seat locks:', error);
        throw error;
    }
};
exports.releaseExpiredSeatLocks = releaseExpiredSeatLocks;
/**
 * Updates payment status and performs necessary actions based on status
 */
const updatePaymentStatus = async (sessionId, status, paymentId) => {
    return await prisma.$transaction(async (tx) => {
        // Find payment session
        const paymentSession = await tx.paymentSession.findUnique({
            where: { id: sessionId },
            include: { seats: true }
        });
        if (!paymentSession) {
            throw new apiError_1.ApiError(404, 'Payment session not found', 'PAYMENT_SESSION_NOT_FOUND');
        }
        // Update payment session status
        const updatedSession = await tx.paymentSession.update({
            where: { id: sessionId },
            data: {
                status,
                ...(paymentId && { utrNumber: paymentId })
            },
            include: { seats: true }
        });
        if (status === client_1.PaymentStatus.COMPLETED) {
            // Create booking from payment session
            await tx.seat.updateMany({
                where: {
                    id: { in: paymentSession.seats.map((seat) => seat.id) }
                },
                data: {
                    status: SeatStatus.BOOKED.toString()
                }
            });
            // Create actual booking record
            await bookingService.createBookingFromPaymentSession(tx, sessionId);
            // Notify seat status change via websocket
            paymentSession.seats.forEach((seat) => {
                socketService.WebsocketService.notifySeatStatusChange([seat.id], SeatStatus.BOOKED.toString(), paymentSession.eventId);
            });
        }
        else if (status === client_1.PaymentStatus.FAILED) {
            // Release seats
            await tx.seat.updateMany({
                where: {
                    id: { in: paymentSession.seats.map((seat) => seat.id) }
                },
                data: {
                    status: SeatStatus.AVAILABLE.toString()
                }
            });
            // Notify seat status change via websocket
            paymentSession.seats.forEach((seat) => {
                socketService.WebsocketService.notifySeatStatusChange([seat.id], SeatStatus.AVAILABLE.toString(), paymentSession.eventId);
            });
        }
        return updatedSession;
    });
};
exports.updatePaymentStatus = updatePaymentStatus;
