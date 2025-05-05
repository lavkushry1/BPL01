/**
 * @component Checkout
 * @description A multi-step checkout process after selecting tickets.
 * Displays order summary, collects customer information, and handles payment.
 * 
 * @apiDependencies
 * - POST /api/bookings - Create a booking
 * - POST /api/payments - Initialize payment
 * - PUT /api/payments/{id} - Submit payment details (UTR)
 * 
 * @stateManagement
 * - Multi-step form with delivery details and payment steps
 * - Order summary persistent throughout checkout flow
 * - Discount code application with real-time validation
 * 
 * @navigationFlow
 * - Previous: Event selection / Booking modal
 * - Next: Confirmation page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QrCode, Copy, Check, ArrowLeft, ChevronRight, MapPin, Calendar, Clock, User, Phone, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Step, StepIndicator, Steps } from '@/components/ui/steps';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import DiscountForm from '@/components/payment/DiscountForm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { defaultApiClient } from '@/services/api/apiUtils';
import { API_BASE_URL } from '@/config';

// Import API services
import { verifyUtrPayment, createBooking } from '@/services/api/payment.service';

interface TicketData {
  category: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface BookingData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  tickets: TicketData[];
  totalAmount: number;
}

/**
 * Multi-step checkout process component
 */
const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Checkout state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [sendUpdates, setSendUpdates] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<{ upiVpa: string; upiQrCodeUrl: string } | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  // Fetch payment configuration on mount
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const response = await defaultApiClient.get(`${API_BASE_URL}/payments/config`);
        if (response.data && response.data.data) {
          setPaymentConfig(response.data.data);
        } else {
          throw new Error('Invalid payment configuration data');
        }
      } catch (error) {
        console.error('Error fetching payment config:', error);
        toast({
          title: t('common.error'),
          description: t('payment.fetchConfigError'),
          variant: 'destructive',
        });
        // Optionally navigate back or show critical error state
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchPaymentConfig();
  }, [toast, t]);

  useEffect(() => {
    // Retrieve booking data from sessionStorage
    const savedBookingData = sessionStorage.getItem('bookingData');
    const savedDeliveryDetails = sessionStorage.getItem('deliveryDetails');

    if (savedBookingData) {
      const parsedBookingData = JSON.parse(savedBookingData);
      setBookingData(parsedBookingData);
      // Set initial bookingId if available (might need adjustment based on actual flow)
      // setCurrentBookingId(parsedBookingData.bookingId || null);
    } else {
      // Redirect back to events if no booking data is found
      navigate('/events');
      toast({
        title: t('common.error'),
        description: t('checkout.noBookingData'),
        variant: "destructive"
      });
    }

    if (savedDeliveryDetails) {
      const deliveryData = JSON.parse(savedDeliveryDetails);
      setCustomerName(deliveryData.customerName || '');
      setEmail(deliveryData.email || '');
      setPhone(deliveryData.phone || '');
      setAddress(deliveryData.address || '');
      setCity(deliveryData.city || '');
      setPincode(deliveryData.pincode || '');
      setSpecialInstructions(deliveryData.specialInstructions || '');
      setSendUpdates(deliveryData.sendUpdates !== undefined ? deliveryData.sendUpdates : true);

      // Skip to payment step since we already have delivery details
      setCurrentStep(2);
    } else {
      // If no delivery details, redirect to delivery address page
      navigate('/booking/delivery');
    }
  }, [navigate, toast, t]);

  const handleCopyUpi = () => {
    if (paymentConfig?.upiVpa) {
      navigator.clipboard.writeText(paymentConfig.upiVpa);
      setCopied(true);
      toast({
        title: t('payment.upiIdCopied'),
        description: t('payment.idCopiedClipboard')
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate delivery details before proceeding
      if (!customerName || !email || !phone || !address || !city || !pincode) {
        toast({
          title: t('common.error'),
          description: t('checkout.completeAllFields'),
          variant: "destructive"
        });
        return;
      }
      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        toast({
          title: t('common.error'),
          description: t('checkout.invalidEmail'),
          variant: "destructive"
        });
        return;
      }
      // Phone validation
      if (!/^\d{10}$/.test(phone)) {
        toast({
          title: t('common.error'),
          description: t('checkout.invalidPhone'),
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleApplyDiscount = (amount: number, code: string) => {
    setDiscountAmount(amount);
    setDiscountCode(code);

    if (bookingData && amount > 0) {
      setBookingData({
        ...bookingData,
        totalAmount: Math.max(0, calculateOriginalTotal() - amount)
      });
    }
  };

  const calculateOriginalTotal = () => {
    if (!bookingData) return 0;
    return bookingData.tickets.reduce((sum, ticket) => sum + ticket.subtotal, 0);
  };

  const handleSubmitOrder = async () => {
    if (!utrNumber) {
      toast({
        title: t('common.error'),
        description: t('payment.utrRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setCurrentBookingId(null);

    try {
      // Make a real API call to create the booking
      const response = await createBooking({
        eventId: bookingData?.eventId,
        eventTitle: bookingData?.eventTitle,
        tickets: bookingData?.tickets,
        totalAmount: bookingData?.totalAmount,
        customerInfo: {
          name: customerName,
          email,
          phone,
          address: `${address}, ${city}, ${pincode}`
        },
        paymentInfo: {
          utrNumber,
          verificationStatus: 'pending'
        }
      });

      if (!response.success || !response.bookingId) {
        throw new Error(response.message || 'Failed to create booking.');
      }

      setCurrentBookingId(response.bookingId);

      // Store order data for confirmation page
      const orderData = {
        bookingId: response.bookingId,
        eventTitle: bookingData?.eventTitle,
        eventDate: bookingData?.eventDate,
        eventTime: bookingData?.eventTime,
        venue: bookingData?.venue,
        tickets: bookingData?.tickets,
        totalAmount: bookingData?.totalAmount,
        customerName,
        email,
        phone,
        address,
        city,
        pincode,
        utrNumber,
        orderDate: new Date().toISOString(),
        discountCode,
        discountAmount
      };

      // Clear booking data from sessionStorage
      sessionStorage.removeItem('bookingData');

      // Success message
      toast({
        title: t('checkout.orderConfirmed'),
        description: t('checkout.redirectingToConfirmation')
      });

      // Redirect to confirmation page
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/confirmation/${response.bookingId}`, { state: { bookingDetails: orderData } });
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setCurrentBookingId(null);
      setIsSubmitting(false);
      toast({
        title: t('common.error'),
        description: error.message || t('checkout.paymentError'),
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!bookingData || isLoadingConfig) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p>{t('common.loading')}...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const originalTotal = calculateOriginalTotal();
  const hasDiscount = discountAmount > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('checkout.title')}</h1>
            <p className="text-gray-600">{bookingData.eventTitle}</p>
          </div>

          <Steps currentStep={currentStep} className="mb-8 max-w-3xl mx-auto">
            <Step>
              <StepIndicator>
                <User className="h-4 w-4" />
              </StepIndicator>
              <div className="ml-2">
                <p className="text-sm font-medium">{t('checkout.deliveryDetails')}</p>
              </div>
            </Step>
            <Step>
              <StepIndicator>
                <Ticket className="h-4 w-4" />
              </StepIndicator>
              <div className="ml-2">
                <p className="text-sm font-medium">{t('checkout.payment')}</p>
              </div>
            </Step>
            <Step>
              <StepIndicator>
                <Check className="h-4 w-4" />
              </StepIndicator>
              <div className="ml-2">
                <p className="text-sm font-medium">{t('checkout.confirmation')}</p>
              </div>
            </Step>
          </Steps>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="delivery-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('checkout.deliveryDetails')}</CardTitle>
                        <CardDescription>
                          {t('checkout.enterDeliveryInfo')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">{t('common.fullName')}</Label>
                            <Input
                              id="name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder={t('checkout.enterFullName')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">{t('common.email')}</Label>
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={t('checkout.enterEmail')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">{t('common.phone')}</Label>
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder={t('checkout.enterPhone')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="address">{t('common.address')}</Label>
                            <Input
                              id="address"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder={t('checkout.enterAddress')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="city">{t('common.city')}</Label>
                            <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder={t('checkout.enterCity')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pincode">{t('common.pincode')}</Label>
                            <Input
                              id="pincode"
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                              placeholder={t('checkout.enterPincode')}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="instructions">{t('checkout.specialInstructions')}</Label>
                          <Textarea
                            id="instructions"
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder={t('checkout.enterSpecialInstructions')}
                            className="resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Switch
                            id="updates"
                            checked={sendUpdates}
                            onCheckedChange={setSendUpdates}
                          />
                          <Label htmlFor="updates" className="text-sm">
                            {t('checkout.sendUpdates')}
                          </Label>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/events')}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleNextStep}
                          className="gap-1"
                        >
                          {t('common.continue')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="payment-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('payment.title')}</CardTitle>
                        <CardDescription>
                          {t('payment.scanQr')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 flex justify-center items-start">
                            {paymentConfig?.upiQrCodeUrl ? (
                              <div className="bg-white p-4 rounded-md border max-w-[220px] mx-auto">
                                <img
                                  src={paymentConfig.upiQrCodeUrl}
                                  alt="UPI QR Code"
                                  className="w-full h-auto"
                                />
                                <div className="mt-2 text-center text-sm text-gray-500">
                                  {t('payment.scanToPayUpi')}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 p-4 rounded-md border max-w-[220px] mx-auto flex items-center justify-center h-[220px]">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="rounded-md border p-3">
                              <div className="text-sm font-medium mb-2">{t('payment.payeeDetails')}</div>
                              {paymentConfig ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{t('payment.merchantVPA')}</span>
                                    <div className="flex items-center gap-1">
                                      <code className="bg-gray-100 px-2 rounded text-xs">{paymentConfig.upiVpa}</code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={handleCopyUpi}
                                        disabled={!paymentConfig?.upiVpa}
                                      >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('payment.transactionNote')}</span>
                                    <span className="font-mono text-xs">{currentBookingId || 'Generating...'}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Loading payment details...</div>
                              )}
                            </div>

                            <div className="space-y-3 pt-3">
                              <div>
                                <Label htmlFor="utr" className="text-base font-medium">
                                  {t('payment.submitUTR')}
                                </Label>
                                <p className="text-sm text-gray-500 mb-2">
                                  {t('payment.utrDescription')}
                                </p>
                                <Input
                                  id="utr"
                                  value={utrNumber}
                                  onChange={(e) => setUtrNumber(e.target.value)}
                                  placeholder={t('payment.utrPlaceholder')}
                                  disabled={!paymentConfig}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {t('payment.utrHelp')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <DiscountForm
                            eventId={bookingData.eventId}
                            onApplyDiscount={handleApplyDiscount}
                            disabled={!paymentConfig}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                        >
                          {t('common.back')}
                        </Button>
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={isSubmitting || !utrNumber || !paymentConfig}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.processing')}...
                            </>
                          ) : (
                            t('payment.confirmPayment')
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t('checkout.orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "")}>
                    <div className="rounded-md overflow-hidden w-20 h-20 bg-gray-100 flex-shrink-0">
                      <img
                        src="https://placehold.co/100x100"
                        alt={bookingData.eventTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{bookingData.eventTitle}</h3>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {bookingData.eventDate}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {bookingData.eventTime}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {bookingData.venue}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {bookingData.tickets.map((ticket, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {ticket.quantity} × {ticket.category}
                        </span>
                        <span>{formatCurrency(ticket.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {hasDiscount && (
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <span>{t('payment.discount')}</span>
                        {discountCode && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {discountCode}
                          </Badge>
                        )}
                      </div>
                      <span className="text-green-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold">
                    <span>{t('checkout.total')}</span>
                    <div className="flex items-center gap-2">
                      {hasDiscount && (
                        <span className="line-through text-gray-400 text-sm font-normal">
                          {formatCurrency(originalTotal)}
                        </span>
                      )}
                      <span>{formatCurrency(bookingData.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
