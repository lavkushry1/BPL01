/**
 * Payment API service
 * Handles operations related to payments, UTR verification, etc.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create a configured axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interface for payment data
 */
export interface PaymentData {
  utrNumber: string;
  amount: number;
  bookingId?: string;
}

/**
 * Interface for booking data
 */
export interface BookingData {
  eventId: string;
  eventTitle: string;
  tickets: {
    category: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  totalAmount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  paymentInfo?: {
    utrNumber: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
}

/**
 * Verify a UTR payment
 * @param paymentData - The payment data including UTR number
 * @returns Verification result
 */
export const verifyUtrPayment = async (paymentData: PaymentData): Promise<{
  verified: boolean;
  message: string;
  transactionId?: string;
}> => {
  try {
    const response = await apiClient.post('/payments/verify-utr', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying UTR payment:', error);
    throw new Error('Failed to verify payment');
  }
};

/**
 * Create a new booking with payment information
 * @param bookingData - The booking data
 * @returns The created booking
 */
export const createBooking = async (bookingData: BookingData): Promise<{
  success: boolean;
  bookingId?: string;
  message: string;
}> => {
  try {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};
