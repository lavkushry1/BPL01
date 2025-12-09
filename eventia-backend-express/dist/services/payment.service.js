"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../db/prisma");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
exports.paymentService = {
    /**
     * Create a new UTR payment record (BookingPayment)
     */
    async createUTRPayment(data) {
        try {
            // Check if BookingPayment already exists
            const existing = await prisma_1.prisma.bookingPayment.findUnique({
                where: { bookingId: data.booking_id }
            });
            if (existing) {
                return await prisma_1.prisma.bookingPayment.update({
                    where: { bookingId: data.booking_id },
                    data: {
                        utrNumber: data.utr_number,
                        status: data.status,
                        paymentDate: data.payment_date || new Date()
                    }
                });
            }
            return await prisma_1.prisma.bookingPayment.create({
                data: {
                    bookingId: data.booking_id,
                    amount: data.amount,
                    utrNumber: data.utr_number,
                    status: data.status,
                    paymentDate: data.payment_date || new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating UTR payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to create UTR payment record');
        }
    },
    /**
     * Create a generic payment record
     */
    async createPayment(data) {
        try {
            // Map to Prisma Payment model
            // Note: Prisma Payment model is different from the Payment interface
            // We'll try to save what we can to the Payment table
            const statusMap = {
                'pending': client_1.PaymentStatus.PENDING,
                'verified': client_1.PaymentStatus.COMPLETED,
                'rejected': client_1.PaymentStatus.FAILED,
                'refunded': client_1.PaymentStatus.REFUNDED
            };
            const prismaStatus = statusMap[data.status] || client_1.PaymentStatus.PENDING;
            return await prisma_1.prisma.payment.create({
                data: {
                    bookingId: data.booking_id,
                    amount: data.amount,
                    status: prismaStatus,
                    method: data.payment_method || 'unknown'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to create payment record');
        }
    },
    /**
     * Get payment by booking ID
     */
    async getPaymentByBookingId(bookingId) {
        try {
            return await prisma_1.prisma.bookingPayment.findUnique({
                where: { bookingId }
            });
        }
        catch (error) {
            throw new apiError_1.ApiError(500, 'Failed to fetch payment');
        }
    },
    /**
     * Verify a payment (Admin)
     */
    async verifyPayment(bookingId, adminId) {
        try {
            // Start a transaction to update both BookingPayment and Booking
            return await prisma_1.prisma.$transaction(async (tx) => {
                // 1. Update BookingPayment
                const payment = await tx.bookingPayment.update({
                    where: { bookingId },
                    data: {
                        status: 'verified',
                        verifiedBy: adminId
                    }
                });
                // 2. Update Booking status
                await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: 'CONFIRMED' }
                });
                // 3. Update main Payment record if exists
                const mainPayment = await tx.payment.findUnique({
                    where: { bookingId }
                });
                if (mainPayment) {
                    await tx.payment.update({
                        where: { bookingId },
                        data: { status: client_1.PaymentStatus.COMPLETED }
                    });
                }
                return payment;
            });
        }
        catch (error) {
            logger_1.logger.error('Error verifying payment:', error);
            throw new apiError_1.ApiError(500, 'Failed to verify payment');
        }
    },
    /**
     * Reject a payment
     */
    async rejectPayment(bookingId, adminId) {
        try {
            return await prisma_1.prisma.bookingPayment.update({
                where: { bookingId },
                data: {
                    status: 'rejected',
                    verifiedBy: adminId
                }
            });
        }
        catch (error) {
            throw new apiError_1.ApiError(500, 'Failed to reject payment');
        }
    }
};
//# sourceMappingURL=payment.service.js.map