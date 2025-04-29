/**
 * @component BookingModal
 * @description Modal for selecting ticket quantities and proceeding to checkout.
 * Allows users to select from different ticket categories with pricing and availability info.
 * 
 * @apiDependencies
 * - None (uses sessionStorage for data persistence)
 * 
 * @requiredProps
 * - isOpen (boolean) - Controls modal visibility
 * - onClose (function) - Callback to close the modal
 * - eventTitle (string) - Title of the event being booked
 * - ticketTypes (TicketType[]) - Array of available ticket types with category, price, and availability
 * 
 * @stateManagement
 * - Tracks ticket selection quantities
 * - Calculates total tickets and amount
 * - Stores booking data in sessionStorage for use in checkout
 * 
 * @navigationFlow
 * - On "Proceed to Checkout", navigates to /checkout page
 * - Passes data via sessionStorage instead of state or API
 * 
 * @dataModel
 * Stores:
 * - eventTitle: string
 * - tickets: {category, quantity, price, subtotal}[]
 * - totalAmount: number
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface TicketType {
  category: string;
  price: number;
  available: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  ticketTypes: TicketType[];
}

const BookingModal = ({ isOpen, onClose, eventTitle, ticketTypes }: BookingModalProps) => {
  const navigate = useNavigate();
  const [ticketSelections, setTicketSelections] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map(ticket => [ticket.category, 0]))
  );
  
  const handleIncrement = (category: string) => {
    const ticket = ticketTypes.find(t => t.category === category);
    if (!ticket) return;
    
    if (ticketSelections[category] < ticket.available) {
      setTicketSelections({
        ...ticketSelections,
        [category]: ticketSelections[category] + 1
      });
    }
  };
  
  const handleDecrement = (category: string) => {
    if (ticketSelections[category] > 0) {
      setTicketSelections({
        ...ticketSelections,
        [category]: ticketSelections[category] - 1
      });
    }
  };
  
  const calculateTotal = () => {
    return ticketTypes.reduce((total, ticket) => {
      return total + (ticketSelections[ticket.category] * ticket.price);
    }, 0);
  };

  const totalTickets = Object.values(ticketSelections).reduce((sum, count) => sum + count, 0);
  const totalAmount = calculateTotal();
  
  const handleProceedToCheckout = async () => {
    if (totalTickets === 0) {
      toast({
        title: 'No tickets selected',
        description: 'Please select at least one ticket to proceed.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          eventId: 'EVENT_123', // TODO: Replace with actual event ID
          tickets: ticketSelections
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }

      const { reservationId, paymentDeadline } = await response.json();
      navigate(`/checkout?reservationId=${reservationId}`);
      onClose();

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Tickets for {eventTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            {ticketTypes.map((ticket) => (
              <div key={ticket.category} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="font-medium">{ticket.category}</div>
                  <div className="text-sm text-gray-500">₹{ticket.price}</div>
                  <div className="text-xs text-gray-400">Available: {ticket.available}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleDecrement(ticket.category)}
                    disabled={ticketSelections[ticket.category] === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-6 text-center">{ticketSelections[ticket.category]}</span>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleIncrement(ticket.category)}
                    disabled={ticketSelections[ticket.category] >= ticket.available}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {totalTickets > 0 && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between font-medium">
                <span>Total Tickets:</span>
                <span>{totalTickets}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span>Total Amount:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleProceedToCheckout}
            disabled={totalTickets === 0}
          >
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;