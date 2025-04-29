"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpiSettingsRepository = exports.BookingPaymentRepository = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
/**
 * Repository for booking payment operations
 */
class BookingPaymentRepository {
    /**
     * Find a booking payment by ID
     */
    async findById(id) {
        try {
            const payment = await prisma_1.default.bookingPayment.findUnique({
                where: { id }
            });
            return payment;
        }
        catch (error) {
            console.error('Error finding payment by ID:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding payment');
        }
    }
    /**
     * Find a booking payment by booking ID
     */
    async findByBookingId(bookingId) {
        try {
            const payment = await prisma_1.default.bookingPayment.findFirst({
                where: { bookingId }
            });
            return payment;
        }
        catch (error) {
            console.error('Error finding payment by booking ID:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding payment');
        }
    }
    /**
     * Find a booking payment by UTR number
     */
    async findByUtrNumber(utrNumber) {
        try {
            const payment = await prisma_1.default.bookingPayment.findFirst({
                where: { utrNumber }
            });
            return payment;
        }
        catch (error) {
            console.error('Error finding payment by UTR number:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding payment');
        }
    }
    /**
     * Create a new booking payment
     */
    async create(data) {
        try {
            const payment = await prisma_1.default.bookingPayment.create({
                data
            });
            return payment;
        }
        catch (error) {
            console.error('Error creating payment:', error);
            throw new apiError_1.ApiError(500, 'Database error when creating payment');
        }
    }
    /**
     * Update an existing booking payment
     */
    async update(id, data) {
        try {
            const payment = await prisma_1.default.bookingPayment.update({
                where: { id },
                data
            });
            return payment;
        }
        catch (error) {
            console.error('Error updating payment:', error);
            throw new apiError_1.ApiError(500, 'Database error when updating payment');
        }
    }
    /**
     * Verify a payment
     */
    async verifyPayment(id, adminId) {
        try {
            const payment = await prisma_1.default.bookingPayment.update({
                where: { id },
                data: {
                    status: 'verified',
                    verifiedBy: adminId,
                    paymentDate: new Date(),
                    updatedAt: new Date()
                }
            });
            return payment;
        }
        catch (error) {
            console.error('Error verifying payment:', error);
            throw new apiError_1.ApiError(500, 'Database error when verifying payment');
        }
    }
    /**
     * Reject a payment
     */
    async rejectPayment(id, adminId) {
        try {
            const payment = await prisma_1.default.bookingPayment.update({
                where: { id },
                data: {
                    status: 'rejected',
                    verifiedBy: adminId,
                    updatedAt: new Date()
                }
            });
            return payment;
        }
        catch (error) {
            console.error('Error rejecting payment:', error);
            throw new apiError_1.ApiError(500, 'Database error when rejecting payment');
        }
    }
    /**
     * Find all payments with pagination and filtering
     */
    async findAll({ skip, take, status }) {
        try {
            const where = status ? { status } : {};
            const [payments, total] = await Promise.all([
                prisma_1.default.bookingPayment.findMany({
                    where,
                    skip,
                    take,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        booking: true
                    }
                }),
                prisma_1.default.bookingPayment.count({ where })
            ]);
            return { payments, total };
        }
        catch (error) {
            console.error('Error finding payments:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding payments');
        }
    }
}
exports.BookingPaymentRepository = BookingPaymentRepository;
/**
 * Repository for UPI settings
 */
class UpiSettingsRepository {
    /**
     * Find active UPI settings
     */
    async findActive() {
        try {
            const settings = await prisma_1.default.upiSettings.findFirst({
                where: { isactive: true } // Updated field name
            });
            return settings;
        }
        catch (error) {
            console.error('Error finding active UPI settings:', error);
            throw new apiError_1.ApiError(500, 'Database error when finding UPI settings');
        }
    }
    /**
     * Create new UPI settings
     */
    async create(data) {
        try {
            // Deactivate all existing settings
            await prisma_1.default.upiSettings.updateMany({
                data: { isactive: false } // Updated field name
            });
            // Create new settings
            const settings = await prisma_1.default.upiSettings.create({
                data: {
                    ...data,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
            return settings;
        }
        catch (error) {
            console.error('Error creating UPI settings:', error);
            throw new apiError_1.ApiError(500, 'Database error when creating UPI settings');
        }
    }
    /**
     * Update UPI settings
     */
    async update(id, data) {
        try {
            const settings = await prisma_1.default.upiSettings.update({
                where: { id },
                data: {
                    ...data,
                    updated_at: new Date() // Updated field name
                }
            });
            return settings;
        }
        catch (error) {
            console.error('Error updating UPI settings:', error);
            throw new apiError_1.ApiError(500, 'Database error when updating UPI settings');
        }
    }
}
exports.UpiSettingsRepository = UpiSettingsRepository;
