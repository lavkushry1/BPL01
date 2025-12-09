import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DeliveryDetailsForm from '@/components/booking/DeliveryDetailsForm';
import { ChevronLeft, Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { getEvent } from '@/services/api/eventApi';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BookingData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  tickets: {
    category: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  totalAmount: number;
}

interface DeliveryFormData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  specialInstructions?: string;
  receiveUpdates?: boolean;
}

// Simple inline OrderSummary component
const OrderSummary: React.FC<{ bookingData: BookingData }> = ({ bookingData }) => {
  const { t } = useTranslation();
  const { eventTitle, eventDate, eventTime, venue, tickets, totalAmount } = bookingData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString; // Return the original string if parsing fails
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">{t('checkout.orderSummary', 'Order Summary')}</h3>

        <div className="space-y-3">
          <div className="font-medium">{eventTitle}</div>

          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{formatDate(eventDate)}</span>
          </div>

          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{eventTime}</span>
          </div>

          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{venue}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="font-medium">{t('checkout.tickets', 'Tickets')}</div>

          {tickets && tickets.map((ticket, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex items-start space-x-2">
                <Ticket className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{ticket.category}</div>
                  <div className="text-gray-500">{t('checkout.quantity', 'Quantity')}: {ticket.quantity}</div>
                </div>
              </div>
              <div className="text-right">
                <div>{formatCurrency(ticket.price)} {t('checkout.each', 'each')}</div>
                <div className="font-medium">{formatCurrency(ticket.subtotal)}</div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between font-medium">
          <span>{t('checkout.totalAmount', 'Total Amount')}</span>
          <span className="text-lg">{formatCurrency(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const DeliveryAddressPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = eventIdParam || searchParams.get('eventId') || '';

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch event details
  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId && !bookingData?.eventTitle,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load booking data from sessionStorage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('bookingData');
      let parsedData = null;

      if (storedData) {
        parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.eventId) {
          setBookingData(parsedData);
        }
      }

      // If no booking data found, try to construct basic booking data from event info
      if (!parsedData && event) {
        // Extract time from start_date if available
        let eventTime = '19:00';
        if (event.start_date) {
          try {
            eventTime = format(new Date(event.start_date), 'HH:mm');
          } catch (e) {
            console.error("Error formatting event time:", e);
          }
        }

        const basicBookingData: BookingData = {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.start_date || event.date || new Date().toISOString(),
          eventTime: eventTime,
          venue: event.location || 'Venue',
          tickets: [],
          totalAmount: 0
        };

        setBookingData(basicBookingData);
        sessionStorage.setItem('bookingData', JSON.stringify(basicBookingData));
      }

      setLoading(false);
    } catch (e) {
      console.error("Error loading booking data:", e);
      setLoading(false);
    }
  }, [event]);

  const handleSubmit = async (deliveryData: DeliveryFormData): Promise<void> => {
    try {
      // Store delivery data in session storage
      sessionStorage.setItem('deliveryData', JSON.stringify(deliveryData));

      // Create a booking ID if not already present in session storage
      let bookingId = sessionStorage.getItem('bookingId');
      if (!bookingId) {
        bookingId = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('bookingId', bookingId);
      }

      // Make sure we have bookingData in session storage
      if (!sessionStorage.getItem('bookingData') && bookingData) {
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
      }

      // Navigate to payment with bookingId and state
      navigate(`/payment/${bookingId}?eventId=${eventId}`, {
        state: {
          fromDeliveryPage: true,
          deliveryData,
          bookingData
        }
      });

      console.log('Navigating to payment page with state and bookingId:', bookingId);
    } catch (e) {
      console.error("Error saving delivery data:", e);
    }
  };

  if (loading || isEventLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="container mx-auto max-w-4xl py-6 px-4">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold">{t('checkout.noBookingData', 'No booking data found')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('checkout.noBookingDataDesc', 'Please start your booking process from the events page.')}
          </p>
          <Button className="mt-4">
            <Link to="/events" className="w-full h-full flex items-center justify-center">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="mb-6">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Back')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">{t('checkout.deliveryDetails', 'Delivery Details')}</h1>
        <p className="text-muted-foreground">
          {t('checkout.enterDeliveryInfo', 'Enter your delivery information below')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <DeliveryDetailsForm onSubmit={handleSubmit} />
        </div>

        <div className="col-span-1">
          <div className="sticky top-6">
            <OrderSummary bookingData={bookingData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddressPage; 