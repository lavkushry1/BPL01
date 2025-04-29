"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const apiUtils_1 = require("@/services/api/apiUtils");
const paymentApi_1 = require("@/services/api/paymentApi");
exports.paymentService = {
    /**
     * Create a new payment record
     */
    async createPayment(payment) {
        try {
            const response = await (0, paymentApi_1.recordUpiPayment)({
                bookingId: payment.booking_id,
                utrNumber: payment.utr_number,
                paymentDate: payment.payment_date
            });
            return payment; // Type conversion needed
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * Update UTR number for a payment
     */
    async updateUtrNumber(id, utrNumber) {
        try {
            // Use defaultApiClient directly since there's no specific function for this
            const response = await apiUtils_1.defaultApiClient.patch(`/payments/${id}/utr`, { utrNumber });
            return response.data.payment;
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * Verify a payment
     */
    async verifyPayment(id, adminId) {
        try {
            // verifyPayment API function only accepts bookingId, so we use defaultApiClient directly
            const response = await apiUtils_1.defaultApiClient.post(`/payments/${id}/admin-verify`, { adminId });
            return response.data.payment;
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * Reject a payment
     */
    async rejectPayment(id, adminId) {
        try {
            const response = await apiUtils_1.defaultApiClient.post(`/payments/${id}/reject`, { adminId });
            return response.data.payment;
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * Get payment by booking ID
     */
    async getPaymentByBookingId(bookingId) {
        try {
            const response = await apiUtils_1.defaultApiClient.get(`/payments/booking/${bookingId}`);
            return response.data.payment;
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * Get UPI settings
     */
    async getUpiSettings() {
        try {
            const response = await (0, paymentApi_1.getActiveUpiSettings)();
            return response;
        }
        catch (error) {
            return null;
        }
    },
    /**
     * Update UPI settings
     */
    async updateUpiSettings(settings) {
        try {
            if (!settings.id) {
                throw new Error('UPI setting ID is required for update');
            }
            const response = await (0, paymentApi_1.updateUpiSetting)(settings.id, settings);
            return response;
        }
        catch (error) {
            throw error;
        }
    }
};
