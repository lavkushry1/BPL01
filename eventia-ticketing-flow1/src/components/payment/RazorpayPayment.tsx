/**
 * @component RazorpayPayment
 * @description Handles payment through Razorpay payment gateway. Initializes the Razorpay SDK,
 * creates a payment order, and handles the payment callback.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CreditCard, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/services/api/paymentApi';

// Define Razorpay interface
declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RazorpayPaymentProps {
  bookingId: string;
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentId: string, orderId: string) => void;
  onPaymentFailure: (error: any) => void;
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  bookingId,
  amount,
  customerInfo,
  onPaymentSuccess,
  onPaymentFailure
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScriptLoading, setIsScriptLoading] = useState<boolean>(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  
  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      setIsScriptLoading(true);
      
      // Check if script is already loaded
      if (window.Razorpay) {
        setIsScriptLoaded(true);
        setIsScriptLoading(false);
        return;
      }
      
      // Remove existing script if we're retrying
      const existingScript = document.getElementById('razorpay-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
      
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        setIsScriptLoading(false);
        setError(null);
      };
      
      script.onerror = () => {
        setIsScriptLoaded(false);
        setIsScriptLoading(false);
        setError(t('payment.failedToLoadRazorpay', 'Failed to load Razorpay. Please try again later.'));
      };
      
      document.body.appendChild(script);
    };
    
    loadRazorpayScript();
    
    return () => {
      // Cleanup if component unmounts during loading
      setIsRetrying(false);
    };
  }, [t, isRetrying]);
  
  // Handle retry loading the script
  const handleRetryLoading = () => {
    setIsRetrying(true);
    setError(null);
    
    // This will trigger the useEffect to reload the script
    setTimeout(() => {
      setIsRetrying(false);
    }, 100);
  };
  
  // Initialize Razorpay payment
  const initializePayment = async () => {
    if (!isScriptLoaded || !window.Razorpay) {
      setError(t('payment.razorpayNotAvailable', 'Razorpay is not available. Please try again later.'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a new order using our API
      const { orderId, key } = await createRazorpayOrder(bookingId, amount);
      
      // Configure Razorpay options
      const options = {
        key: key, // Use the key returned from backend
        amount: amount * 100, // Razorpay amount is in paisa (1/100 of INR)
        currency: 'INR',
        name: 'Eventia',
        description: `Booking #${bookingId}`,
        order_id: orderId,
        prefill: {
          name: customerInfo.name || '',
          email: customerInfo.email || '',
          contact: customerInfo.phone || ''
        },
        theme: {
          color: '#4361ee'
        },
        handler: async function (response: any) {
          try {
            // Verify payment with backend
            const { verified } = await verifyRazorpayPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            
            if (verified) {
              // Handle successful payment
              onPaymentSuccess(
                response.razorpay_payment_id,
                response.razorpay_order_id
              );
              
              toast({
                title: t('payment.paymentSuccessful', 'Payment Successful'),
                description: t('payment.processingOrder', 'Processing your order...'),
              });
            } else {
              // Verification failed
              onPaymentFailure({
                code: 'verification_failed',
                description: t('payment.verificationFailed', 'Payment verification failed. Please contact support.')
              });
              
              toast({
                title: t('payment.verificationFailed', 'Payment Verification Failed'),
                description: t('payment.contactSupport', 'Please contact customer support for assistance.'),
                variant: "destructive"
              });
            }
          } catch (error) {
            // Error during verification
            console.error('Payment verification error:', error);
            
            onPaymentFailure({
              code: 'verification_error',
              description: t('payment.verificationError', 'Error verifying payment. Please contact support.')
            });
            
            toast({
              title: t('payment.verificationError', 'Verification Error'),
              description: t('payment.contactSupport', 'Please contact customer support for assistance.'),
              variant: "destructive"
            });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast({
              title: t('payment.paymentCancelled', 'Payment Cancelled'),
              description: t('payment.youCanRetry', 'You can try again or choose a different payment method'),
            });
          },
          escape: true,
          backdropclose: false
        },
        notes: {
          booking_id: bookingId
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };
      
      try {
        // Initialize Razorpay
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function (response: any) {
          const { error } = response;
          
          onPaymentFailure(error);
          
          toast({
            title: t('payment.paymentFailed', 'Payment Failed'),
            description: error.description || t('payment.genericError', 'There was a problem processing your payment'),
            variant: "destructive"
          });
          
          setIsLoading(false);
        });
        
        // Open Razorpay payment modal
        razorpay.open();
      } catch (razorpayError) {
        console.error('Error initializing Razorpay:', razorpayError);
        setError(t('payment.razorpayInitError', 'Could not initialize payment interface. Please try again.'));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
      
      toast({
        title: t('payment.paymentInitializationFailed', 'Payment Initialization Failed'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="bg-primary/10 p-1.5 rounded-full mr-2">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-medium">{t('payment.cardPayment', 'Card/Wallet Payment')}</h3>
      </div>
      
      <div className="bg-card border rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t('payment.securePayment', 'Secure payment via Razorpay')}</h4>
            <img 
              src="data:image/png;base64,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" 
              alt="Razorpay"
              className="h-6"
            />
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{t('payment.amount', 'Amount')}:</span>
              <span className="font-semibold">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t('payment.bookingId', 'Booking ID')}:</span>
              <span className="font-mono text-sm">{bookingId}</span>
            </div>
          </div>
          
          {/* Payment methods accepted */}
          <div className="text-xs text-muted-foreground">
            <div className="mb-2 font-medium">{t('payment.acceptedMethods', 'Accepted payment methods:')}</div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-muted px-2 py-1 rounded">{t('payment.creditCard', 'Credit Card')}</span>
              <span className="bg-muted px-2 py-1 rounded">{t('payment.debitCard', 'Debit Card')}</span>
              <span className="bg-muted px-2 py-1 rounded">{t('payment.netBanking', 'Net Banking')}</span>
              <span className="bg-muted px-2 py-1 rounded">{t('payment.wallet', 'Wallet')}</span>
              <span className="bg-muted px-2 py-1 rounded">UPI</span>
            </div>
          </div>
          
          {isScriptLoading && (
            <div className="bg-muted/50 p-4 rounded-md flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <span className="ml-2 text-sm">{t('payment.loadingPaymentInterface', 'Loading payment interface...')}</span>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t('payment.error', 'Error')}</p>
                <p className="text-sm mt-1">{error}</p>
                {!isScriptLoaded && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8"
                    onClick={handleRetryLoading}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    {t('payment.retry', 'Retry')}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <Button 
            className="w-full"
            onClick={initializePayment}
            disabled={isLoading || !isScriptLoaded || !!error}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                {t('payment.processing', 'Processing...')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{t('payment.payNow', 'Pay Now')}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground flex items-center justify-center mt-1">
            <CheckCircle className="h-3 w-3 mr-1.5 text-green-500" />
            <span>{t('payment.secureTransaction', 'Secure transaction via Razorpay')}</span>
          </div>
        </div>
      </div>
      
      {/* Security Notice */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">{t('payment.securityInfo', 'Security Information')}</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t('payment.securityNote1', 'All card information is securely encrypted')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t('payment.securityNote2', 'We do not store your payment details')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RazorpayPayment; 