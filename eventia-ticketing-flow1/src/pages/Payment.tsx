/**
 * @component Payment
 * @description Handles the payment process for a booking. Displays payment information,
 * facilitates UPI payment via QR code, and collects UTR number for verification.
 * 
 * @apiDependencies
 * - Express API endpoints:
 *   - GET /api/bookings/:id - Retrieves booking details by ID (includes event and delivery info)
 *   - GET /api/payments/upi-settings - Fetches UPI payment settings
 *   - GET /api/payments/booking/:bookingId - Checks for existing payment
 *   - POST /api/payments - Creates a new payment record
 * 
 * @requiredFields
 * - UTR number (from UpiPayment component)
 * 
 * @expectedResponse
 * - Payment confirmation redirects to the confirmation page
 * 
 * @navigationFlow
 * - Previous: Delivery details (/delivery-details)
 * - Next: Confirmation page (/confirmation/:bookingId)
 * 
 * @params
 * - bookingId: string - ID of the booking to process payment for
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, CopyCheck, AlertCircle, CalendarClock, IndianRupee } from 'lucide-react';
import { usePaymentSettings } from '@/hooks/use-payment-settings';
import { getBookingById } from '@/services/api/bookingApi';
import { recordUpiPayment } from '@/services/api/paymentApi';
import RazorpayPayment from '@/components/payment/RazorpayPayment';
import UpiPayment from '@/components/payment/UpiPayment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Get current date and time in local format
const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

// Format amount with commas for Indian currency format
const formatAmountWithCommas = (amount: number) => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

export default function Payment() {
  const { t } = useTranslation();
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { activeUpiId, isLoading: isUpiLoading } = usePaymentSettings();
  
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load booking information
  useEffect(() => {
    const loadBookingData = async () => {
      if (!bookingId) return;
      
      setIsLoading(true);
      try {
        // Get booking details using the API
        const bookingData = await getBookingById(bookingId);
        setBooking(bookingData);
        setEvent(bookingData.event);
        setDeliveryInfo(bookingData.deliveryDetails);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading booking data:', error);
        toast({
          title: 'Error',
          description: 'Unable to load booking information. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [bookingId]);

  // Copy UPI ID to clipboard
  const copyToClipboard = () => {
    if (!activeUpiId) return;
    
    navigator.clipboard.writeText(activeUpiId)
      .then(() => {
        setIsCopied(true);
        toast({
          title: 'UPI ID copied!',
          description: 'The UPI ID has been copied to your clipboard.',
        });
        
        // Reset copy status after 3 seconds
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch(err => {
        console.error('Error copying text:', err);
        toast({
          title: 'Copy failed',
          description: 'Could not copy UPI ID. Please try again.',
          variant: 'destructive'
        });
      });
  };

  // Submit payment details
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!utrNumber.trim()) {
      setErrorMessage('Please enter the UTR number from your payment');
      return;
    }
    
    if (!bookingId) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Call the API to record UPI payment
      const response = await recordUpiPayment({
        bookingId,
        utrNumber: utrNumber.trim(),
        paymentDate: new Date().toISOString(),
      });
      
      // Handle successful submission
      toast({
        title: 'Payment details submitted',
        description: 'We have received your payment details and will verify them shortly.',
      });
      
      // Redirect to confirmation page
      navigate(`/confirmation/${bookingId}`);
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to submit payment information. Please try again.');
      toast({
        title: 'Submission failed',
        description: 'There was a problem submitting your payment details.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle UPI payment success
  const handleUpiPaymentSuccess = () => {
    toast({
      title: t('payment.paymentDetailsSubmitted', 'Payment details submitted'),
      description: t('payment.paymentVerificationPending', 'We will verify your payment shortly.'),
    });
    
    // Redirect to confirmation page
    navigate(`/confirmation/${bookingId}`);
  };

  // Handle card payment success
  const handleCardPaymentSuccess = (paymentId: string, orderId: string) => {
    toast({
      title: t('payment.paymentSuccessful', 'Payment Successful'),
      description: t('payment.processingOrder', 'Processing your order...'),
    });
    
    // Navigate to confirmation page
    navigate(`/confirmation/${bookingId}`);
  };

  // Show loading state
  if (isLoading || isUpiLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error if booking not found
  if (!booking || !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">We couldn't find the booking you're looking for.</p>
            <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-8 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('payment.completePayment', 'Complete Your Payment')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('payment.chooseMethod', 'Choose your preferred payment method to confirm your booking')}
            </p>
          </div>
          
          {/* Booking summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b dark:border-gray-700">
              {t('payment.bookingSummary', 'Booking Summary')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payment.eventDetails', 'Event Details')}</h3>
                <p className="font-semibold mb-1">{event.title}</p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <CalendarClock className="h-4 w-4 mr-1" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payment.bookingDetails', 'Booking Details')}</h3>
                <p className="text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{t('payment.bookingId', 'Booking ID')}:</span>{" "}
                  <span className="font-mono">{booking.id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{t('payment.quantity', 'Quantity')}:</span>{" "}
                  <span>{booking.quantity} {t('payment.tickets', 'ticket(s)')}</span>
                </p>
                <p className="flex items-center font-semibold text-lg">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {formatAmountWithCommas(booking.finalAmount)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Payment methods */}
          <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upi">{t('payment.upiPayment', 'UPI Payment')}</TabsTrigger>
              <TabsTrigger value="card">{t('payment.cardPayment', 'Card Payment')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upi">
              {/* UPI Payment section */}
              <UpiPayment 
                bookingId={bookingId || ''}
                amount={booking?.finalAmount || 0}
                customerInfo={{
                  name: deliveryInfo?.name || '',
                  email: deliveryInfo?.email || '',
                  phone: deliveryInfo?.phone || ''
                }}
                onPaymentSuccess={handleUpiPaymentSuccess}
              />
            </TabsContent>
            
            <TabsContent value="card">
              {/* Razorpay Card Payment section */}
              <RazorpayPayment 
                bookingId={bookingId || ''}
                amount={booking?.finalAmount || 0}
                customerInfo={{
                  name: deliveryInfo?.name || '',
                  email: deliveryInfo?.email || '',
                  phone: deliveryInfo?.phone || ''
                }}
                onPaymentSuccess={handleCardPaymentSuccess}
                onPaymentFailure={(error) => {
                  // Handle payment failure
                  setErrorMessage(error.description || 'Payment failed. Please try again.');
                  
                  toast({
                    title: t('payment.paymentFailed', 'Payment Failed'),
                    description: error.description || t('payment.tryAgain', 'Please try again or use a different payment method.'),
                    variant: "destructive"
                  });
                }}
              />
            </TabsContent>
          </Tabs>
          
          {/* Payment safety notice */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('payment.securityInfo', 'Payment Security')}</h3>
            <p className="text-blue-700 dark:text-blue-400">
              {t('payment.securityDetails', 'All payments are secure and encrypted. We never store your payment details. For assistance, contact our support team.')}
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
