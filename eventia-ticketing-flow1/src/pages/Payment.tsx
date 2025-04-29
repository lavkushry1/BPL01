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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pay using UPI and provide the UTR number to confirm your booking
            </p>
          </div>
          
          {/* Booking summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b dark:border-gray-700">
              Booking Summary
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Event Details</h3>
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
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Booking Details</h3>
                <p className="text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>{" "}
                  <span className="font-mono">{booking.id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>{" "}
                  <span>{booking.quantity} ticket(s)</span>
                </p>
                <p className="flex items-center font-semibold text-lg">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {formatAmountWithCommas(booking.finalAmount)}
                </p>
              </div>
            </div>
          </div>
          
          {/* UPI Payment Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">UPI Payment</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Pay using any UPI app
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                Make a payment of <strong>₹{formatAmountWithCommas(booking.finalAmount)}</strong> to the UPI ID below using any UPI app like PhonePe, Google Pay, Paytm, or your banking app.
              </p>
              
              {/* UPI ID display with copy button */}
              <div className="relative bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-md flex items-center p-3 mb-4">
                <span className="text-gray-900 dark:text-gray-100 font-mono flex-grow pr-10">
                  {activeUpiId || 'UPI ID not available'}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-1"
                  disabled={!activeUpiId}
                  aria-label="Copy UPI ID to clipboard"
                >
                  {isCopied ? (
                    <CopyCheck className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <p className="mb-1">
                  <strong>Instructions:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your UPI app and select the Send Money/Pay option</li>
                  <li>Enter the UPI ID shown above</li>
                  <li>Enter the exact amount: ₹{formatAmountWithCommas(booking.finalAmount)}</li>
                  <li>Complete the payment and note down the UTR number/reference ID</li>
                  <li>Enter the UTR number below to confirm your booking</li>
                </ol>
              </div>
            </div>
            
            {/* UTR Input Form */}
            <form onSubmit={handleSubmitPayment}>
              <div className="mb-4">
                <label htmlFor="utrNumber" className="block text-sm font-medium mb-2">
                  UTR Number / Reference ID
                </label>
                <Input
                  id="utrNumber"
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter the UTR number or reference ID from your payment"
                  className="w-full"
                  required
                />
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The UTR number is a unique transaction reference that appears in your payment confirmation.
                </p>
                
                {errorMessage && (
                  <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errorMessage}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payment time: {getCurrentDateTime()}
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </div>
            </form>
          </div>
          
          {/* Support Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@eventia.com" className="text-blue-600 hover:underline">
                support@eventia.com
              </a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
