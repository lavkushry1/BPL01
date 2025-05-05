import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

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

interface OrderSummaryProps {
  bookingData: BookingData;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ bookingData }) => {
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

export default OrderSummary; 