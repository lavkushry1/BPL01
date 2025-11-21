/**
 * @service PaymentApiService
 * @description Service for handling payment-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

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

export interface StripePaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
}

export interface PaymentSettings {
  upi: {
    vpa: string;
    merchant_name: string;
    merchant_code: string;
  }
}

export interface PaymentSessionResponse {
  sessionId: string;
  referenceId: string;
  amount: number;
  upiId: string;
  qrCode: string;
  upiLink: string;
  expiresAt: string;
}

export interface PaymentSession {
  id: string;
  userId: string;
  eventId: string;
  amount: number;
  status: string;
  referenceId: string;
  upiId: string;
  utrNumber?: string;
  qrCodeUrl?: string;
  upiDeeplink?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  seats: any[];
}

// Environment check for API calls
const isProduction = import.meta.env.MODE === 'production';

/**
 * Initialize a Stripe payment
 */
export const initializeStripePayment = async (data: StripePaymentRequest) => {
  try {
    const response = await defaultApiClient.post('/stripe/payment', data);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error initializing Stripe payment:', error);
    return {
      success: false,
      message: 'Failed to initialize Stripe payment'
    };
  }
};

/**
 * Get Stripe payment status
 */
export const getStripePaymentStatus = async (paymentIntentId: string) => {
  try {
    const response = await defaultApiClient.get(`/stripe/payment/${paymentIntentId}`);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error getting Stripe payment status:', error);
    return {
      success: false,
      message: 'Failed to get payment status'
    };
  }
};

/**
 * Get payment settings for UPI and other methods
 */
export const getPaymentSettings = async () => {
  try {
    // First attempt to use the public endpoint that doesn't require authentication
    console.log('Attempting to fetch UPI settings from public endpoint');
    const response = await defaultApiClient.get<any>('/payments/upi-settings');
    console.log('UPI settings response from public endpoint:', response.data);

    // Return normalized data
    return {
      data: {
        upivpa: response.data?.upivpa || '9122036484@hdfc', // Use the required UPI ID as fallback
        discountamount: response.data?.discountamount || 0,
        isactive: response.data?.isactive !== undefined ? response.data.isactive : true
      }
    };
  } catch (error) {
    console.error('Error fetching UPI settings from public endpoint:', error);

    // Try protected endpoint as fallback
    try {
      console.log('Attempting to fetch UPI settings from fallback endpoint');
      const fallbackResponse = await defaultApiClient.get<any>('/admin/upi-settings/active');
      console.log('UPI settings response from fallback endpoint:', fallbackResponse.data);

      // Access data safely with optional chaining
      const fallbackData = fallbackResponse.data;

      return {
        data: {
          upivpa: fallbackData?.data?.upivpa || fallbackData?.upivpa ||
            fallbackData?.data?.upi?.vpa || fallbackData?.upi?.vpa || '9122036484@hdfc', // Use the required UPI ID as fallback
          discountamount: fallbackData?.data?.discountamount || fallbackData?.discountamount || 0,
          isactive: (fallbackData?.data?.isactive !== undefined) ?
            fallbackData.data.isactive :
            (fallbackData?.isactive !== undefined ? fallbackData.isactive : true)
        }
      };
    } catch (fallbackError) {
      console.error('Error fetching UPI settings from fallback endpoint:', fallbackError);

      // Return a structured fallback response that matches the expected format
      console.log('Using default UPI settings as fallback');
      return {
        data: {
          upivpa: '9122036484@hdfc', // Use the required UPI ID as fallback
          discountamount: 0,
          isactive: true
        }
      };
    }
  }
};

/**
 * Get payment by booking ID
 */
export const getPaymentByBookingId = (bookingId: string) => {
  return defaultApiClient.get<any>(`/payments/booking/${bookingId}`);
};

/**
 * Submit UTR verification for a payment
 */
export const submitUtrVerification = (paymentId: string, utrNumber: string) => {
  return defaultApiClient.post<any>('/payments/verify-utr', {
    payment_id: paymentId,
    utr_number: utrNumber
  });
};

/**
 * Create a new payment
 */
export const createPayment = async (paymentData: CreatePaymentInput): Promise<{ data: { data: any } }> => {
  return defaultApiClient.post<any>('/payments', paymentData);
};

/**
 * Get payment status
 */
export const getPaymentStatus = (intentId: string) => {
  return defaultApiClient.get<any>(`/payments/status/${intentId}`);
};

/**
 * Initialize payment and lock seats
 * @param data Payment initialization data
 */
export const initiatePayment = (data: {
  eventId: string;
  seatIds: string[];
  userId: string;
}) => {
  return defaultApiClient.post<any>('/payments/initiate', data);
};

/**
 * Verify payment status
 */
export const verifyPayment = async (bookingId: string): Promise<{ success: boolean; status: string; message: string }> => {
  try {
    const response = await defaultApiClient.post(`/payments/verify/${bookingId}`);
    return {
      success: true,
      status: response.data.status,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to verify payment'
    };
  }
};

/**
 * Record UPI payment for booking
 */
export const recordUpiPayment = async (paymentData: UpiPaymentRequest): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.post('/payments/upi', paymentData);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record payment'
    };
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
    // First attempt to use the dedicated public endpoint that doesn't require authentication
    console.log('Fetching UPI settings from public endpoint');
    const response = await defaultApiClient.get('/payments/upi-settings');

    if (response.data) {
      console.log('Successfully fetched UPI settings from public endpoint');
      return unwrapApiResponse(response);
    }
    throw new Error('Invalid response format from public endpoint');
  } catch (error) {
    console.error('Error fetching UPI settings from public endpoint:', error);

    // If authentication error (401) or other error, try the admin endpoint
    try {
      console.log('Attempting to fetch UPI settings from admin endpoint');
      const fallbackResponse = await defaultApiClient.get('/admin/upi-settings/active');

      if (fallbackResponse.data) {
        console.log('Successfully fetched UPI settings from admin endpoint');
        return fallbackResponse.data;
      }
      throw new Error('Invalid response format from admin endpoint');
    } catch (fallbackError) {
      console.error('Error fetching UPI settings from admin endpoint:', fallbackError);

      // Return a default UPI setting as last resort
      console.log('Using default UPI setting as fallback');
      return {
        id: 'default',
        upivpa: '9122036484@hdfc', // Using the required UPI ID as fallback
        discountamount: 0,
        isactive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }
};

/**
 * Get all UPI settings
 */
export const getAllUpiSettings = async (): Promise<UpiSetting[]> => {
  try {
    const response = await defaultApiClient.get('/admin/upi-settings');
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error fetching all UPI settings:', error);
    throw error;
  }
};

export const getUpiSettingById = async (id: string): Promise<UpiSetting> => {
  try {
    const response = await defaultApiClient.get(`/admin/upi-settings/${id}`);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error(`Error fetching UPI setting ${id}:`, error);
    throw error;
  }
};

export const createUpiSetting = async (data: CreateUpiSettingInput): Promise<UpiSetting> => {
  try {
    const response = await defaultApiClient.post('/admin/upi-settings', data);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error creating UPI setting:', error);
    throw error;
  }
};

export const updateUpiSetting = async (id: string, data: UpdateUpiSettingInput): Promise<UpiSetting> => {
  try {
    const response = await defaultApiClient.put(`/admin/upi-settings/${id}`, data);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error(`Error updating UPI setting ${id}:`, error);
    throw error;
  }
};

export const deleteUpiSetting = async (id: string): Promise<{ success: boolean }> => {
  try {
    await defaultApiClient.delete(`/admin/upi-settings/${id}`);
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
    // First try to get UPI settings
    let upiId;
    let attempts = 0;
    const maxAttempts = 3;

    try {
      attempts++;
      console.log(`Attempt ${attempts}: Fetching UPI settings...`);
      const upiSettings = await getActiveUpiSettings();

      if (upiSettings && upiSettings.upivpa) {
        upiId = upiSettings.upivpa;
        console.log(`Successfully fetched UPI ID: ${upiId}`);
      } else {
        throw new Error('Invalid UPI settings format');
      }
    } catch (error) {
      console.warn('Could not fetch UPI settings:', error);
      // Use the required UPI ID as fallback
      upiId = '9122036484@hdfc';
      console.log(`Using fallback UPI ID: ${upiId}`);
    }

    // Format: upi://pay?pa=[UPI_ID]&pn=[NAME]&am=[AMOUNT]&cu=[CURRENCY]&tn=[NOTE]
    const upiUrl = `upi://pay?pa=${upiId}&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;
    console.log(`Generated UPI URL: ${upiUrl}`);

    // Try multiple methods to generate QR code
    let qrUrl = '';

    // Method 1: Try backend API
    try {
      attempts++;
      console.log(`Attempt ${attempts}: Using backend API for QR generation...`);
      const response = await defaultApiClient.post('/payments/generate-qr', {
        data: upiUrl
      }, {
        timeout: 5000 // 5-second timeout to prevent long waits
      });

      // If we successfully got a QR code URL from the backend
      if (response.data?.data?.qrCodeUrl) {
        qrUrl = unwrapApiResponse(response).qrCodeUrl;
        console.log(`Successfully generated QR from backend API: ${qrUrl.substring(0, 50)}...`);
        return { qrUrl, upiUrl };
      }
    } catch (error) {
      console.warn('Backend QR generation failed:', error);
    }

    // Method 2: Try public API
    try {
      attempts++;
      console.log(`Attempt ${attempts}: Using public QR service...`);
      // Create QR code with a public service
      const encodedUpiUrl = encodeURIComponent(upiUrl);
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUpiUrl}`;

      // Immediately return the URL without trying to validate it in offline mode
      console.log(`Generated QR code URL: ${qrUrl}`);
      return { qrUrl, upiUrl };
    } catch (error) {
      console.warn('Public QR service failed:', error);
    }

    // Final fallback
    const encodedUpiUrl = encodeURIComponent(upiUrl);
    qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodedUpiUrl}`;
    console.log(`Using final fallback QR URL: ${qrUrl}`);
    return { qrUrl, upiUrl };
  } catch (error) {
    console.error('Error generating UPI QR code:', error);

    // Final fallback - generate a basic UPI URL and QR code even if everything else fails
    const fallbackUpiId = '9122036484@hdfc'; // Using the required UPI ID as ultimate fallback
    const fallbackUpiUrl = `upi://pay?pa=${fallbackUpiId}&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;
    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackUpiUrl)}`;

    return {
      qrUrl: fallbackQrUrl,
      upiUrl: fallbackUpiUrl
    };
  }
};

/**
 * Get UPI deep link for specific app
 * @param amount - Payment amount
 * @param reference - Reference ID (booking ID)
 * @param appPackage - App package name (e.g., 'com.phonepe.app')
 */
export const getUpiAppDeepLink = async (amount: number, reference: string, appPackage: string): Promise<string> => {
  try {
    const response = await getPaymentSettings();
    let upiId = 'eventia@okicici'; // Default fallback

    if (response.data && response.data.upivpa) {
      upiId = response.data.upivpa;
    }

    // Format base UPI URL
    const baseUpiUrl = `upi://pay?pa=${upiId}&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;

    // Add app package for specific app deep linking
    if (appPackage) {
      return `${baseUpiUrl}&ap=${appPackage}`;
    }

    return baseUpiUrl;
  } catch (error) {
    // Use fallback UPI ID if there's an error
    const fallbackUrl = `upi://pay?pa=eventia@okicici&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;
    return appPackage ? `${fallbackUrl}&ap=${appPackage}` : fallbackUrl;
  }
};

/**
 * Initiates a UPI payment session
 * @param data Payment initiation data
 * @returns Payment session details
 */
export const initiateUpiPayment = async (data: {
  eventId: string;
  seatIds: string[];
  userId: string;
  amount?: number;
}): Promise<PaymentSessionResponse> => {
  const response = await defaultApiClient.post<any>('/upi-payments/initiate', data);
  return unwrapApiResponse(response);
};

/**
 * Gets the status of a UPI payment session
 * @param sessionId Payment session ID
 * @returns Payment session details
 */
export const getUpiPaymentStatus = async (sessionId: string): Promise<PaymentSession> => {
  const response = await defaultApiClient.get<any>(`/upi-payments/status/${sessionId}`);
  return unwrapApiResponse(response);
};

/**
 * Confirms a UPI payment with UTR number
 * @param sessionId Payment session ID
 * @param utrNumber UTR number
 * @returns Confirmation result
 */
export const confirmUpiPayment = async (sessionId: string, utrNumber: string): Promise<any> => {
  try {
    const response = await defaultApiClient.post(`/upi-payments/confirm`, {
      sessionId,
      utrNumber
    });
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error confirming UPI payment:', error);
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
  initiateUpiPayment,
  getUpiPaymentStatus,
  confirmUpiPayment,
  getUpiAppDeepLink
};
