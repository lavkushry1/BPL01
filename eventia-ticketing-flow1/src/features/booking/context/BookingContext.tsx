import React, { createContext, useContext, useState, useEffect } from 'react';
import { Seat } from '../types';

interface BookingContextType {
  selectedSeats: Seat[];
  totalPrice: number;
  selectedCount: number;
  eventId: string | null;
  venueId: string | null;
  setEventId: (id: string) => void;
  setVenueId: (id: string) => void;
  addSeat: (seat: Seat) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;
  isSeatSelected: (seatId: string) => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

/**
 * Custom hook to use the booking context
 */
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for booking state
 * Manages selected seats and booking-related state
 */
export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  // State
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [eventId, setEventId] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);

  // Calculate total price and selected count when seats change
  useEffect(() => {
    if (selectedSeats.length > 0) {
      const price = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
      setTotalPrice(price);
      setSelectedCount(selectedSeats.length);
    } else {
      setTotalPrice(0);
      setSelectedCount(0);
    }
  }, [selectedSeats]);

  // Add a seat to selection
  const addSeat = (seat: Seat) => {
    if (!selectedSeats.some(s => s.id === seat.id)) {
      setSelectedSeats(prev => [...prev, { ...seat, status: 'selected' }]);
    }
  };

  // Remove a seat from selection
  const removeSeat = (seatId: string) => {
    setSelectedSeats(prev => prev.filter(seat => seat.id !== seatId));
  };

  // Clear all selected seats
  const clearSeats = () => {
    setSelectedSeats([]);
  };

  // Check if a seat is already selected
  const isSeatSelected = (seatId: string): boolean => {
    return selectedSeats.some(seat => seat.id === seatId);
  };

  // Value provided by the context
  const value: BookingContextType = {
    selectedSeats,
    totalPrice,
    selectedCount,
    eventId,
    venueId,
    setEventId,
    setVenueId,
    addSeat,
    removeSeat,
    clearSeats,
    isSeatSelected
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export default BookingContext; 