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
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
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
import PaymentFlow from '@/components/payment/PaymentFlow';
import { isAuthenticated } from '@/services/api/apiUtils';

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
  const location = useLocation();
  const { activeUpiId, isLoading: isUpiLoading } = usePaymentSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if we have location state or valid booking ID
  useEffect(() => {
    // If no location state and this is not a direct payment with bookingId, redirect to address page
    const hasValidRoute = location.state || bookingId || sessionStorage.getItem('bookingData');

    if (!hasValidRoute) {
      console.log('Payment page accessed without state or bookingId, redirecting to address page');
      navigate('/booking/delivery');
      return;
    }

    console.log('Payment page loaded with valid state or bookingId');
  }, [location.state, bookingId, navigate]);

  // Debugging - log component mount and location state
  useEffect(() => {
    console.log('Payment component mounted');
    console.log('Location state:', location.state);
    console.log('Booking ID from params:', bookingId);
    console.log('Session storage bookingData exists:', !!sessionStorage.getItem('bookingData'));
    console.log('Session storage deliveryData exists:', !!sessionStorage.getItem('deliveryData'));

    // Return cleanup function
    return () => {
      console.log('Payment component unmounting');
    };
  }, [location, bookingId]);

  // Load booking information
  useEffect(() => {
    const loadBookingData = async () => {
      if (!bookingId) return;

      setIsLoading(true);
      try {
        // Check if this is a temporary booking ID
        if (bookingId.startsWith('TEMP-')) {
          // Load data from session storage instead of API
          const bookingDataStr = sessionStorage.getItem('bookingData');
          const deliveryDataStr = sessionStorage.getItem('deliveryData');

          if (!bookingDataStr) {
            throw new Error('No booking data found in session storage');
          }

          const storedBookingData = JSON.parse(bookingDataStr);
          const deliveryData = deliveryDataStr ? JSON.parse(deliveryDataStr) : null;

          // Calculate final amount from tickets
          let totalAmount = 0;
          if (storedBookingData.tickets && storedBookingData.tickets.length > 0) {
            totalAmount = storedBookingData.tickets.reduce((sum, ticket) => sum + ticket.subtotal, 0);
          } else {
            totalAmount = storedBookingData.totalAmount || 1000; // Fallback amount
          }

          // Get total quantity
          let totalQuantity = 0;
          if (storedBookingData.tickets && storedBookingData.tickets.length > 0) {
            totalQuantity = storedBookingData.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
          }

          // Construct proper event object
          const eventObject = {
            id: storedBookingData.eventId,
            title: storedBookingData.eventTitle,
            startDate: storedBookingData.eventDate,
            location: storedBookingData.venue,
            date: storedBookingData.eventDate,
            time: storedBookingData.eventTime
          };

          // Construct a complete booking object from session storage data
          const tempBooking = {
            id: bookingId,
            booking_id: bookingId, // Some components might use this field
            event: eventObject,
            deliveryDetails: deliveryData,
            tickets: storedBookingData.tickets || [],
            totalAmount: totalAmount,
            finalAmount: totalAmount,
            quantity: totalQuantity || 1,
            status: 'PENDING',
            currency: 'INR',
            userId: 'temp-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          console.log('Using session storage data for payment page:', tempBooking);

          setBooking(tempBooking);
          setEvent(eventObject);
          setDeliveryInfo(deliveryData);
        } else {
          // Get booking details using the API for real booking IDs
          const bookingData = await getBookingById(bookingId);
          setBooking(bookingData);
          setEvent(bookingData.event);
          setDeliveryInfo(bookingData.deliveryDetails);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading booking data:', error);
        toast({
          title: 'Error',
          description: 'Unable to load booking information. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
        // Navigate back to events page when booking info can't be loaded
        navigate('/events');
      }
    };

    // Only attempt to load data if we have a valid route
    const hasValidRoute = location.state || bookingId || sessionStorage.getItem('bookingData');
    if (hasValidRoute) {
      loadBookingData();
    }
  }, [bookingId, navigate, location.state]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  // If no booking data was loaded, show a friendly message with redirect option
  if (!booking || !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container max-w-4xl mx-auto px-4 py-8">
          <div className="bg-muted rounded-xl p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">{t('payment.noBookingData', 'Missing Booking Information')}</h2>
            <p className="mb-6">{t('payment.redirectToAddress', 'Please complete your delivery details first.')}</p>
            <Button onClick={() => navigate('/booking/delivery')}>
              {t('payment.goToDeliveryDetails', 'Go to Delivery Details')}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('payment.payment')}</h1>
          <p className="text-muted-foreground">{t('payment.completePayment')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Payment Section */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">{t('payment.paymentMethod')}</h2>

              {/* Payment Flow Component */}
              <PaymentFlow
                bookingId={bookingId || ''}
                amount={booking.finalAmount || booking.totalAmount}
                onPaymentComplete={handleUpiPaymentSuccess}
                customerInfo={{
                  name: deliveryInfo?.name || '',
                  email: deliveryInfo?.email || '',
                  phone: deliveryInfo?.phone || ''
                }}
                onPaymentCancel={() => navigate(-1)}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-muted rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">{t('payment.orderSummary')}</h2>

              {/* Event Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-medium">{event?.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <CalendarClock className="h-4 w-4 mr-1" />
                    <span>{event?.date} {event?.time && `• ${event.time}`}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event?.location}
                  </div>
                </div>
              </div>

              {/* Ticket Summary */}
              <div className="space-y-3 border-t border-border pt-4 mb-4">
                <h3 className="font-medium">{t('payment.tickets')}</h3>
                {booking.tickets && booking.tickets.map((ticket: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{ticket.name || 'Standard Ticket'} x {ticket.quantity}</span>
                    <span>₹{formatAmountWithCommas(ticket.subtotal || (ticket.price * ticket.quantity))}</span>
                  </div>
                ))}
                {(!booking.tickets || booking.tickets.length === 0) && (
                  <div className="flex justify-between text-sm">
                    <span>Tickets x {booking.quantity || 1}</span>
                    <span>₹{formatAmountWithCommas(booking.finalAmount || booking.totalAmount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-medium">
                  <span>{t('payment.total')}</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span>{formatAmountWithCommas(booking.finalAmount || booking.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="font-medium mb-2">{t('payment.notes')}</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• {t('payment.securePayment')}</li>
                <li>• {t('payment.utrVerification')}</li>
                <li>• {t('payment.ticketsAfterVerification')}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
