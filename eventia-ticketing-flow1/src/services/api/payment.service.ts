/**
 * Payment API service
 * Handles operations related to payments, UTR verification, etc.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
    // In a production app, you would make an API call like:
    // const response = await axios.post(`${API_URL}/payments/verify-utr`, paymentData);
    // return response.data;
    
    // For now, we'll simulate verification with mock data
    console.log('Verifying UTR payment:', paymentData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation - in real app this would check against actual payment records
    if (!paymentData.utrNumber || paymentData.utrNumber.length < 8) {
      return {
        verified: false,
        message: 'Invalid UTR number. Please check and try again.'
      };
    }
    
    // Mock successful verification
    return {
      verified: true,
      message: 'Payment verified successfully',
      transactionId: `tx-${Date.now()}`
    };
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
    // In a production app, you would make an API call like:
    // const response = await axios.post(`${API_URL}/bookings`, bookingData);
    // return response.data;
    
    // For now, we'll return mock data
    console.log('Creating booking with payment:', bookingData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a booking ID
    const bookingId = `BK${Date.now().toString().slice(-8)}`;
    
    return {
      success: true,
      bookingId,
      message: 'Booking created successfully'
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};
