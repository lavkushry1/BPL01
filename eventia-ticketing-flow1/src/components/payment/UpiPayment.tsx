/**
 * @component UpiPayment
 * @description Handles the UPI payment process. Displays a QR code for payment and 
 * collects the UTR number for transaction verification.
 * 
 * Uses the centralized configuration service for API endpoints.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Clock, AlertTriangle, CheckCircle, QrCode, Copy, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCodeGenerator from './QRCodeGenerator';
import * as paymentApi from '@/services/api/paymentApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import configService from '@/config/appConfig';

interface UpiPaymentProps {
  bookingId: string;
  amount: number;
  onUtrSubmit: (utr: string) => void;
}

interface UpiDetails {
  vpa: string;
  utr_number: string;
}

interface PaymentMethod {
  type: string;
  upi_details?: UpiDetails;
}

const UpiPayment = ({ bookingId, amount, onUtrSubmit }: UpiPaymentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [upiId, setUpiId] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(600); // 10 minutes in seconds
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [qrLoadError, setQrLoadError] = useState<boolean>(false);
  const [utrTouched, setUtrTouched] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpiSettings = async () => {
      try {
        setIsLoading(true);
        setQrLoadError(false);
        
        const response = await paymentApi.getPaymentSettings();
        
        if (response.data?.data?.upi?.vpa) {
          setUpiId(response.data.data.upi.vpa);
        } else {
          // Using hardcoded fallback UPI ID
          setUpiId('eventia@okicici');
          console.info('Using fallback UPI ID as no settings found');
        }
      } catch (error) {
        console.error('Error fetching UPI settings:', error);
        setQrLoadError(true);
        // Using hardcoded fallback UPI ID
        setUpiId('eventia@okicici');
        toast({
          title: t('payment.errorFetchingUpi', 'Error fetching UPI details'),
          description: t('payment.usingFallback', 'Using fallback UPI ID'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Check if payment already exists for this booking
    const checkExistingPayment = async () => {
      try {
        const response = await paymentApi.getPaymentByBookingId(bookingId);
        
        // If payment exists and has UTR number, pre-fill it
        if (response.data?.data?.payment_method?.upi_details?.utr_number) {
          setUtrNumber(response.data.data.payment_method.upi_details.utr_number);
          setPaymentId(response.data.data.id);
          
          toast({
            title: t('payment.existingUtrFound', 'Existing UTR found'),
            description: t('payment.utrPrefilled', 'Your previous UTR number has been filled'),
          });
        }
      } catch (error) {
        // Silently fail - it's okay if there's no existing payment
        console.log('No existing payment found:', error);
      }
    };

    fetchUpiSettings();
    if (bookingId) checkExistingPayment();
    
    // Cleanup timer on unmount
    return () => {
      // Cleanup function
    };
  }, [bookingId, t]);

  useEffect(() => {
    if (remainingTime <= 0) {
      toast({
        title: t('payment.timeExpired', 'Payment time expired'),
        description: t('payment.refreshPage', 'Please refresh the page to try again'),
        variant: "destructive",
      });
      return;
    }
    
    const timer = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime, t]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate UTR number format - it should be 12 alphanumeric characters for most banks
  const validateUtrNumber = (utr: string): boolean => {
    // UTR is generally 12-22 characters, mostly numeric but some banks may include letters
    const utrPattern = /^[A-Za-z0-9]{6,22}$/;
    return utrPattern.test(utr);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUtrNumber(value);
    
    if (utrTouched) {
      if (!value.trim()) {
        setUtrError(t('payment.utrRequired', 'UTR number is required'));
      } else if (!validateUtrNumber(value)) {
        setUtrError(t('payment.invalidUtr', 'Please enter a valid UTR number (6-22 alphanumeric characters)'));
      } else {
        setUtrError(null);
      }
    }
  };
  
  const handleUtrBlur = () => {
    setUtrTouched(true);
    
    if (!utrNumber.trim()) {
      setUtrError(t('payment.utrRequired', 'UTR number is required'));
    } else if (!validateUtrNumber(utrNumber)) {
      setUtrError(t('payment.invalidUtr', 'Please enter a valid UTR number (6-22 alphanumeric characters)'));
    } else {
      setUtrError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    
    if (!utrNumber.trim()) {
      setUtrError(t('payment.utrRequired', 'UTR number is required'));
      return;
    }
    
    if (!validateUtrNumber(utrNumber)) {
      setUtrError(t('payment.invalidUtr', 'Please enter a valid UTR number (6-22 alphanumeric characters)'));
      return;
    }
    
    setSubmitting(true);
    
    try {
      let response;
      
      // If we already have a payment ID, update the UTR number
      if (paymentId) {
        response = await paymentApi.submitUtrVerification(paymentId, utrNumber);
      } else {
        // Otherwise create a new payment
        const paymentMethod: PaymentMethod = {
          type: 'upi',
          upi_details: {
            vpa: upiId,
            utr_number: utrNumber
          }
        };
        
        response = await paymentApi.createPayment({
          booking_id: bookingId,
          amount,
          payment_method: paymentMethod,
          currency: 'INR'
        });
        
        setPaymentId(response.data.data.id);
      }
      
      // Poll for payment status to check if verification is complete
      const checkPaymentStatus = async () => {
        if (!paymentId) return;
        
        try {
          const statusResponse = await paymentApi.getPaymentStatus(paymentId);
          const status = statusResponse.data.data.payment_status;
          
          if (status === 'completed') {
            toast({
              title: t('payment.verificationSuccess', 'Payment verified'),
              description: t('payment.bookingConfirmed', 'Your booking has been confirmed'),
              variant: "default",
            });
            onUtrSubmit(utrNumber);
          } else if (status === 'failed' || status === 'rejected') {
            setPaymentError(t('payment.verificationFailed', 'Payment verification failed. Please check your UTR number and try again.'));
            setSubmitting(false);
          } else {
            // For pending status, let the user proceed, admin will verify later
            toast({
              title: t('payment.utrSubmitted', 'UTR submitted successfully'),
              description: t('payment.pendingVerification', 'Your payment is under verification'),
              variant: "default",
            });
            onUtrSubmit(utrNumber);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // If status check fails, still let the user proceed
          onUtrSubmit(utrNumber);
        }
      };
      
      // Check status after submission
      await checkPaymentStatus();
      
    } catch (error) {
      console.error('Error submitting UTR number:', error);
      setPaymentError(t('payment.errorSubmittingUtr', 'There was an error submitting your UTR number. Please try again.'));
      setSubmitting(false);
    }
  };

  const refreshQrCode = () => {
    setQrLoadError(false);
    
    const fetchUpiSettings = async () => {
      try {
        setIsLoading(true);
        
        const response = await paymentApi.getPaymentSettings();
        
        if (response.data?.data?.upi?.vpa) {
          setUpiId(response.data.data.upi.vpa);
        } else {
          setUpiId('eventia@okicici');
        }
        
        setQrLoadError(false);
      } catch (error) {
        console.error('Error refreshing UPI settings:', error);
        setQrLoadError(true);
        setUpiId('eventia@okicici');
        
        toast({
          title: t('payment.errorRefreshingUpi', 'Error refreshing UPI details'),
          description: t('payment.usingFallback', 'Using fallback UPI ID'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUpiSettings();
  };
  
  const copyUpiId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId)
        .then(() => {
          toast({
            title: t('payment.copied', 'Copied to clipboard'),
            variant: "default",
          });
        })
        .catch(err => console.error('Could not copy text: ', err));
    }
  };
  
  const getUpiPaymentUrl = () => {
    return `upi://pay?pa=${upiId}&pn=Eventia&am=${amount.toFixed(2)}&cu=INR&tn=Event%20Ticket%20Booking%20${bookingId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t('payment.upiPayment', 'UPI Payment')}</span>
          <span className="text-sm font-normal flex items-center text-orange-500">
            <Clock className="h-4 w-4 mr-1" />
            {formatTime(remainingTime)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{paymentError}</p>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center">
              {isLoading ? (
                <div className="bg-gray-100 rounded-lg h-48 w-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : qrLoadError ? (
                <div className="bg-gray-100 rounded-lg h-48 w-48 flex flex-col items-center justify-center p-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">{t('payment.qrError', 'Error loading QR code')}</p>
                  <Button variant="outline" size="sm" onClick={refreshQrCode}>
                    {t('payment.retry', 'Retry')}
                  </Button>
                </div>
              ) : (
                <QRCodeGenerator 
                  value={getUpiPaymentUrl()} 
                  size={200} 
                  className="border p-2 rounded-lg shadow-sm"
                />
              )}
            </div>
            
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-2">
                <p className="font-medium">{t('payment.upiId', 'UPI ID')}:</p>
                <p className="text-primary">{upiId}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={copyUpiId} className="h-6 w-6">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('payment.copyUpi', 'Copy UPI ID')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <p className="text-sm text-gray-500 max-w-xs text-center mb-2">
                {t('payment.scanQr', 'Scan the QR code with any UPI app and make a payment of')}
                <span className="font-semibold"> ₹{amount.toFixed(2)}</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <form onSubmit={handleSubmit}>
              <div className="space-y-1 mb-4">
                <label htmlFor="utr" className="block text-sm font-medium">
                  {t('payment.utrNumber', 'UTR/Reference Number')}
                </label>
                <div className="relative">
                  <Input
                    id="utr"
                    type="text"
                    placeholder={t('payment.enterUtr', 'Enter the UTR/Reference number shown in your UPI app')}
                    value={utrNumber}
                    onChange={handleUtrChange}
                    onBlur={handleUtrBlur}
                    className={`pr-8 ${utrError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={submitting}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            toast({
                              title: t('payment.utrHelp', 'UTR Number Help'),
                              description: t('payment.utrHelpText', 'The UTR (Unique Transaction Reference) number is shown in your UPI app after completing the payment. It is usually a 12-22 character alphanumeric code.'),
                              variant: "default",
                            });
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{t('payment.whatIsUtr', 'What is a UTR number?')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {utrError && (
                  <p className="text-red-500 text-xs mt-1">{utrError}</p>
                )}
              </div>
              
              <Button 
                type="submit"
                className="w-full"
                disabled={submitting || isLoading || !!utrError}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    {t('payment.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    {t('payment.confirmPayment', 'Confirm Payment')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-600 flex items-start">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              {t('payment.noteText', 'After completing the UPI payment, copy the UTR/Reference number from your UPI app and paste it above to verify your payment.')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpiPayment;
