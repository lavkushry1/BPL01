"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpiSettingsModel = exports.PaymentModel = exports.upiSettingsSchema = exports.paymentSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
// Payment schema for validation
exports.paymentSchema = zod_1.z.object({
    booking_id: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    utr_number: zod_1.z.string().optional(),
    payment_date: zod_1.z.string().optional(),
    status: zod_1.z.enum(['pending', 'verified', 'rejected', 'refunded']),
    verified_by: zod_1.z.string().optional(),
});
// UPI Settings schema for validation
exports.upiSettingsSchema = zod_1.z.object({
    upiVPA: zod_1.z.string().min(1),
    discountAmount: zod_1.z.number().min(0),
    isActive: zod_1.z.boolean(),
});
class PaymentModel {
    /**
     * Create a new payment record
     */
    static async create(data) {
        const [payment] = await (0, db_1.db)('booking_payments')
            .insert({
            booking_id: data.booking_id,
            amount: data.amount,
            utr_number: data.utr_number,
            payment_date: data.payment_date,
            status: data.status,
            verified_by: data.verified_by
        })
            .returning('*');
        return payment;
    }
    /**
     * Update UTR number for a payment
     */
    static async updateUtrNumber(id, utrNumber) {
        const [payment] = await (0, db_1.db)('booking_payments')
            .update({
            utr_number: utrNumber,
            updated_at: new Date().toISOString()
        })
            .where({ id })
            .returning('*');
        return payment;
    }
    /**
     * Verify a payment
     */
    static async verifyPayment(id, adminId) {
        const [payment] = await (0, db_1.db)('booking_payments')
            .update({
            status: 'verified',
            verified_by: adminId,
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .where({ id })
            .returning('*');
        return payment;
    }
    /**
     * Reject a payment
     */
    static async rejectPayment(id, adminId) {
        const [payment] = await (0, db_1.db)('booking_payments')
            .update({
            status: 'rejected',
            verified_by: adminId,
            updated_at: new Date().toISOString()
        })
            .where({ id })
            .returning('*');
        return payment;
    }
    /**
     * Get payment by ID
     */
    static async getById(id) {
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ id })
            .first();
        return payment || null;
    }
    /**
     * Get payment by booking ID
     */
    static async getByBookingId(bookingId) {
        const payment = await (0, db_1.db)('booking_payments')
            .select('*')
            .where({ booking_id: bookingId })
            .first();
        return payment || null;
    }
    /**
     * Get all payments
     */
    static async getAll(page = 1, limit = 10, status) {
        const query = (0, db_1.db)('booking_payments').select('*');
        if (status) {
            query.where({ status });
        }
        const offset = (page - 1) * limit;
        const [paymentsResult, countResult] = await Promise.all([
            query.clone().offset(offset).limit(limit).orderBy('created_at', 'desc'),
            query.clone().count('* as count').first()
        ]);
        return {
            payments: paymentsResult,
            total: Number(countResult?.count || 0)
        };
    }
}
exports.PaymentModel = PaymentModel;
class UpiSettingsModel {
    /**
     * Get active UPI settings
     */
    static async getActive() {
        const settings = await (0, db_1.db)('upi_settings')
            .select('*')
            .where({ isactive: true })
            .first();
        if (!settings)
            return null;
        // Convert DB column names to camelCase for API consistency
        return {
            id: settings.id,
            upiVPA: settings.upivpa,
            discountAmount: settings.discountamount,
            isActive: settings.isactive,
            created_at: settings.created_at,
            updated_at: settings.updated_at
        };
    }
    /**
     * Update UPI settings
     */
    static async update(id, data) {
        const [settings] = await (0, db_1.db)('upi_settings')
            .update({
            upivpa: data.upiVPA,
            discountamount: data.discountAmount,
            isactive: data.isActive,
            updated_at: new Date().toISOString()
        })
            .where({ id })
            .returning('*');
        // Convert DB column names to camelCase for API consistency
        return {
            id: settings.id,
            upiVPA: settings.upivpa,
            discountAmount: settings.discountamount,
            isActive: settings.isactive,
            created_at: settings.created_at,
            updated_at: settings.updated_at
        };
    }
    /**
     * Create UPI settings
     */
    static async create(data) {
        // If isActive is true, deactivate all other settings first
        if (data.isActive) {
            await (0, db_1.db)('upi_settings')
                .update({ isactive: false, updated_at: new Date().toISOString() });
        }
        const [settings] = await (0, db_1.db)('upi_settings')
            .insert({
            upivpa: data.upiVPA,
            discountamount: data.discountAmount,
            isactive: data.isActive,
        })
            .returning('*');
        // Convert DB column names to camelCase for API consistency
        return {
            id: settings.id,
            upiVPA: settings.upivpa,
            discountAmount: settings.discountamount,
            isActive: settings.isactive,
            created_at: settings.created_at,
            updated_at: settings.updated_at
        };
    }
}
exports.UpiSettingsModel = UpiSettingsModel;
//# sourceMappingURL=payment.js.map