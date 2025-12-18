
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
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import DiscountForm from '@/components/payment/DiscountForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Step, StepIndicator, Steps } from '@/components/ui/steps';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { defaultApiClient } from '@/services/api/apiUtils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Calendar, Check, ChevronRight, Clock, Copy, Loader2, MapPin, ShieldCheck, Ticket, Timer, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Import API services
import { createBooking } from '@/services/api/payment.service';

interface TicketData {
  category: string;
  categoryId?: string;
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
  bannerImage?: string;
  seatIds?: string[];
  lockerId?: string;
  teams?: {
    team1: { name: string; logo: string; primaryColor?: string };
    team2: { name: string; logo: string; primaryColor?: string };
  };
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
  const [, setCurrentBookingId] = useState<string | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(600); // default: 10 minutes

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch payment configuration on mount
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const response = await defaultApiClient.get(`/payments/config`);
        if (response.data && response.data.data) {
          setPaymentConfig(response.data.data);
        } else {
          // Fallback or error but don't block UI if config fails slightly
          // throw new Error('Invalid payment configuration data');
        }
      } catch (error) {
        console.error('Error fetching payment config:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchPaymentConfig();
  }, []);

  useEffect(() => {
    // Retrieve booking data from sessionStorage
    const savedBookingData = sessionStorage.getItem('bookingData');
    const savedDeliveryDetails = sessionStorage.getItem('deliveryDetails');

    if (savedBookingData) {
      const parsedBookingData = JSON.parse(savedBookingData);
      setBookingData(parsedBookingData);
      if (Array.isArray(parsedBookingData?.seatIds) && parsedBookingData.seatIds.length > 0) {
        setTimeLeft(300); // Seat lock TTL: 5 minutes
      }
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
      const booking = await createBooking({
        eventId: bookingData.eventId,
        seatIds: bookingData.seatIds,
        lockerId: bookingData.lockerId,
        tickets: bookingData.tickets.map(t => ({
          category: t.category,
          categoryId: t.categoryId,
          quantity: t.quantity,
          price: t.price,
          subtotal: t.subtotal
        })),
        totalAmount: bookingData.totalAmount,
        customerInfo: {
          name: customerName,
          email,
          phone,
          address: [address, city, pincode].filter(Boolean).join(', ')
        }
      });

      const bookingId = booking.id;

      setCurrentBookingId(bookingId);

      // Store order data for confirmation page
      const orderData = {
        bookingId: bookingId,
        eventTitle: bookingData.eventTitle,
        eventDate: bookingData.eventDate,
        eventTime: bookingData.eventTime,
        venue: bookingData.venue,
        seatIds: bookingData.seatIds,
        tickets: bookingData.tickets,
        totalAmount: bookingData.totalAmount,
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
        navigate(`/confirmation/${bookingId}`, { state: { bookingDetails: orderData } });
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

      <main className="flex-grow pt-16">
        {/* Trust Banner with Countdown */}
        <div className="bg-blue-600 text-white py-3 sticky top-16 z-40 shadow-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-green-300" />
              <span className="font-medium text-sm md:text-base">Official Ticketing Partner</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-700 px-3 py-1 rounded-full">
              <Timer className="h-4 w-4 text-yellow-300" />
              <span className="font-mono font-bold text-yellow-300 min-w-[3rem] text-center">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-blue-100 hidden sm:inline">Time to complete order</span>
            </div>
          </div>
        </div>

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
            <p className="text-[var(--district-muted)]">Secure Checkout • 256-bit SSL Encrypted</p>
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
                    <Card className="border-t-4 border-t-blue-600">
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
                      <CardFooter className="flex justify-between bg-white/5 p-6 border-t border-[var(--district-border)]">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/events')}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleNextStep}
                          className="gap-1 bg-blue-600 hover:bg-blue-700"
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
                    <Card className="border-t-4 border-t-green-600">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          {t('payment.title')}
                          <Badge variant="outline" className="ml-3 text-green-600 bg-green-50 border-green-200 gap-1">
                            <ShieldCheck className="h-3 w-3" /> Secure Payment
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {t('payment.scanQr')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 flex justify-center items-start">
                            {paymentConfig?.upiQrCodeUrl ? (
                              <div className="bg-white/5 p-4 rounded-xl border-2 border-dashed border-[var(--district-border)] shadow-sm max-w-[240px] mx-auto">
                                <img
                                  src={paymentConfig.upiQrCodeUrl}
                                  alt="UPI QR Code"
                                  className="w-full h-auto rounded"
                                />
                                <div className="mt-3 text-center">
                                  <Badge className="bg-orange-500 hover:bg-orange-600 mb-1">UPI</Badge>
                                  <div className="text-xs text-[var(--district-muted)]">{t('payment.scanToPayUpi')}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white/5 p-4 rounded-md border border-[var(--district-border)] max-w-[220px] mx-auto flex items-center justify-center h-[220px]">
                                <Loader2 className="h-6 w-6 animate-spin text-[var(--district-muted)]" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="rounded-lg border border-[var(--district-border)] p-4 bg-white/5">
                              <div className="text-sm font-medium mb-3 text-[var(--district-text)]">{t('payment.payeeDetails')}</div>
                              {paymentConfig ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded border border-[var(--district-border)]">
                                    <span className="text-[var(--district-muted)]">{t('payment.merchantVPA')}</span>
                                    <div className="flex items-center gap-1">
                                      <code className="font-mono text-xs">{paymentConfig.upiVpa}</code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={handleCopyUpi}
                                        disabled={!paymentConfig?.upiVpa}
                                      >
                                        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--district-muted)]">Loading payment details...</div>
                              )}
                            </div>

                            <div className="space-y-3 pt-3">
                              <div>
                                <Label htmlFor="utr" className="text-base font-medium">
                                  {t('payment.submitUTR')}
                                </Label>
                                <p className="text-sm text-[var(--district-muted)] mb-2">
                                  {t('payment.utrDescription')}
                                </p>
                                <Input
                                  id="utr"
                                  value={utrNumber}
                                  onChange={(e) => setUtrNumber(e.target.value)}
                                  placeholder={t('payment.utrPlaceholder')}
                                  disabled={!paymentConfig}
                                  className="border-blue-200 focus:border-blue-500"
                                />
                                <p className="text-xs text-[var(--district-muted)] mt-1">
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
                      <CardFooter className="flex justify-between bg-white/5 p-6 border-t border-[var(--district-border)]">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                        >
                          {t('common.back')}
                        </Button>
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={isSubmitting || !utrNumber || !paymentConfig}
                          className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
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
              <Card className="sticky top-28 border border-[var(--district-border)] shadow-xl district-panel">
                <CardHeader className="rounded-t-xl py-4 border-b border-[var(--district-border)] bg-white/5">
                  <CardTitle className="text-lg text-[var(--district-text)]">{t('checkout.orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {bookingData.bannerImage ? (
                    <div className="rounded-lg overflow-hidden w-full h-32 relative mb-4">
                      <img
                        src={bookingData.bannerImage}
                        alt={bookingData.eventTitle}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white font-bold text-sm">
                        {bookingData.venue}
                      </div>
                    </div>
                  ) : (
                    <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "")}>
                      <div className="rounded-md overflow-hidden w-20 h-20 bg-white/10 flex-shrink-0">
                        <img
                          src="https://placehold.co/100x100"
                          alt={bookingData.eventTitle}
                          className="w-full h-full object-cover"
                        />
                        </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-lg mb-1">{bookingData.eventTitle}</h3>
                    <div className="space-y-2 mt-3">
                      <div className="text-sm text-[var(--district-text)] flex items-center p-2 bg-white/5 rounded border border-[var(--district-border)]">
                        <Calendar className="w-4 h-4 mr-2 text-[var(--district-accent)]" />
                        {bookingData.eventDate}
                      </div>
                      <div className="text-sm text-[var(--district-text)] flex items-center p-2 bg-white/5 rounded border border-[var(--district-border)]">
                        <Clock className="w-4 h-4 mr-2 text-[var(--district-accent)]" />
                        {bookingData.eventTime}
                      </div>
                      <div className="text-sm text-[var(--district-text)] flex items-center p-2 bg-white/5 rounded border border-[var(--district-border)]">
                        <MapPin className="w-4 h-4 mr-2 text-[var(--district-accent)]" />
                        <span className="truncate">{bookingData.venue}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {bookingData.tickets.map((ticket, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium text-[var(--district-text)]">
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

                  <div className="flex justify-between items-end border-t pt-4">
                    <span className="font-bold text-[var(--district-text)]">{t('checkout.total')}</span>
                    <div className="text-right">
                      {hasDiscount && (
                        <div className="line-through text-[var(--district-muted)] text-sm font-normal">
                          {formatCurrency(originalTotal)}
                        </div>
                      )}
                      <div className="font-bold text-2xl text-blue-700">{formatCurrency(bookingData.totalAmount)}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-white/5 rounded-b-xl text-xs text-[var(--district-muted)] text-center p-4 border-t border-[var(--district-border)]">
                  Prices include all applicable taxes and fees.
                </CardFooter>
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
