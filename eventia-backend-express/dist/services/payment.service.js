"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpiSettingsService = exports.PaymentService = void 0;
const apiError_1 = require("../utils/apiError");
const paymentRepository_1 = require("../repositories/paymentRepository");
const prisma_1 = __importDefault(require("../db/prisma"));
const bookingPaymentRepository = new paymentRepository_1.BookingPaymentRepository();
const upiSettingsRepository = new paymentRepository_1.UpiSettingsRepository();
class PaymentService {
    /**
     * Create a new payment record
     */
    static async createPayment(data) {
        // Check if booking exists
        const booking = await prisma_1.default.booking.findUnique({
            where: { id: data.booking_id }
        });
        if (!booking) {
            throw new apiError_1.ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
        }
        // Check if payment already exists for this booking
        const existingPayment = await bookingPaymentRepository.findByBookingId(data.booking_id);
        if (existingPayment) {
            throw new apiError_1.ApiError(400, 'Payment already exists for this booking', 'PAYMENT_EXISTS');
        }
        // Create payment
        return bookingPaymentRepository.create({
            amount: data.amount,
            utrNumber: data.utr_number,
            status: 'pending',
            booking: {
                connect: { id: data.booking_id }
            }
        });
    }
    /**
     * Update UTR number for a payment
     */
    static async updateUtrNumber(id, utrNumber) {
        // Check if payment exists
        await bookingPaymentRepository.findById(id);
        // Update UTR number
        return bookingPaymentRepository.updateUtrNumber(id, utrNumber);
    }
    /**
     * Verify a payment
     */
    static async verifyPayment(id, adminId) {
        // Check if payment exists
        const payment = await bookingPaymentRepository.findById(id);
        // Check payment status
        if (payment.status !== 'pending') {
            throw new apiError_1.ApiError(400, `Payment already ${payment.status}`, 'INVALID_PAYMENT_STATUS');
        }
        // Verify payment
        const verifiedPayment = await bookingPaymentRepository.verifyPayment(id, adminId);
        // Update booking status
        await prisma_1.default.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' }
        });
        return verifiedPayment;
    }
    /**
     * Reject a payment
     */
    static async rejectPayment(id, adminId) {
        // Check if payment exists
        const payment = await bookingPaymentRepository.findById(id);
        // Check payment status
        if (payment.status !== 'pending') {
            throw new apiError_1.ApiError(400, `Payment already ${payment.status}`, 'INVALID_PAYMENT_STATUS');
        }
        // Reject payment
        const rejectedPayment = await bookingPaymentRepository.rejectPayment(id, adminId);
        // Update booking status
        await prisma_1.default.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CANCELLED' }
        });
        return rejectedPayment;
    }
    /**
     * Get payment by ID
     */
    static async getPaymentById(id) {
        return bookingPaymentRepository.findById(id);
    }
    /**
     * Get payment by booking ID
     */
    static async getPaymentByBookingId(bookingId) {
        return bookingPaymentRepository.findByBookingId(bookingId);
    }
    /**
     * Get all payments with pagination and optional status filter
     */
    static async getAllPayments(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const { payments, total } = await bookingPaymentRepository.findAll({
            skip,
            take: limit,
            status
        });
        const pages = Math.ceil(total / limit);
        return {
            payments,
            total,
            pages
        };
    }
    /**
     * Handle successful payment from webhook
     */
    static async handleSuccessfulPayment(paymentId, transactionId) {
        // Check if payment exists
        const payment = await bookingPaymentRepository.findById(paymentId);
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Only process if payment is in pending status
        if (payment.status !== 'pending') {
            console.log(`Payment ${paymentId} already processed, current status: ${payment.status}`);
            return payment;
        }
        // Update payment with transaction ID and verify it
        const updatedPayment = await bookingPaymentRepository.update(paymentId, {
            status: 'verified',
            updatedAt: new Date()
        });
        // Update booking status
        await prisma_1.default.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' }
        });
        return updatedPayment;
    }
    /**
     * Handle failed payment from webhook
     */
    static async handleFailedPayment(paymentId, failureReason) {
        // Check if payment exists
        const payment = await bookingPaymentRepository.findById(paymentId);
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Only process if payment is in pending status
        if (payment.status !== 'pending') {
            console.log(`Payment ${paymentId} already processed, current status: ${payment.status}`);
            return payment;
        }
        // Update payment status to rejected
        const updatedPayment = await bookingPaymentRepository.update(paymentId, {
            status: 'rejected',
            updatedAt: new Date()
        });
        return updatedPayment;
    }
    /**
     * Handle refunded payment from webhook
     */
    static async handleRefundedPayment(paymentId, refundAmount) {
        // Check if payment exists
        const payment = await bookingPaymentRepository.findById(paymentId);
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
        }
        // Only process if payment is in verified status
        if (payment.status !== 'verified') {
            throw new apiError_1.ApiError(400, 'Cannot refund unverified payment', 'INVALID_PAYMENT_STATUS');
        }
        // Update payment status to refunded
        const updatedPayment = await bookingPaymentRepository.update(paymentId, {
            status: 'refunded',
            updatedAt: new Date()
        });
        // Update booking status
        await prisma_1.default.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'REFUNDED' }
        });
        return updatedPayment;
    }
    /**
     * Get active UPI settings
     */
    static async getActiveUpiSettings() {
        return upiSettingsRepository.findActive();
    }
    /**
     * Verify UTR payment
     */
    static async verifyUtrPayment(paymentData) {
        // Using Prisma's transaction to ensure all operations succeed or fail together
        return prisma_1.default.$transaction(async (tx) => {
            // Find the booking payment
            const payment = await tx.bookingPayment.findFirst({
                where: {
                    bookingId: paymentData.bookingId,
                    utrNumber: paymentData.utrNumber,
                    amount: {
                        equals: paymentData.amount
                    }
                }
            });
            if (!payment) {
                throw new apiError_1.ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
            }
            // Update the payment status
            const updatedPayment = await tx.bookingPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'verified',
                    paymentDate: new Date()
                }
            });
            return updatedPayment;
        });
    }
    static verifyWebhookSignature(signature, payload) {
        // In a real implementation, this would verify the webhook signature
        // using the appropriate algorithm and secret key
        // For example, with HMAC:
        // const crypto = require('crypto');
        // const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
        // const digest = hmac.update(JSON.stringify(payload)).digest('hex');
        // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
        // For demo purposes, we'll just return true
        return true;
    }
}
exports.PaymentService = PaymentService;
class UpiSettingsService {
    /**
     * Get active UPI settings
     */
    static async getUpiSettings() {
        return upiSettingsRepository.findActive();
    }
    /**
     * Update UPI settings
     */
    static async updateUpiSettings(id, data) {
        // Make sure settings exist
        await upiSettingsRepository.findById(id);
        // Transform data to match Prisma model
        const updateData = {};
        if (data.upiVPA !== undefined) {
            updateData.upivpa = data.upiVPA;
        }
        if (data.discountAmount !== undefined) {
            updateData.discountamount = data.discountAmount;
        }
        if (data.isActive !== undefined) {
            updateData.isactive = data.isActive;
        }
        updateData.updated_at = new Date();
        return upiSettingsRepository.update(id, updateData);
    }
    /**
     * Create UPI settings
     */
    static async createUpiSettings(data) {
        return upiSettingsRepository.create({
            upivpa: data.upiVPA,
            discountamount: data.discountAmount,
            isactive: data.isActive
        });
    }
}
exports.UpiSettingsService = UpiSettingsService;
