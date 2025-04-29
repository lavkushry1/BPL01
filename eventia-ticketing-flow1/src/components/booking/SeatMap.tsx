/**
 * @component SeatMap
 * @description Interactive seat selection component for venue seating.
 * Displays a visual representation of seats with their availability status.
 * Supports RTL languages and accessibility features.
 * 
 * @apiDependencies
 * - GET /api/venues/{venueId}/sections/{sectionId}/seats - Fetches seat data
 * - PUT /api/seats/reserve - Temporarily reserves selected seats
 * 
 * @requiredProps
 * - venueId (string) - ID of the venue
 * - sectionId (string) - ID of the section within the venue
 * - onSeatSelect (function) - Callback when seats are selected/deselected
 * - selectedSeats (Seat[]) - Array of currently selected seats
 * 
 * @stateManagement
 * - Tracks all seats and their status (available, booked, locked, selected)
 * - Updates seat status on selection/deselection
 * - Connects to websocket for real-time seat status updates
 * 
 * @dataModel
 * Seat:
 * - id: string
 * - row: string
 * - number: number
 * - status: 'available' | 'booked' | 'locked' | 'selected'
 * - price: number
 * - category: string
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, Minus, Info, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface Seat {
  id: string;
  row: string;
  number: number;
  status: 'available' | 'booked' | 'locked' | 'selected';
  price: number;
  category: string;
}

interface SeatMapProps {
  venueId: string;
  sectionId: string;
  onSeatSelect: (seats: Seat[]) => void;
  selectedSeats: Seat[];
  disabled?: boolean;
  showLegend?: boolean;
  showTotalPrice?: boolean;
}

// Function to format price based on locale
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Mock seats data - in a real app, this would come from API
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const statuses: ('available' | 'booked')[] = ['available', 'available', 'available', 'booked'];
  
  rows.forEach(row => {
    for (let i = 1; i <= 12; i++) {
      // Skip some seats to create walking space
      if ((row === 'D' || row === 'E') && (i === 6 || i === 7)) continue;
      
      // Randomly assign some seats as booked
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const seat: Seat = {
        id: `${row}${i}`,
        row,
        number: i,
        status: randomStatus,
        price: row <= 'C' ? 5000 : 3000,
        category: row <= 'C' ? 'Premium' : 'Standard'
      };
      seats.push(seat);
    }
  });
  return seats;
};

const SeatMap: React.FC<SeatMapProps> = ({ 
  venueId, 
  sectionId, 
  onSeatSelect, 
  selectedSeats,
  disabled = false,
  showLegend = true,
  showTotalPrice = true
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  // Calculate total price and selected count
  useEffect(() => {
    if (selectedSeats && selectedSeats.length > 0) {
      const price = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      setTotalPrice(price);
      setSelectedCount(selectedSeats.length);
    } else {
      setTotalPrice(0);
      setSelectedCount(0);
    }
  }, [selectedSeats]);

  useEffect(() => {
    // In a real app, fetch seats from API
    const fetchSeats = async () => {
      try {
        setLoading(true);
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const seatsData = generateSeats();
        setSeats(seatsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching seats:', error);
        setError(t('seatMap.errorLoading', 'Error loading seat map. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
    
    // Setup polling for seat status updates (to simulate real-time)
    const intervalId = setInterval(() => {
      setSeats(prevSeats => {
        return prevSeats.map(seat => {
          // Don't change selected seats
          if (selectedSeats.some(s => s.id === seat.id)) return seat;
          
          // Simulate random locks/unlocks from other users
          if (Math.random() > 0.97) {
            return {
              ...seat,
              status: seat.status === 'locked' ? 'available' : (seat.status === 'available' ? 'locked' : seat.status)
            };
          }
          return seat;
        });
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [venueId, sectionId, selectedSeats, t]);

  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'locked' || disabled) return;

    const isSelected = selectedSeats.some(s => s.id === seat.id);
    let updatedSeats: Seat[];

    if (isSelected) {
      // Deselect the seat
      updatedSeats = selectedSeats.filter(s => s.id !== seat.id);
    } else {
      // Select the seat
      const seatToAdd: Seat = { ...seat, status: 'selected' };
      updatedSeats = [...selectedSeats, seatToAdd];
    }

    onSeatSelect(updatedSeats);
    
    // Update the seat map
    setSeats(prevSeats => 
      prevSeats.map(s => 
        s.id === seat.id 
          ? { ...s, status: isSelected ? 'available' : 'selected' } 
          : s
      )
    );
  }, [selectedSeats, onSeatSelect, disabled]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 96 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {t('common.tryAgain', 'Try Again')}
        </Button>
      </div>
    );
  }

  const getSeatsForRow = (row: string) => seats.filter(seat => seat.row === row);
  const rows = Array.from(new Set(seats.map(seat => seat.row))).sort();

  return (
    <div className="space-y-4">
      {showLegend && (
        <div className="p-3 bg-muted/40 rounded-md">
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
              <span>{t('seatMap.available', 'Available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span>{t('seatMap.selected', 'Selected')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
              <span>{t('seatMap.locked', 'Locked')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
              <span>{t('seatMap.booked', 'Booked')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-200 p-3 text-center rounded-lg text-sm flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4" />
        {t('seatMap.stage', 'STAGE')}
      </div>

      <div className={cn("space-y-1 overflow-x-auto", isRTL ? "rtl" : "ltr")}>
        {rows.map(row => (
          <div key={row} className="flex justify-center gap-1 min-w-max pb-1">
            <div className="w-6 flex items-center justify-center font-bold">{row}</div>
            
            {getSeatsForRow(row).map(seat => {
              const isSelected = selectedSeats.some(s => s.id === seat.id);
              
              let seatColor = '';
              switch(seat.status) {
                case 'booked':
                  seatColor = 'bg-gray-400 cursor-not-allowed';
                  break;
                case 'locked':
                  seatColor = 'bg-yellow-500 cursor-not-allowed';
                  break;
                case 'selected':
                  seatColor = 'bg-blue-500 hover:bg-blue-600';
                  break;
                default:
                  seatColor = seat.category === 'Premium' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-green-500 hover:bg-green-600';
              }
              
              if (isSelected) {
                seatColor = 'bg-blue-500 hover:bg-blue-600';
              }

              const seatTooltip = `${row}${seat.number} - ${seat.category} - ${formatPrice(seat.price)}`;
              
              return (
                <TooltipProvider key={seat.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        className={cn(
                          "w-8 h-8 p-0 m-0 flex items-center justify-center text-xs rounded-sm transition-all",
                          seatColor,
                          isSelected && "ring-2 ring-white"
                        )}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === 'booked' || seat.status === 'locked' || disabled}
                        aria-label={`Seat ${row}${seat.number}, ${seat.category}, ${formatPrice(seat.price)}, ${
                          seat.status === 'booked' 
                            ? 'Already booked' 
                            : seat.status === 'locked' 
                              ? 'Temporarily unavailable'
                              : isSelected 
                                ? 'Selected' 
                                : 'Available'
                        }`}
                      >
                        {seat.number}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs px-2 py-1">
                      {seatTooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            
            <div className="w-6 flex items-center justify-center font-bold">{row}</div>
          </div>
        ))}
      </div>

      {showTotalPrice && selectedCount > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">
                  {selectedCount} {selectedCount === 1 ? t('common.seat', 'Seat') : t('common.seats', 'Seats')}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({selectedSeats.map(s => `${s.row}${s.number}`).join(', ')})
                </span>
              </div>
              <div className="font-bold text-lg">{formatPrice(totalPrice)}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default SeatMap;
