/**
 * @component BookingModal
 * @description Modal for selecting ticket quantities and proceeding to checkout.
 * Allows users to select from different ticket categories with pricing and availability info.
 *
 * @apiDependencies
 * - POST /api/reservations - Creates a new ticket reservation
 *
 * @requiredProps
 * - isOpen (boolean) - Controls modal visibility
 * - onClose (function) - Callback to close the modal
 * - eventTitle (string) - Title of the event being booked
 * - ticketTypes (TicketType[]) - Array of available ticket types with category, price, and availability
 *
 * @stateManagement
 * - Uses React Hook Form for form state management
 * - Zod for form validation
 * - Tracks ticket selection quantities
 * - Calculates total tickets and amount
 * - Stores booking data in sessionStorage for use in checkout
 *
 * @navigationFlow
 * - On "Proceed to Checkout", navigates to /booking/delivery page
 * - Passes data via sessionStorage and URL parameter (reservationId)
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

interface TicketType {
  category: string;
  price: number;
  available: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  ticketTypes: TicketType[];
}

// API response types
interface ReservationResponse {
  reservationId: string;
  paymentDeadline: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// API error types
interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Define validation schema
const createBookingSchema = (ticketTypes: TicketType[]) => {
  return z.object({
    tickets: z.record(z.string(), z.number().min(0).max(10, "Maximum 10 tickets per category"))
  })
  .refine(
    data => {
      const totalTickets = Object.values(data.tickets).reduce((sum, qty) => sum + qty, 0);
      return totalTickets > 0;
    },
    {
      message: "Please select at least one ticket",
      path: ["tickets"]
    }
  )
  .refine(
    data => {
      const totalTickets = Object.values(data.tickets).reduce((sum, qty) => sum + qty, 0);
      return totalTickets <= 20;
    },
    {
      message: "Maximum 20 tickets per booking",
      path: ["tickets"]
    }
  )
  .refine(
    data => {
      // Validate that requested tickets do not exceed availability
      let isValid = true;

      for (const ticket of ticketTypes) {
        const requestedQty = data.tickets[ticket.category] || 0;
        if (requestedQty > ticket.available) {
          isValid = false;
          break;
        }
      }

      return isValid;
    },
    {
      message: "One or more ticket types exceed available quantity",
      path: ["tickets"]
    }
  );
};

type BookingFormValues = z.infer<ReturnType<typeof createBookingSchema>>;

const BookingModal = ({ isOpen, onClose, eventId, eventTitle, ticketTypes }: BookingModalProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with React Hook Form
  const bookingSchema = createBookingSchema(ticketTypes);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      tickets: Object.fromEntries(ticketTypes.map(ticket => [ticket.category, 0]))
    }
  });

  const ticketValues = watch('tickets');

  const handleIncrement = (category: string) => {
    const ticket = ticketTypes.find(t => t.category === category);
    if (!ticket) return;

    const currentValue = ticketValues[category] || 0;
    if (currentValue < ticket.available) {
      setValue(`tickets.${category}`, currentValue + 1, { shouldValidate: true });
    }
  };

  const handleDecrement = (category: string) => {
    const currentValue = ticketValues[category] || 0;
    if (currentValue > 0) {
      setValue(`tickets.${category}`, currentValue - 1, { shouldValidate: true });
    }
  };

  // Calculate totals for display
  const totalTickets = Object.values(ticketValues).reduce((sum, count) => sum + (count || 0), 0);
  const totalAmount = ticketTypes.reduce((total, ticket) => {
    return total + ((ticketValues[ticket.category] || 0) * ticket.price);
  }, 0);

  const onSubmit = async (data: BookingFormValues) => {
    // Clear any previous form errors
    clearErrors();
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          eventId: eventId,
          tickets: data.tickets,
          totalAmount: totalAmount
        })
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();

        // Handle validation errors from API
        if (errorData.details) {
          Object.entries(errorData.details).forEach(([field, messages]) => {
            if (field.startsWith('tickets.')) {
              const category = field.replace('tickets.', '');
              setError(`tickets.${category}` as any, {
                type: 'server',
                message: messages[0]
              });
            } else {
              setError('root', {
                type: 'server',
                message: messages[0]
              });
            }
          });
        } else {
          throw new Error(errorData.message || 'Failed to create reservation');
        }
        return;
      }

      const { reservationId, paymentDeadline } = await response.json() as ReservationResponse;

      // Store booking data in sessionStorage
      const bookingData = {
        eventId: eventId,
        eventTitle: eventTitle,
        eventDate: '2025-06-15', // TODO: Pass as prop for real event data
        eventTime: '19:00', // TODO: Pass as prop for real event data
        venue: 'Venue Name', // TODO: Pass as prop for real event data
        tickets: Object.entries(data.tickets).map(([category, quantity]) => {
          const ticketType = ticketTypes.find(t => t.category === category);
          return {
            category,
            quantity,
            price: ticketType?.price || 0,
            subtotal: (ticketType?.price || 0) * quantity
          };
        }).filter(t => t.quantity > 0),
        totalAmount: totalAmount,
        paymentDeadline
      };

      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

      // Show success toast
      toast({
        title: 'Reservation created',
        description: 'Your ticket reservation was successful!',
        variant: 'default',
      });

      // Navigate to delivery address page
      navigate(`/booking/delivery?reservationId=${reservationId}`);
      onClose();

    } catch (error) {
      console.error('Checkout error:', error);

      if (error instanceof Error) {
        // Set form-level error
        setError('root', {
          type: 'server',
          message: error.message
        });

        // Also show toast for visibility
        toast({
          title: 'Checkout failed',
          description: error.message,
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's a form-level (root) error, display it
  const formError = errors.root?.message;

  // Check if any ticket category has an error
  const hasTicketErrors = Object.keys(errors).some(key => key.startsWith('tickets.'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{eventTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form-level error message */}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="py-4">
            <div className="space-y-4 md:space-y-3">
              {ticketTypes.map((ticket) => {
                const fieldError = errors.tickets?.[ticket.category]?.message;

                return (
                  <div
                    key={ticket.category}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md gap-2 ${
                      fieldError ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{ticket.category}</div>
                      <div className="text-sm text-gray-500">₹{ticket.price}</div>
                      <div className="text-xs text-gray-400">Available: {ticket.available}</div>

                      {fieldError && (
                        <p className="text-red-500 text-xs mt-1">
                          {String(fieldError)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={() => handleDecrement(ticket.category)}
                        disabled={!ticketValues[ticket.category]}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <span className="w-6 text-center">{ticketValues[ticket.category] || 0}</span>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={() => handleIncrement(ticket.category)}
                        disabled={ticketValues[ticket.category] >= ticket.available}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Ticket selection error that's not tied to a specific category */}
              {errors.tickets && !hasTicketErrors && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.tickets.message}
                </p>
              )}
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={totalTickets === 0 || isSubmitting}
              className="w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
