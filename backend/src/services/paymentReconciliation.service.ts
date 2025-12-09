import prisma from '../db/prisma';
import { ApiError } from '../utils/apiError';

/**
 * Payment Reconciliation Service
 *
 * This service handles the process of matching incoming bank transactions
 * with booking payments in the system, especially for UPI and bank transfers
 * where payment confirmation might come through different channels.
 */
export class PaymentReconciliationService {
  /**
   * Match a bank transaction with a payment in the system
   * @param transactionData Transaction data from bank or payment gateway
   */
  static async reconcileTransaction(transactionData: {
    transactionId: string;
    amount: number;
    bankRef: string;
    utrNumber?: string;
    paymentDate: Date;
    accountNumber?: string;
    beneficiaryRef?: string;
  }): Promise<{
    matched: boolean;
    paymentId?: string;
    bookingId?: string;
    message: string;
  }> {
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
      const payment = await prisma.bookingPayment.findFirst({
        where: {
          OR: [
            { utrNumber: utrOrRef },
          ],
          // Only match pending or unverified payments
          status: 'pending'
        } as any,
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
      const amountDifference = Math.abs(Number(payment.amount) - transactionData.amount);
      const isAmountMatching = amountDifference <= 1; // Allow 1 unit difference for rounding

      if (!isAmountMatching) {
        await this.logReconciliationIssue({
          paymentId: payment.id,
          bookingId: payment.bookingId,
          issue: 'AMOUNT_MISMATCH',
          expectedAmount: Number(payment.amount),
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
      await prisma.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status: 'verified',
          utrNumber: transactionData.utrNumber || payment.utrNumber,
          updatedAt: new Date()
        } as any
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' }
      });

      return {
        matched: true,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        message: 'Payment reconciled and verified successfully'
      };
    } catch (error) {
      console.error('Error during payment reconciliation:', error);
      throw new ApiError(500, 'Error during payment reconciliation', 'RECONCILIATION_ERROR');
    }
  }

  /**
   * Log an unmatched transaction for manual review
   * @param transactionData Transaction data to log
   */
  private static async logUnmatchedTransaction(transactionData: any): Promise<void> {
    try {
      await (prisma as any).reconciliationLog.create({
        data: {
          paymentId: transactionData.transactionId || 'unknown',
          transactionId: transactionData.transactionId,
          amount: transactionData.amount,
          notes: JSON.stringify(transactionData),
          status: 'pending'
        } as any
      });
    } catch (error) {
      console.error('Error logging unmatched transaction:', error);
    }
  }

  /**
   * Log a reconciliation issue for manual review
   * @param issueData Data about the reconciliation issue
   */
  private static async logReconciliationIssue(issueData: {
    paymentId: string;
    bookingId: string;
    issue: string;
    expectedAmount: number;
    receivedAmount: number;
    transactionId: string;
  }): Promise<void> {
    try {
      await prisma.reconciliationLog.create({
        data: {
          paymentId: issueData.paymentId,
          transactionId: issueData.transactionId,
          amount: issueData.receivedAmount,
          notes: JSON.stringify(issueData),
          status: 'pending'
        } as any
      });
    } catch (error) {
      console.error('Error logging reconciliation issue:', error);
    }
  }

  /**
   * Get reconciliation logs for admin review
   * @param filter Filter criteria
   * @param page Page number
   * @param limit Items per page
   */
  static async getReconciliationLogs(
    filter: { status?: string; type?: string },
    page = 1,
    limit = 20
  ): Promise<{
    logs: any[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;

    const [logs, total] = await Promise.all([
      prisma.reconciliationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.reconciliationLog.count({ where })
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
  static async updateReconciliationLog(
    logId: string,
    status: string,
    resolution?: string
  ): Promise<any> {
    return prisma.reconciliationLog.update({
      where: { id: logId },
      data: {
        status,
        notes: resolution,
        updatedAt: new Date()
      } as any
    });
  }

  /**
   * Schedule a reconciliation job for periodic execution
   * @param schedulePattern Cron pattern for job schedule
   */
  static scheduleReconciliationJob(schedulePattern = '0 */2 * * *'): void {
    // In a real implementation, this would use a job scheduler like node-cron
    console.log(`Payment reconciliation job scheduled with pattern: ${schedulePattern}`);

    // Example of what the scheduled job would do:
    // 1. Fetch new transactions from bank API
    // 2. For each transaction, call reconcileTransaction()
    // 3. Generate a reconciliation report
  }
}
