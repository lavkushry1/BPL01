import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Info, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  maxPerOrder: number;
  features?: string[];
}

interface TicketSelectorProps {
  tickets: TicketType[];
  selectedTickets: Record<string, number>;
  onTicketQuantityChange: (ticketId: string, quantity: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  onCalculateTotal?: () => { ticketCount: number; totalAmount: number };
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  tickets,
  selectedTickets,
  onTicketQuantityChange,
  isLoading = false,
  disabled = false,
  onCalculateTotal
}) => {
  const { t } = useTranslation();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const incrementQuantity = (ticketId: string, currentQty: number, maxQty: number) => {
    if (disabled) return;
    if (currentQty < maxQty) {
      onTicketQuantityChange(ticketId, currentQty + 1);
    }
  };

  const decrementQuantity = (ticketId: string, currentQty: number) => {
    if (disabled) return;
    if (currentQty > 0) {
      onTicketQuantityChange(ticketId, currentQty - 1);
    }
  };

  const getTotalDetails = () => {
    if (onCalculateTotal) {
      return onCalculateTotal();
    }
    
    // Default calculation if no calculation function provided
    let ticketCount = 0;
    let totalAmount = 0;
    
    tickets.forEach(ticket => {
      const quantity = selectedTickets[ticket.id] || 0;
      ticketCount += quantity;
      totalAmount += quantity * ticket.price;
    });
    
    return { ticketCount, totalAmount };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-center p-6">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <p className="text-center text-gray-500">
          {t('events.noTicketsAvailable', 'No tickets available for this event.')}
        </p>
      </div>
    );
  }

  const { ticketCount, totalAmount } = getTotalDetails();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-lg flex items-center">
          <Ticket className="w-5 h-5 mr-2 text-primary" />
          {t('eventDetails.tickets', 'Tickets')}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {tickets.map((ticket) => {
          const quantity = selectedTickets[ticket.id] || 0;
          const isAvailable = ticket.availableQuantity > 0;
          const isMaxReached = quantity >= Math.min(ticket.maxPerOrder, ticket.availableQuantity);
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
              
              <div className="flex justify-end items-center mt-3">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => decrementQuantity(ticket.id, quantity)}
                    disabled={quantity === 0 || disabled || !isAvailable}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => incrementQuantity(ticket.id, quantity, ticket.maxPerOrder)}
                    disabled={isMaxReached || disabled || !isAvailable}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-2 text-right">
                  <div className="text-sm font-medium text-gray-600">
                    {quantity} × {formatCurrency(ticket.price)} = {formatCurrency(quantity * ticket.price)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <AnimatePresence>
        {ticketCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-600">
                  {ticketCount} {ticketCount === 1 ? t('common.ticket', 'Ticket') : t('common.tickets', 'Tickets')}
                </div>
                <div className="font-bold text-xl">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 