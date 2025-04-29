import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/use-payment-status';
import { PaymentStatusIndicator } from './PaymentStatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentStatusPageProps {
  bookingId: string;
  onComplete?: (status: string) => void;
  returnUrl?: string;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  bookingId,
  onComplete,
  returnUrl = '/bookings'
}) => {
  const navigate = useNavigate();
  const { 
    status, 
    isLoading, 
    error, 
    checkStatus, 
    resetStatus 
  } = usePaymentStatus(bookingId);
  
  useEffect(() => {
    // Notify parent component when payment is complete
    if (status === 'COMPLETED' || status === 'VERIFIED') {
      onComplete?.(status);
    }
  }, [status, onComplete]);

  const handleRetry = () => {
    checkStatus();
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'COMPLETED':
      case 'VERIFIED':
        return {
          title: 'Payment Successful',
          description: 'Your payment has been successfully processed. You can view your ticket details in your bookings.',
          action: 'View My Bookings'
        };
      case 'FAILED':
        return {
          title: 'Payment Failed',
          description: 'We couldn\'t process your payment. Please try again or use a different payment method.',
          action: 'Try Again'
        };
      case 'REJECTED':
        return {
          title: 'Payment Rejected',
          description: 'Your payment was rejected. This might be due to insufficient funds or bank restrictions.',
          action: 'Try Again'
        };
      case 'INITIATED':
        return {
          title: 'Payment in Progress',
          description: 'Your payment is being processed. This might take a moment. Please do not close this page.',
          action: 'Check Status'
        };
      case 'PENDING':
      default:
        return {
          title: 'Payment Pending',
          description: 'Please complete your payment using the UPI app. We\'re waiting for confirmation from your bank.',
          action: 'Check Status'
        };
    }
  };

  const { title, description, action } = getStatusMessage();

  const handleAction = () => {
    if (status === 'COMPLETED' || status === 'VERIFIED') {
      navigate(returnUrl);
    } else if (status === 'FAILED' || status === 'REJECTED') {
      resetStatus();
      navigate(-1);
    } else {
      checkStatus();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentStatusIndicator 
          status={status} 
          isLoading={isLoading} 
          onRetry={handleRetry}
        />
        
        <p className="text-gray-600">{description}</p>
        
        {error && (
          <div className="text-sm text-red-600 mt-2">
            Error: {error}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAction}
          className="w-full"
        >
          {action}
        </Button>
      </CardFooter>
    </Card>
  );
}; 