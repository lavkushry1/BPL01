/**
 * Payment API service
 * Handles operations related to payments, UTR verification, etc.
 */

import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

const apiClient = defaultApiClient;

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
    return unwrapApiResponse(response);
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
    // Construct payload matching backend expectation
    const payload = {
      event_id: bookingData.eventId,
      tickets: bookingData.tickets.map(t => ({
        categoryId: (t as any).categoryId || t.category,
        quantity: t.quantity,
        price: t.price
      })),
      amount: bookingData.totalAmount,
      payment_method: 'upi', // strictly lowercase as per previous fix
      // Guest Details
      guest_name: bookingData.customerInfo.name,
      guest_email: bookingData.customerInfo.email,
      guest_phone: bookingData.customerInfo.phone
    };

    const response = await apiClient.post('/bookings', payload);
    return unwrapApiResponse(response);
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};
