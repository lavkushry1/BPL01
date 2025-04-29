import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket } from 'lucide-react';

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  availableQuantity: number;
  maxPerOrder?: number;
  features?: string[];
}

export interface SelectedTicket {
  id: string;
  quantity: number;
}

interface TicketSelectorProps {
  ticketTypes: TicketType[];
  selectedTickets: Record<string, number>;
  onTicketChange: (ticketId: string, quantity: number) => void;
  className?: string;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  ticketTypes,
  selectedTickets,
  onTicketChange,
  className
}) => {
  const { t } = useTranslation();
  
  const formatCurrency = (price: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      return total + (quantity * ticket.price);
    }, 0);
  };

  const totalQuantity = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = calculateTotal();

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden", className)}>
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-lg flex items-center">
          <Ticket className="w-5 h-5 mr-2 text-primary" />
          {t('eventDetails.tickets', 'Tickets')}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {ticketTypes.map((ticket) => {
          const quantity = selectedTickets[ticket.id] || 0;
          const isAvailable = ticket.availableQuantity > 0;
          const isMaxReached = quantity >= Math.min(ticket.maxPerOrder || 10, ticket.availableQuantity);
          const isSelected = quantity > 0;
          
          return (
            <div 
              key={ticket.id}
              className={cn(
                "p-4 transition-colors",
                isSelected ? "bg-primary-50" : "",
                !isAvailable ? "opacity-60" : ""
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-medium text-base">{ticket.name}</h4>
                    {ticket.availableQuantity < 10 && (
                      <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200">
                        {t('eventDetails.limitedAvailability', 'Limited')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                  
                  {ticket.features && ticket.features.length > 0 && (
                    <div className="mt-2 space-x-2">
                      {ticket.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {ticket.availableQuantity} {t('eventDetails.available', 'available')}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-lg">{formatCurrency(ticket.price)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-3">
                {isAvailable ? (
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onTicketChange(ticket.id, Math.max(0, quantity - 1))}
                      disabled={quantity === 0}
                    >
                      <span className="sr-only">Decrease</span>
                      <span aria-hidden="true">-</span>
                    </Button>
                    
                    <span className="w-10 text-center font-medium">
                      {quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onTicketChange(ticket.id, quantity + 1)}
                      disabled={isMaxReached}
                    >
                      <span className="sr-only">Increase</span>
                      <span aria-hidden="true">+</span>
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                    {t('events.soldOut', 'Sold Out')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        
        {ticketTypes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>{t('eventDetails.noTicketsAvailable', 'No tickets available at the moment')}</p>
          </div>
        )}
      </div>
      
      {/* Summary */}
      {totalQuantity > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center font-medium">
            <span>{t('eventDetails.total', 'Total')}:</span>
            <span className="text-lg">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {totalQuantity} {totalQuantity === 1 ? t('common.ticket', 'ticket') : t('common.tickets', 'tickets')}
          </div>
        </div>
      )}
    </div>
  );
}; 