/**
 * @service PaymentApiService
 * @description Service for handling payment-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

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

// UPI Setting Types
export interface UpiSetting {
  id: string;
  upivpa: string;
  discountamount: number;
  isactive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUpiSettingInput {
  upivpa: string;
  discountamount: number;
  isactive: boolean;
}

export interface UpdateUpiSettingInput {
  upivpa?: string;
  discountamount?: number;
  isactive?: boolean;
}

export interface CreatePaymentInput {
  booking_id: string;
  amount: number;
  payment_method: any;
  currency: string;
}

export interface PaymentSettings {
  upi: {
    vpa: string;
    merchant_name: string;
    merchant_code: string;
  }
}

// Environment check for API calls
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get payment settings for UPI and other methods
 */
export const getPaymentSettings = async (): Promise<{ data: { data: PaymentSettings } }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.get('/payments/settings');
      return response;
    }
    
    // For development/testing, return mock data
    return {
      data: {
        data: {
          upi: {
            vpa: 'eventia@okicici',
            merchant_name: 'Eventia Events',
            merchant_code: 'EVENTIATICKET'
          }
        }
      }
    };
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw error;
  }
};

/**
 * Get payment by booking ID
 */
export const getPaymentByBookingId = async (bookingId: string): Promise<{ data: { data: any } }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.get(`/payments/booking/${bookingId}`);
      return response;
    }
    
    // For development/testing, return mock data
    return {
      data: {
        data: {
          id: `payment-${bookingId}`,
          booking_id: bookingId,
          amount: 1000,
          currency: 'INR',
          payment_status: 'pending',
          payment_method: {
            type: 'upi',
            upi_details: {
              vpa: 'eventia@okicici',
              utr_number: ''
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error(`Error fetching payment for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Submit UTR verification for a payment
 */
export const submitUtrVerification = async (paymentId: string, utrNumber: string): Promise<{ data: { data: any } }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.post(`/payments/${paymentId}/verify-utr`, { utr_number: utrNumber });
      return response;
    }
    
    // For development/testing, return mock data
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    return {
      data: {
        data: {
          id: paymentId,
          payment_status: 'pending_verification',
          updated_at: new Date().toISOString(),
          message: 'UTR submitted successfully and pending verification'
        }
      }
    };
  } catch (error) {
    console.error(`Error verifying UTR for payment ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Create a new payment
 */
export const createPayment = async (paymentData: CreatePaymentInput): Promise<{ data: { data: any } }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.post('/payments', paymentData);
      return response;
    }
    
    // For development/testing, return mock data
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay
    
    return {
      data: {
        data: {
          id: `payment-${Date.now()}`,
          booking_id: paymentData.booking_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_status: 'pending',
          payment_method: paymentData.payment_method,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (paymentId: string): Promise<{ data: { data: any } }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.get(`/payments/${paymentId}/status`);
      return response;
    }
    
    // For development/testing, return mock data with random status
    const statuses = ['pending', 'completed', 'pending_verification'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      data: {
        data: {
          id: paymentId,
          payment_status: randomStatus,
          updated_at: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error(`Error fetching payment status for ${paymentId}:`, error);
    throw error;
  }
};

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
    if (isProduction) {
      const response = await defaultApiClient.get('/payments/upi-settings/active');
      return response.data.upiSettings;
    }
    
    // For development/testing, return mock data
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    return {
      id: '1',
      upivpa: 'business@ybl',
      discountamount: 50,
      isactive: true,
      created_at: '2023-01-10T10:00:00',
      updated_at: '2023-01-15T14:30:00'
    };
  } catch (error) {
    console.error('Error fetching active UPI settings:', error);
    throw error;
  }
};

/**
 * Get all UPI settings
 */
export const getAllUpiSettings = async (): Promise<UpiSetting[]> => {
  try {
    if (isProduction) {
      const response = await axios.get(`${API_BASE_URL}/admin/payment-settings/upi`);
      return response.data;
    }
    
    // For development/testing, return mock data
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
    
    return [
      {
        id: '1',
        upivpa: 'business@ybl',
        discountamount: 50,
        isactive: true,
        created_at: '2023-01-10T10:00:00',
        updated_at: '2023-01-15T14:30:00'
      },
      {
        id: '2',
        upivpa: 'secondaryupi@okaxis',
        discountamount: 0,
        isactive: false,
        created_at: '2023-02-20T09:15:00',
        updated_at: '2023-02-20T09:15:00'
      },
      {
        id: '3',
        upivpa: 'promocodes@paytm',
        discountamount: 100,
        isactive: false,
        created_at: '2023-03-05T15:45:00',
        updated_at: '2023-03-10T11:20:00'
      }
    ];
  } catch (error) {
    console.error('Error fetching UPI settings:', error);
    throw error;
  }
};

export const getUpiSettingById = async (id: string): Promise<UpiSetting> => {
  try {
    if (isProduction) {
      const response = await axios.get(`${API_BASE_URL}/admin/payment-settings/upi/${id}`);
      return response.data;
    }
    
    // For development/testing, return mock data
    const settings = await getAllUpiSettings();
    const setting = settings.find(s => s.id === id);
    
    if (!setting) {
      throw new Error('UPI setting not found');
    }
    
    return setting;
  } catch (error) {
    console.error(`Error fetching UPI setting ${id}:`, error);
    throw error;
  }
};

export const createUpiSetting = async (data: CreateUpiSettingInput): Promise<UpiSetting> => {
  try {
    if (isProduction) {
      const response = await axios.post(`${API_BASE_URL}/admin/payment-settings/upi`, data);
      return response.data;
    }
    
    // For development/testing, just log the action and return mock data
    console.log('Creating UPI setting:', data);
    
    return {
      id: `new-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating UPI setting:', error);
    throw error;
  }
};

export const updateUpiSetting = async (id: string, data: UpdateUpiSettingInput): Promise<UpiSetting> => {
  try {
    if (isProduction) {
      const response = await axios.put(`${API_BASE_URL}/admin/payment-settings/upi/${id}`, data);
      return response.data;
    }
    
    // For development/testing, just log the action
    console.log(`Updating UPI setting ${id}:`, data);
    
    // Return mock updated data
    const settings = await getAllUpiSettings();
    const existingSetting = settings.find(s => s.id === id);
    
    if (!existingSetting) {
      throw new Error('UPI setting not found');
    }
    
    return {
      ...existingSetting,
      ...data,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error updating UPI setting ${id}:`, error);
    throw error;
  }
};

export const deleteUpiSetting = async (id: string): Promise<{ success: boolean }> => {
  try {
    if (isProduction) {
      await axios.delete(`${API_BASE_URL}/admin/payment-settings/upi/${id}`);
    }
    
    // For development/testing, just log the action
    console.log(`Deleting UPI setting ${id}`);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting UPI setting ${id}:`, error);
    throw error;
  }
};

/**
 * Generate UPI QR Code and Payment URL
 * @param amount - Payment amount
 * @param reference - Reference ID (booking ID)
 * @returns Object with QR code URL and UPI deep link URL
 */
export const generateUpiQrCode = async (amount: number, reference: string): Promise<{ qrUrl: string, upiUrl: string }> => {
  try {
    if (isProduction) {
      const response = await axios.post(`${API_BASE_URL}/payments/generate-upi-qr`, {
        amount,
        reference
      });
      return response.data;
    }
    
    // For development/testing, generate a UPI deep link
    const settings = await getPaymentSettings();
    const vpa = settings.data.data.upi.vpa || 'eventia@okicici';
    const merchantName = settings.data.data.upi.merchant_name || 'Eventia Tickets';
    
    // Create proper UPI intent URL according to NPCI standards
    const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tr=${reference}&cu=INR&tn=Booking%20${reference}`;
    
    // In production, this would return a real QR code image URL and UPI deep link
    return {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`,
      upiUrl: upiUrl
    };
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
    throw error;
  }
};

/**
 * Get UPI deep link for specific app
 * @param amount - Payment amount
 * @param reference - Reference ID (booking ID)
 * @param appPackage - App package name (e.g., 'com.phonepe.app')
 */
export const getUpiAppDeepLink = async (
  amount: number, 
  reference: string, 
  appPackage: string
): Promise<string> => {
  try {
    const { upiUrl } = await generateUpiQrCode(amount, reference);
    
    // Create app-specific deep links
    switch(appPackage) {
      case 'com.google.android.apps.nbu.paisa.user': // Google Pay
        return `gpay://upi/pay?pa=${encodeURIComponent('eventia@okicici')}&pn=EventiaTickets&am=${amount}&tr=${reference}&cu=INR`;
      case 'com.phonepe.app': // PhonePe
        return `phonepe://${upiUrl.substring(6)}`;
      case 'net.one97.paytm': // Paytm
        return `paytmmp://${upiUrl.substring(6)}`;
      default:
        return upiUrl;
    }
  } catch (error) {
    console.error('Error generating UPI app deep link:', error);
    throw error;
  }
};

/**
 * Create a Razorpay payment order
 */
export const createRazorpayOrder = async (
  bookingId: string, 
  amount: number
): Promise<{ orderId: string; key: string }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.post('/payments/razorpay/create-order', {
        bookingId,
        amount
      });
      return response.data;
    }
    
    // For development/testing, return mock data
    console.log(`Creating Razorpay order for booking ${bookingId} with amount ${amount}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      orderId: `order_${Date.now()}`,
      key: 'rzp_test_YOUR_KEY_ID' // This would be your actual Razorpay key in production
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyRazorpayPayment = async (
  paymentId: string, 
  orderId: string, 
  signature: string
): Promise<{ verified: boolean }> => {
  try {
    if (isProduction) {
      const response = await defaultApiClient.post('/payments/razorpay/verify', {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature
      });
      return response.data;
    }
    
    // For development/testing, return mock data
    console.log(`Verifying Razorpay payment ${paymentId} for order ${orderId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      verified: true
    };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
};

export default {
  initiatePayment,
  verifyPayment,
  recordUpiPayment,
  getActiveUpiSettings,
  getAllUpiSettings,
  getUpiSettingById,
  createUpiSetting,
  updateUpiSetting,
  deleteUpiSetting,
  generateUpiQrCode,
  getPaymentSettings,
  getPaymentByBookingId,
  submitUtrVerification,
  createPayment,
  getPaymentStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getUpiAppDeepLink
};
