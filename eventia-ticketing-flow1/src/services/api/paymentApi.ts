/**
 * @service PaymentApiService
 * @description Service for handling payment-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';

export interface UpiPaymentRequest {
  bookingId: string;
  utrNumber?: string;
  paymentDate?: string;
}

export interface UpiSettings {
  id: string;
  upivpa: string;
  discountamount: number;
  isactive: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Initiate a payment for a booking
 */
export const initiatePayment = async (bookingId: string): Promise<{ success: boolean; message: string; redirectUrl?: string }> => {
  try {
    const response = await defaultApiClient.post(`/payments/${bookingId}/initiate`);
    return response.data;
  } catch (error) {
    console.error(`Error initiating payment for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Verify payment status
 */
export const verifyPayment = async (bookingId: string): Promise<{ success: boolean; status: string; message: string }> => {
  try {
    const response = await defaultApiClient.get(`/payments/${bookingId}/verify`);
    return response.data;
  } catch (error) {
    console.error(`Error verifying payment for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Record UPI payment for booking
 */
export const recordUpiPayment = async (paymentData: UpiPaymentRequest): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate UTR number format
    if (paymentData.utrNumber && !isValidUTRFormat(paymentData.utrNumber)) {
      throw new Error('Invalid UTR number format. Please check and try again.');
    }
    
    // Add request timestamp
    const requestData = {
      ...paymentData,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      requestTimestamp: new Date().toISOString()
    };
    
    // Set timeout for payment requests to handle slow networks
    const response = await defaultApiClient.post('/payments/upi', requestData, {
      timeout: 10000 // 10 seconds timeout
    });
    
    return response.data;
  } catch (error: any) {
    // Handle specific API errors
    if (error.response?.data?.message) {
      console.error(`Payment error: ${error.response.data.message}`);
      throw new Error(error.response.data.message);
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Payment request timed out');
      throw new Error('Payment request timed out. Please try again.');
    }
    
    if (!navigator.onLine) {
      console.error('No internet connection');
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    console.error(`Error recording UPI payment for booking ${paymentData.bookingId}:`, error);
    throw error;
  }
};

/**
 * Helper function to validate UTR number format
 * UTR is typically 12-22 alphanumeric characters
 */
const isValidUTRFormat = (utr: string): boolean => {
  // Basic validation - can be enhanced based on specific UPI provider requirements
  const utrRegex = /^[A-Za-z0-9]{12,22}$/;
  return utrRegex.test(utr);
};

/**
 * Get active UPI settings
 */
export const getActiveUpiSettings = async (): Promise<UpiSettings> => {
  try {
    const response = await defaultApiClient.get('/payments/upi-settings/active');
    return response.data.upiSettings;
  } catch (error) {
    console.error('Error fetching active UPI settings:', error);
    throw error;
  }
};

/**
 * Get all UPI settings
 */
export const getAllUpiSettings = async (): Promise<UpiSettings[]> => {
  try {
    const response = await defaultApiClient.get('/payments/upi-settings');
    return response.data.upiSettings;
  } catch (error) {
    console.error('Error fetching all UPI settings:', error);
    throw error;
  }
};

/**
 * Create a new UPI setting
 */
export const createUpiSetting = async (upiData: { upivpa: string; discountamount: number; isactive: boolean }): Promise<UpiSettings> => {
  try {
    const response = await defaultApiClient.post('/payments/upi-settings', upiData);
    return response.data.upiSetting;
  } catch (error) {
    console.error('Error creating UPI setting:', error);
    throw error;
  }
};

/**
 * Update a UPI setting
 */
export const updateUpiSetting = async (id: string, upiData: Partial<UpiSettings>): Promise<UpiSettings> => {
  try {
    const response = await defaultApiClient.patch(`/payments/upi-settings/${id}`, upiData);
    return response.data.upiSetting;
  } catch (error) {
    console.error(`Error updating UPI setting ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a UPI setting
 */
export const deleteUpiSetting = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.delete(`/payments/upi-settings/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting UPI setting ${id}:`, error);
    throw error;
  }
};

export default {
  initiatePayment,
  verifyPayment,
  recordUpiPayment,
  getActiveUpiSettings,
  getAllUpiSettings,
  createUpiSetting,
  updateUpiSetting,
  deleteUpiSetting
};
