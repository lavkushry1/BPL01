import { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface PaymentResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  paymentStatus?: string;
  qrCodeUrl?: string;
  upiLink?: string;
}

export function usePaymentService() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a UPI QR code for payment
   */
  const generateUpiQrCode = async (bookingId: string, amount: number): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(API_ENDPOINTS.GENERATE_UPI_QR, {
        bookingId,
        amount
      });
      
      return {
        success: true,
        qrCodeUrl: response.data.qrCodeUrl,
        upiLink: response.data.upiLink
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate UPI QR code';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit UTR number for payment verification
   */
  const submitUtrNumber = async (bookingId: string, utrNumber: string): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(API_ENDPOINTS.SUBMIT_UTR, {
        bookingId,
        utrNumber
      });
      
      return {
        success: true,
        transactionId: response.data.transactionId,
        paymentStatus: response.data.status
      };
    } catch (err) {
      let errorMessage;
      
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific API error responses
        errorMessage = err.response.data.message || 'Failed to submit UTR number';
      } else {
        errorMessage = err instanceof Error ? err.message : 'Failed to submit UTR number';
      }
      
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check payment status
   */
  const checkPaymentStatus = async (bookingId: string): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.CHECK_PAYMENT_STATUS}/${bookingId}`);
      
      return {
        success: true,
        paymentStatus: response.data.status,
        message: response.data.message
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get deep links for UPI apps
   */
  const getUpiDeepLinks = (upiId: string, amount: number, bookingId: string, description: string) => {
    const encodedDesc = encodeURIComponent(description);
    const encodedUpiId = encodeURIComponent(upiId);
    
    return {
      upiUrl: `upi://pay?pa=${encodedUpiId}&pn=Eventia&am=${amount}&tr=${bookingId}&tn=${encodedDesc}`,
      gpayUrl: `gpay://upi/pay?pa=${encodedUpiId}&pn=Eventia&am=${amount}&tr=${bookingId}&tn=${encodedDesc}`,
      phonepeUrl: `phonepe://pay?pa=${encodedUpiId}&pn=Eventia&am=${amount}&tr=${bookingId}&tn=${encodedDesc}`,
      paytmUrl: `paytmmp://pay?pa=${encodedUpiId}&pn=Eventia&am=${amount}&tr=${bookingId}&tn=${encodedDesc}`
    };
  };

  /**
   * Detect if UPI app is installed
   */
  const detectUpiApp = async () => {
    if (!navigator.userAgent.includes('Android') && !navigator.userAgent.includes('iPhone')) {
      return null; // Not a mobile device
    }
    
    // Different approach is needed for iOS vs Android
    // This is a simplified implementation
    const isAndroid = navigator.userAgent.includes('Android');
    
    if (isAndroid) {
      // Try detecting common UPI apps on Android
      const apps = [
        { name: 'Google Pay', scheme: 'gpay://' },
        { name: 'PhonePe', scheme: 'phonepe://' },
        { name: 'Paytm', scheme: 'paytmmp://' },
        { name: 'BHIM', scheme: 'bhim://' }
      ];
      
      // This is a simplistic approach - in a real app, you would need a more
      // sophisticated detection method like intent filters
      return 'upi://'; // Fallback to generic UPI
    } else {
      // iOS doesn't support reliable app detection
      return 'upi://';
    }
  };

  return {
    isLoading,
    error,
    generateUpiQrCode,
    submitUtrNumber,
    checkPaymentStatus,
    getUpiDeepLinks,
    detectUpiApp
  };
} 