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
import { ArrowRight, Clock, AlertTriangle, CheckCircle, QrCode, Copy, Info, Smartphone, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCodeGenerator from './QRCodeGenerator';
import * as paymentApi from '@/services/api/paymentApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import configService from '@/config/appConfig';
import UpiGuideTooltip from './UpiGuideTooltip';

interface UpiPaymentProps {
  bookingId: string;
  amount: number;
  onPaymentSuccess?: () => void;
  onUtrSubmit?: (utr: string) => void;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface UpiDetails {
  vpa: string;
  utr_number: string;
}

interface PaymentMethod {
  type: string;
  upi_details?: UpiDetails;
}

// UPI App details
interface UpiApp {
  name: string;
  icon: string;
  package: string;
  color: string;
}

const UpiPayment = ({ bookingId, amount, onPaymentSuccess, onUtrSubmit, customerInfo }: UpiPaymentProps) => {
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showUpiApps, setShowUpiApps] = useState<boolean>(false);
  const [canUsePaymentRequest, setCanUsePaymentRequest] = useState<boolean>(false);
  const [qrValue, setQrValue] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [detectedInstalledApps, setDetectedInstalledApps] = useState<string[]>([]);

  // Define popular UPI apps
  const upiApps: UpiApp[] = [
    { name: 'Google Pay', icon: '🅿️', package: 'com.google.android.apps.nbu.paisa.user', color: '#4285F4' },
    { name: 'PhonePe', icon: '🅿️', package: 'com.phonepe.app', color: '#5F259F' },
    { name: 'Paytm', icon: '📱', package: 'net.one97.paytm', color: '#00BAF2' },
    { name: 'BHIM', icon: '🇮🇳', package: 'in.org.npci.upiapp', color: '#00A0E3' },
    { name: 'Amazon Pay', icon: '🛒', package: 'in.amazon.mShop.android.shopping', color: '#FF9900' }
  ];

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(userAgent);
      setIsMobile(isMobileDevice);
      
      // Auto-show UPI apps section on mobile devices
      if (isMobileDevice) {
        setShowUpiApps(true);
        // Try to detect installed UPI apps on Android
        if (/android/i.test(userAgent)) {
          detectInstalledApps();
        }
      }
    };

    // Check if Payment Request API is supported
    const checkPaymentRequestSupport = () => {
      setCanUsePaymentRequest(!!window.PaymentRequest);
    };

    checkMobile();
    checkPaymentRequestSupport();

    const fetchUpiSettings = async () => {
      try {
        setIsLoading(true);
        setQrLoadError(false);
        
        const response = await paymentApi.getPaymentSettings();
        
        if (response.data?.data?.upi?.vpa) {
          setUpiId(response.data.data.upi.vpa);
          
          // Generate QR code for the payment
          const { qrUrl, upiUrl } = await paymentApi.generateUpiQrCode(amount, bookingId);
          setQrValue(upiUrl);
          setQrCodeUrl(qrUrl);
        } else {
          // Using hardcoded fallback UPI ID
          setUpiId('eventia@okicici');
          console.info('Using fallback UPI ID as no settings found');
          
          // Generate fallback QR code
          const fallbackUpiUrl = `upi://pay?pa=eventia@okicici&pn=EventiaTickets&am=${amount}&tr=${bookingId}&cu=INR`;
          setQrValue(fallbackUpiUrl);
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackUpiUrl)}`);
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
  }, [bookingId, t, amount]);

  // Try to detect installed UPI apps
  const detectInstalledApps = async () => {
    const detectedApps: string[] = [];
    
    // Check for app availability using intent scheme
    const checkAppAvailability = async (app: UpiApp) => {
      return new Promise<boolean>((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Set timeout to catch if app intent fails
        const timeout = setTimeout(() => {
          resolve(false);
          document.body.removeChild(iframe);
        }, 500);
        
        // Create a link to test if the app is installed
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.location.href = `intent://#Intent;scheme=upi;package=${app.package};end`;
            
            // If we get here without error, app might be installed
            clearTimeout(timeout);
            resolve(true);
            document.body.removeChild(iframe);
          }
        } catch (e) {
          clearTimeout(timeout);
          resolve(false);
          document.body.removeChild(iframe);
        }
      });
    };
    
    // Check each app
    for (const app of upiApps) {
      try {
        const isAvailable = await checkAppAvailability(app);
        if (isAvailable) {
          detectedApps.push(app.package);
        }
      } catch (e) {
        console.log(`Error checking availability for ${app.name}:`, e);
      }
    }
    
    setDetectedInstalledApps(detectedApps);
  };

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
    
    if (!validateUtrNumber(utrNumber)) {
      setUtrError(t('payment.invalidUtrNumber', 'Please enter a valid UTR number'));
      return;
    }
    
    setSubmitting(true);
    setUtrError(null);
    
    try {
      // API call to submit the UTR
      const paymentMethod: PaymentMethod = {
        type: 'upi',
        upi_details: {
          vpa: upiId,
          utr_number: utrNumber
        }
      };
      
      if (paymentId) {
        // Update existing payment using submitUtrVerification
        await paymentApi.submitUtrVerification(paymentId, utrNumber);
      } else {
        // Create new payment
        const response = await paymentApi.createPayment({
          booking_id: bookingId,
          amount: amount,
          currency: 'INR',
          payment_method: paymentMethod
        });
        
        setPaymentId(response.data?.data?.id);
      }
      
      toast({
        title: t('payment.utrSubmitted', 'Payment details submitted'),
        description: t('payment.paymentVerification', 'We have received your payment details and will verify them shortly.')
      });
      
      // If parent provided success callback, call it
      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else if (onUtrSubmit) {
        // Otherwise use the original callback if provided
        onUtrSubmit(utrNumber);
      }
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      setPaymentError(error.response?.data?.message || t('payment.errorSubmittingUtr', 'There was a problem submitting your payment details. Please try again.'));
      
      toast({
        title: t('payment.submissionFailed', 'Submission failed'),
        description: error.response?.data?.message || t('payment.errorProcessingPayment', 'There was a problem processing your payment. Please try again.'),
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshQrCode = async () => {
    setQrLoadError(false);
    setIsLoading(true);
    
    const fetchUpiSettings = async () => {
      try {
        const response = await paymentApi.getPaymentSettings();
        
        if (response.data?.data?.upi?.vpa) {
          setUpiId(response.data.data.upi.vpa);
          
          // Generate QR code for the payment
          const { qrUrl, upiUrl } = await paymentApi.generateUpiQrCode(amount, bookingId);
          setQrValue(upiUrl);
          setQrCodeUrl(qrUrl);
          
          setQrLoadError(false);
        } else {
          throw new Error('No UPI settings found');
        }
      } catch (error) {
        console.error('Error refreshing QR code:', error);
        setQrLoadError(true);
        toast({
          title: t('payment.errorRefreshingQr', 'Error refreshing QR code'),
          description: t('payment.tryAgainLater', 'Please try again later'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    await fetchUpiSettings();
  };

  const copyUpiId = () => {
    if (!upiId) return;
    
    navigator.clipboard.writeText(upiId)
      .then(() => {
        toast({
          title: t('payment.upiCopied', 'UPI ID copied'),
          description: t('payment.pasteInApp', 'Paste in your UPI app to make payment'),
        });
      })
      .catch((err) => {
        console.error('Error copying UPI ID:', err);
        toast({
          title: t('payment.copyFailed', 'Copy failed'),
          description: t('payment.manualCopy', 'Please manually copy the UPI ID'),
          variant: "destructive",
        });
      });
  };

  const getUpiPaymentUrl = (): string => {
    return qrValue || `upi://pay?pa=${encodeURIComponent(upiId)}&pn=EventiaTickets&am=${amount}&tr=${bookingId}&cu=INR`;
  };

  const handleUpiDeepLink = async (app?: UpiApp) => {
    try {
      // If specific app is selected, use app-specific deep link
      let upiDeepLink = '';
      
      if (app) {
        upiDeepLink = await paymentApi.getUpiAppDeepLink(amount, bookingId, app.package);
      } else {
        // Generic UPI URL
        upiDeepLink = getUpiPaymentUrl();
      }
      
      // For iOS devices, fallback to universal links for UPI apps
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS && app) {
        switch (app.package) {
          case 'com.google.android.apps.nbu.paisa.user': // Google Pay
            upiDeepLink = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=EventiaTickets&am=${amount}&tr=${bookingId}&cu=INR`;
            break;
          case 'com.phonepe.app': // PhonePe
            upiDeepLink = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=EventiaTickets&am=${amount}&tr=${bookingId}&cu=INR`;
            break;
          case 'net.one97.paytm': // Paytm
            upiDeepLink = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=EventiaTickets&am=${amount}&tr=${bookingId}&cu=INR`;
            break;
          default:
            // Use standard UPI deep link
            break;
        }
      }
      
      // Open the UPI app
      window.location.href = upiDeepLink;
      
      // After a delay, remind user to come back and submit UTR
      setTimeout(() => {
        // Only show the reminder if the user is still on the same page
        if (document.visibilityState === 'visible') {
          toast({
            title: t('payment.dontForgetUtr', 'Don\'t forget your UTR'),
            description: t('payment.afterPayment', 'After payment, return here to submit your UTR number'),
          });
        }
      }, 5000);
    } catch (error) {
      console.error('Error opening UPI app:', error);
      toast({
        title: t('payment.errorOpeningApp', 'Error opening UPI app'),
        description: t('payment.tryScanning', 'Try scanning the QR code instead'),
        variant: "destructive",
      });
    }
  };

  // Try to use Payment Request API (Web Payments)
  const handlePaymentRequest = async () => {
    if (!canUsePaymentRequest) {
      toast({
        title: t('payment.unsupportedPayment', 'Unsupported Payment Method'),
        description: t('payment.browserUnsupported', 'Your browser does not support web payments'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Define the payment methods
      const supportedPaymentMethods = [
        {
          supportedMethods: 'https://tez.google.com/pay',
          data: {
            pa: upiId,
            pn: 'EventiaTickets',
            tr: bookingId,
            am: amount.toString(),
            cu: 'INR',
            tn: `Booking #${bookingId}`,
          },
        },
        {
          supportedMethods: 'https://securepay.phonepe.com/pay',
          data: {
            pa: upiId,
            pn: 'EventiaTickets',
            tr: bookingId,
            am: amount.toString(),
            cu: 'INR',
            tn: `Booking #${bookingId}`,
          },
        }
      ];
      
      // Define the payment details
      const paymentDetails = {
        total: {
          label: `Booking #${bookingId}`,
          amount: {
            currency: 'INR',
            value: amount.toString(),
          },
        },
      };
      
      // Create a new PaymentRequest
      const request = new PaymentRequest(
        supportedPaymentMethods,
        paymentDetails
      );
      
      // Show the payment UI
      const response = await request.show();
      
      // Process the response - in real implementation, you would verify the payment
      await response.complete('success');
      
      // Show a prompt to enter UTR number
      toast({
        title: t('payment.paymentInitiated', 'Payment Initiated'),
        description: t('payment.enterUtr', 'Please enter your UTR number below'),
      });
    } catch (error) {
      console.error('Payment Request API error:', error);
      toast({
        title: t('payment.paymentRequestFailed', 'Payment Request Failed'),
        description: t('payment.fallbackToQr', 'Please use the QR code instead'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary/10 p-1.5 rounded-full mr-2">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium">{t('payment.upiPayment', 'UPI Payment')}</h3>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatTime(remainingTime)}</span>
        </div>
      </div>
      
      {/* UPI Payment Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="bg-card border rounded-lg p-4 flex flex-col items-center">
          <h4 className="text-sm font-medium mb-4 text-center">{t('payment.scanQr', 'Scan QR with any UPI app')}</h4>
          
          <QRCodeGenerator
            value={qrValue}
            size={200}
            paymentDetails={{ upiId, amount, description: `Booking #${bookingId.substring(0, 8)}` }}
            className="mb-4"
            isLoading={isLoading}
            onRetry={refreshQrCode}
            errorMessage={qrLoadError ? t('payment.qrLoadError', 'Error loading QR code') : undefined}
          />
          
          <div className="w-full mt-2 space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="text-sm font-medium overflow-hidden text-ellipsis">{upiId}</div>
              <Button variant="ghost" size="icon" onClick={copyUpiId} className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile UPI App Links */}
            {isMobile && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowUpiApps(!showUpiApps)}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {showUpiApps 
                    ? t('payment.hideUpiApps', 'Hide UPI Apps') 
                    : t('payment.openWithApp', 'Open with UPI App')}
                </Button>
                
                {showUpiApps && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {upiApps.map((app) => (
                      <Button
                        key={app.package}
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 px-3 flex flex-col items-center gap-1"
                        style={{ 
                          opacity: detectedInstalledApps.length > 0 && !detectedInstalledApps.includes(app.package) ? 0.5 : 1,
                        }}
                        onClick={() => handleUpiDeepLink(app)}
                      >
                        <span className="text-lg">{app.icon}</span>
                        <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                          {app.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* UTR Input Section */}
        <div className="bg-card border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4">{t('payment.enterUtrNumber', 'Enter UTR Number after payment')}</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="utr-number" className="text-sm text-muted-foreground">
                {t('payment.utrNumberLabel', 'UTR/Reference Number')}
              </label>
              <Input
                id="utr-number"
                value={utrNumber}
                onChange={handleUtrChange}
                onBlur={handleUtrBlur}
                placeholder={t('payment.utrPlaceholder', 'e.g. 123456789012')}
                className={utrError ? 'border-red-500' : ''}
                disabled={submitting}
              />
              {utrError && (
                <p className="text-xs text-red-500 mt-1">{utrError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('payment.utrHelp', 'Find this in your UPI app transaction history or payment confirmation SMS')}
              </p>
            </div>
            
            {paymentError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">{paymentError}</div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting || !utrNumber.trim() || !!utrError}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('payment.processing', 'Processing...')}
                </>
              ) : (
                <>
                  {t('payment.submitPayment', 'Submit Payment')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 pt-4 border-t">
            <UpiGuideTooltip />
          </div>
        </div>
      </div>
      
      {/* Payment Instructions */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">{t('payment.importantInformation', 'Important Information')}</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t('payment.instruction1', 'After making payment, get the UTR/Reference number from your UPI app or SMS')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{t('payment.instruction2', 'Submit the UTR number to verify your payment')}</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{t('payment.instruction3', 'Payment verification may take up to 30 minutes')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UpiPayment;
