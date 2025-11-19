import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PaymentMethodSelector from './PaymentMethodSelector';

// Payment flow props
interface PaymentFlowProps {
  bookingId: string;
  amount: number;
  onPaymentComplete?: (bookingId: string) => void;
  onPaymentCancel?: () => void;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({
  bookingId,
  amount,
  onPaymentComplete,
  onPaymentCancel,
  customerInfo
}) => {

  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast({
      title: t('Payment Successful'),
      description: t('Your payment has been processed successfully.'),
      variant: 'success',
    });

    if (onPaymentComplete) {
      onPaymentComplete(bookingId);
    } else {
      navigate(`/payment/status/${bookingId}`);
    }
  };

  // Handle payment cancellation
  const handleCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <Spinner className="w-8 h-8 mb-4 mx-auto" />
            <p>{t('Initializing payment...')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Payment Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <span>{t('Booking ID')}:</span>
            <span className="font-medium">{bookingId}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>{t('Amount')}:</span>
            <span className="font-medium">₹{(amount / 100).toFixed(2)}</span>
          </div>
          {customerInfo && (
            <div className="flex justify-between mb-4">
              <span>{t('Customer')}:</span>
              <span className="font-medium">{customerInfo.name}</span>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={handleCancel} className="mr-2">
              {t('Cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentMethodSelector
        bookingId={bookingId}
        amount={amount}
        onPaymentSuccess={handlePaymentSuccess}
        customerInfo={customerInfo}
      />
    </div>
  );
};

export default PaymentFlow;
