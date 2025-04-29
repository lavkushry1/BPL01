import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api/client';

type PaymentStatus = 'INITIATED' | 'PENDING' | 'COMPLETED' | 'VERIFIED' | 'FAILED' | 'REJECTED' | null;

export function usePaymentStatus(bookingId: string, pollInterval = 5000) {
  const [status, setStatus] = useState<PaymentStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!bookingId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/bookings/${bookingId}/payment-status`);
      const paymentStatus = response.data.status as PaymentStatus;
      
      setStatus(paymentStatus);
      
      // Stop polling if payment is in a final state
      if (['COMPLETED', 'VERIFIED', 'FAILED', 'REJECTED'].includes(paymentStatus)) {
        setShouldPoll(false);
      }
    } catch (err) {
      setError('Failed to fetch payment status. Please try again.');
      console.error('Payment status check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const resetStatus = useCallback(() => {
    setStatus(null);
    setError(null);
    setShouldPoll(true);
  }, []);

  // Initial status check
  useEffect(() => {
    if (bookingId) {
      checkStatus();
    }
  }, [bookingId, checkStatus]);

  // Set up polling
  useEffect(() => {
    if (!shouldPoll || !bookingId) return;
    
    const intervalId = setInterval(() => {
      checkStatus();
    }, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [shouldPoll, bookingId, checkStatus, pollInterval]);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    resetStatus
  };
} 