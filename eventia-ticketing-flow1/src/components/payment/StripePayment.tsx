/**
 * @component StripePayment
 * @description Handles the Stripe payment process. Displays a card payment form and
 * processes payments using Stripe Elements.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as paymentApi from '@/services/api/paymentApi';
import ErrorBoundary from '@/components/utils/ErrorBoundary';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import configService from '@/config/appConfig';
import { Spinner } from '@/components/ui/spinner';

interface StripePaymentProps {
  bookingId: string;
  amount: number;
  onPaymentSuccess?: () => void;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

// Load Stripe outside of component to avoid recreating Stripe object on renders
const stripePromise = loadStripe(configService.stripePublicKey);

const StripePayment = ({ bookingId, amount, onPaymentSuccess, customerInfo }: StripePaymentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Create a payment intent when the component mounts
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setPaymentError(null);

        const response = await paymentApi.initializeStripePayment({
          bookingId,
          amount,
          currency: 'inr'
        });

        if (response.success && response.clientSecret) {
          setClientSecret(response.clientSecret);
          setPaymentIntentId(response.paymentIntentId);
        } else {
          setPaymentError(response.message || 'Failed to initialize payment');
        }
      } catch (error) {
        console.error('Error initializing Stripe payment:', error);
        setPaymentError('Failed to initialize payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [bookingId, amount]);

  // Check payment status periodically after submission
  const checkPaymentStatus = async () => {
    try {
      if (!paymentIntentId) return;

      const response = await paymentApi.getStripePaymentStatus(paymentIntentId);

      if (response.success && response.status === 'succeeded') {
        setPaymentSuccess(true);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        } else {
          navigate(`/payment/status/${bookingId}`);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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

  if (paymentError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t('Payment Error')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{paymentError}</p>
          </div>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="w-full mt-4"
          >
            {t('Go Back')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t('Payment Successful')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 text-success">
            <CheckCircle className="h-5 w-5" />
            <p>{t('Your payment has been processed successfully.')}</p>
          </div>
          <Button 
            onClick={() => navigate(`/payment/status/${bookingId}`)} 
            className="w-full mt-4"
          >
            {t('View Booking Details')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={<div>{t('Something went wrong with the payment form.')}</div>}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t('Card Payment')}</CardTitle>
          <CardDescription>
            {t('Secure payment powered by Stripe')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                onPaymentSuccess={() => {
                  setPaymentSuccess(true);
                  if (onPaymentSuccess) {
                    onPaymentSuccess();
                  } else {
                    navigate(`/payment/status/${bookingId}`);
                  }
                }}
                onPaymentError={(error) => setPaymentError(error)}
                amount={amount}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

interface CheckoutFormProps {
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  amount: number;
}

const CheckoutForm = ({ onPaymentSuccess, onPaymentError, amount }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/status`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        onPaymentError(error.message || 'An error occurred during payment processing');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: t('Payment Successful'),
          description: t('Your payment has been processed successfully.'),
          variant: 'success',
        });
        onPaymentSuccess();
      } else {
        // Payment requires additional action or is processing
        toast({
          title: t('Payment Processing'),
          description: t('Your payment is being processed.'),
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="font-medium">
          {t('Total')}: ₹{(amount / 100).toFixed(2)}
        </div>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Spinner className="h-4 w-4" />
              {t('Processing...')}
            </>
          ) : (
            <>
              {t('Pay Now')}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default StripePayment;