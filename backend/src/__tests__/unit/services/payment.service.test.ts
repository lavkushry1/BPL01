import { paymentService } from '../../../services/payment.service';
import { defaultApiClient } from '../../../services/api/apiUtils';
import {
  recordUpiPayment,
  verifyPayment,
  getActiveUpiSettings,
  updateUpiSetting
} from '../../../services/api/paymentApi';

// Mock dependencies
jest.mock('../../../services/api/apiUtils', () => ({
  defaultApiClient: {
    patch: jest.fn(),
    post: jest.fn(),
    get: jest.fn()
  }
}));

jest.mock('../../../services/api/paymentApi', () => ({
  recordUpiPayment: jest.fn(),
  verifyPayment: jest.fn(),
  getActiveUpiSettings: jest.fn(),
  updateUpiSetting: jest.fn()
}));

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      // Test data
      const paymentData = {
        booking_id: 'booking-123',
        amount: 1000,
        currency: 'INR',
        status: 'pending',
        payment_method: 'upi',
        utr_number: 'UTR123456789',
        payment_date: new Date().toISOString()
      };

      // Mock API response
      (recordUpiPayment as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        ...paymentData
      });

      // Call the service
      const result = await paymentService.createPayment(paymentData);

      // Verify the result
      expect(result).toEqual(paymentData);
      expect(recordUpiPayment).toHaveBeenCalledWith({
        bookingId: paymentData.booking_id,
        utrNumber: paymentData.utr_number,
        paymentDate: paymentData.payment_date
      });
    });

    it('should throw an error when API call fails', async () => {
      // Test data
      const paymentData = {
        booking_id: 'booking-123',
        amount: 1000,
        currency: 'INR',
        status: 'pending',
        payment_method: 'upi',
        payment_date: new Date().toISOString()
      };

      // Mock API error
      const error = new Error('API error');
      (recordUpiPayment as jest.Mock).mockRejectedValue(error);

      // Call the service and expect it to throw
      await expect(paymentService.createPayment(paymentData)).rejects.toThrow(error);
    });
  });

  describe('updateUtrNumber', () => {
    it('should update UTR number successfully', async () => {
      // Test data
      const paymentId = 'payment-123';
      const utrNumber = 'UTR987654321';
      const updatedPayment = {
        id: paymentId,
        utr_number: utrNumber,
        status: 'pending'
      };

      // Mock API response
      (defaultApiClient.patch as jest.Mock).mockResolvedValue({
        data: { payment: updatedPayment }
      });

      // Call the service
      const result = await paymentService.updateUtrNumber(paymentId, utrNumber);

      // Verify the result
      expect(result).toEqual(updatedPayment);
      expect(defaultApiClient.patch).toHaveBeenCalledWith(
        `/payments/${paymentId}/utr`,
        { utrNumber }
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify a payment successfully', async () => {
      // Test data
      const paymentId = 'payment-123';
      const adminId = 'admin-456';
      const verifiedPayment = {
        id: paymentId,
        status: 'verified',
        verified_by: adminId
      };

      // Mock API response
      (defaultApiClient.post as jest.Mock).mockResolvedValue({
        data: { payment: verifiedPayment }
      });

      // Call the service
      const result = await paymentService.verifyPayment(paymentId, adminId);

      // Verify the result
      expect(result).toEqual(verifiedPayment);
      expect(defaultApiClient.post).toHaveBeenCalledWith(
        `/payments/${paymentId}/admin-verify`,
        { adminId }
      );
    });
  });

  describe('rejectPayment', () => {
    it('should reject a payment successfully', async () => {
      // Test data
      const paymentId = 'payment-123';
      const adminId = 'admin-456';
      const rejectedPayment = {
        id: paymentId,
        status: 'rejected',
        rejected_by: adminId
      };

      // Mock API response
      (defaultApiClient.post as jest.Mock).mockResolvedValue({
        data: { payment: rejectedPayment }
      });

      // Call the service
      const result = await paymentService.rejectPayment(paymentId, adminId);

      // Verify the result
      expect(result).toEqual(rejectedPayment);
      expect(defaultApiClient.post).toHaveBeenCalledWith(
        `/payments/${paymentId}/reject`,
        { adminId }
      );
    });
  });

  describe('getPaymentByBookingId', () => {
    it('should get payment by booking ID successfully', async () => {
      // Test data
      const bookingId = 'booking-123';
      const payment = {
        id: 'payment-123',
        booking_id: bookingId,
        status: 'pending'
      };

      // Mock API response
      (defaultApiClient.get as jest.Mock).mockResolvedValue({
        data: { payment }
      });

      // Call the service
      const result = await paymentService.getPaymentByBookingId(bookingId);

      // Verify the result
      expect(result).toEqual(payment);
      expect(defaultApiClient.get).toHaveBeenCalledWith(`/payments/booking/${bookingId}`);
    });
  });

  describe('getUpiSettings', () => {
    it('should get UPI settings successfully', async () => {
      // Test data
      const upiSettings = {
        id: 'upi-settings-123',
        merchant_upi_id: 'merchant@upi',
        merchant_name: 'Test Merchant',
        is_active: true
      };

      // Mock API response
      (getActiveUpiSettings as jest.Mock).mockResolvedValue(upiSettings);

      // Call the service
      const result = await paymentService.getUpiSettings();

      // Verify the result
      expect(result).toEqual(upiSettings);
      expect(getActiveUpiSettings).toHaveBeenCalled();
    });

    it('should return null when API call fails', async () => {
      // Mock API error
      (getActiveUpiSettings as jest.Mock).mockRejectedValue(new Error('API error'));

      // Call the service
      const result = await paymentService.getUpiSettings();

      // Verify the result
      expect(result).toBeNull();
    });
  });

  describe('updateUpiSettings', () => {
    it('should update UPI settings successfully', async () => {
      // Test data
      const settingsId = 'upi-settings-123';
      const settingsData = {
        id: settingsId,
        merchant_upi_id: 'updated@upi',
        merchant_name: 'Updated Merchant'
      };
      const updatedSettings = {
        ...settingsData,
        is_active: true
      };

      // Mock API response
      (updateUpiSetting as jest.Mock).mockResolvedValue(updatedSettings);

      // Call the service
      const result = await paymentService.updateUpiSettings(settingsData);

      // Verify the result
      expect(result).toEqual(updatedSettings);
      expect(updateUpiSetting).toHaveBeenCalledWith(settingsId, settingsData);
    });

    it('should throw an error when settings ID is missing', async () => {
      // Test data without ID
      const settingsData = {
        merchant_upi_id: 'updated@upi',
        merchant_name: 'Updated Merchant'
      };

      // Call the service and expect it to throw
      await expect(paymentService.updateUpiSettings(settingsData))
        .rejects.toThrow('UPI setting ID is required for update');

      // Verify API was not called
      expect(updateUpiSetting).not.toHaveBeenCalled();
    });
  });
});