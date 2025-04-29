"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReconciliationService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
/**
 * Payment Reconciliation Service
 *
 * This service handles the process of matching incoming bank transactions
 * with booking payments in the system, especially for UPI and bank transfers
 * where payment confirmation might come through different channels.
 */
class PaymentReconciliationService {
    /**
     * Match a bank transaction with a payment in the system
     * @param transactionData Transaction data from bank or payment gateway
     */
    static async reconcileTransaction(transactionData) {
        // Extract UTR number or reference ID from transaction
        const utrOrRef = transactionData.utrNumber ||
            transactionData.bankRef ||
            transactionData.beneficiaryRef;
        if (!utrOrRef) {
            return {
                matched: false,
                message: 'No UTR or reference ID found in transaction data'
            };
        }
        try {
            // Look for payments with matching UTR number
            const payment = await prisma_1.default.bookingPayment.findFirst({
                where: {
                    OR: [
                        { utrNumber: utrOrRef },
                        { transactionId: transactionData.transactionId }
                    ],
                    // Only match pending or unverified payments
                    status: 'pending'
                },
                include: {
                    booking: true
                }
            });
            if (!payment) {
                // No matching payment found, log this for manual review
                await this.logUnmatchedTransaction(transactionData);
                return {
                    matched: false,
                    message: 'No matching payment found'
                };
            }
            // Check if amount matches
            const amountDifference = Math.abs(payment.amount - transactionData.amount);
            const isAmountMatching = amountDifference <= 1; // Allow 1 unit difference for rounding
            if (!isAmountMatching) {
                await this.logReconciliationIssue({
                    paymentId: payment.id,
                    bookingId: payment.bookingId,
                    issue: 'AMOUNT_MISMATCH',
                    expectedAmount: payment.amount,
                    receivedAmount: transactionData.amount,
                    transactionId: transactionData.transactionId
                });
                return {
                    matched: false,
                    paymentId: payment.id,
                    bookingId: payment.bookingId,
                    message: 'Amount does not match'
                };
            }
            // Update payment status to verified
            await prisma_1.default.bookingPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'verified',
                    transactionId: transactionData.transactionId,
                    utrNumber: transactionData.utrNumber || payment.utrNumber,
                    verifiedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Update booking status
            await prisma_1.default.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CONFIRMED' }
            });
            return {
                matched: true,
                paymentId: payment.id,
                bookingId: payment.bookingId,
                message: 'Payment reconciled and verified successfully'
            };
        }
        catch (error) {
            console.error('Error during payment reconciliation:', error);
            throw new apiError_1.ApiError(500, 'Error during payment reconciliation', 'RECONCILIATION_ERROR');
        }
    }
    /**
     * Log an unmatched transaction for manual review
     * @param transactionData Transaction data to log
     */
    static async logUnmatchedTransaction(transactionData) {
        try {
            await prisma_1.default.reconciliationLog.create({
                data: {
                    type: 'UNMATCHED_TRANSACTION',
                    transactionId: transactionData.transactionId,
                    amount: transactionData.amount,
                    referenceId: transactionData.utrNumber || transactionData.bankRef,
                    details: JSON.stringify(transactionData),
                    status: 'PENDING_REVIEW',
                    createdAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error logging unmatched transaction:', error);
        }
    }
    /**
     * Log a reconciliation issue for manual review
     * @param issueData Data about the reconciliation issue
     */
    static async logReconciliationIssue(issueData) {
        try {
            await prisma_1.default.reconciliationLog.create({
                data: {
                    type: 'RECONCILIATION_ISSUE',
                    paymentId: issueData.paymentId,
                    bookingId: issueData.bookingId,
                    transactionId: issueData.transactionId,
                    amount: issueData.receivedAmount,
                    details: JSON.stringify(issueData),
                    status: 'PENDING_REVIEW',
                    createdAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error logging reconciliation issue:', error);
        }
    }
    /**
     * Get reconciliation logs for admin review
     * @param filter Filter criteria
     * @param page Page number
     * @param limit Items per page
     */
    static async getReconciliationLogs(filter, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filter.status)
            where.status = filter.status;
        if (filter.type)
            where.type = filter.type;
        const [logs, total] = await Promise.all([
            prisma_1.default.reconciliationLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.reconciliationLog.count({ where })
        ]);
        return {
            logs,
            total,
            pages: Math.ceil(total / limit)
        };
    }
    /**
     * Update the status of a reconciliation log
     * @param logId Log ID
     * @param status New status
     * @param resolution Optional resolution notes
     */
    static async updateReconciliationLog(logId, status, resolution) {
        return prisma_1.default.reconciliationLog.update({
            where: { id: logId },
            data: {
                status,
                resolution,
                updatedAt: new Date()
            }
        });
    }
    /**
     * Schedule a reconciliation job for periodic execution
     * @param schedulePattern Cron pattern for job schedule
     */
    static scheduleReconciliationJob(schedulePattern = '0 */2 * * *') {
        // In a real implementation, this would use a job scheduler like node-cron
        console.log(`Payment reconciliation job scheduled with pattern: ${schedulePattern}`);
        // Example of what the scheduled job would do:
        // 1. Fetch new transactions from bank API
        // 2. For each transaction, call reconcileTransaction()
        // 3. Generate a reconciliation report
    }
}
exports.PaymentReconciliationService = PaymentReconciliationService;
