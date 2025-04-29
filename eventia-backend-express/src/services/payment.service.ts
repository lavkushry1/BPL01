import { Payment, UpiSettings } from '../models/payment.model';
import { defaultApiClient } from '@/services/api/apiUtils';
import { 
  recordUpiPayment, 
  verifyPayment, 
  getActiveUpiSettings, 
  updateUpiSetting
} from '@/services/api/paymentApi';

export const paymentService = {
  /**
   * Create a new payment record
   */
  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>) {
    try {
      const response = await recordUpiPayment({
        bookingId: payment.booking_id,
        utrNumber: payment.utr_number,
        paymentDate: payment.payment_date
      });
      return payment as any; // Type conversion needed
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update UTR number for a payment
   */
  async updateUtrNumber(id: string, utrNumber: string) {
    try {
      // Use defaultApiClient directly since there's no specific function for this
      const response = await defaultApiClient.patch(`/payments/${id}/utr`, { utrNumber });
      return response.data.payment;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify a payment
   */
  async verifyPayment(id: string, adminId: string) {
    try {
      // verifyPayment API function only accepts bookingId, so we use defaultApiClient directly
      const response = await defaultApiClient.post(`/payments/${id}/admin-verify`, { adminId });
      return response.data.payment;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reject a payment
   */
  async rejectPayment(id: string, adminId: string) {
    try {
      const response = await defaultApiClient.post(`/payments/${id}/reject`, { adminId });
      return response.data.payment;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string) {
    try {
      const response = await defaultApiClient.get(`/payments/booking/${bookingId}`);
      return response.data.payment;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get UPI settings
   */
  async getUpiSettings() {
    try {
      const response = await getActiveUpiSettings();
      return response;
    } catch (error) {
      return null;
    }
  },

  /**
   * Update UPI settings
   */
  async updateUpiSettings(settings: Partial<UpiSettings>) {
    try {
      if (!settings.id) {
        throw new Error('UPI setting ID is required for update');
      }
      const response = await updateUpiSetting(settings.id, settings as any);
      return response;
    } catch (error) {
      throw error;
    }
  }
};
