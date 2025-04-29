/**
 * @component SeatMap
 * @description Interactive seat selection component for venue seating.
 * Displays a visual representation of seats with their availability status.
 * Note: Currently uses mock data; in production would fetch from an API.
 * 
 * @apiDependencies
 * - None yet (uses mock data - should be replaced with API call)
 * - Future implementation would need:
 *   - GET seats by venue and section
 *   - PUT/PATCH to update seat status when selected
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
 * - Simulates seat status changes (for demo purposes)
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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface Seat {
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
}

// Mock seats data - in a real app, this would come from API
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const statuses: ('available' | 'booked')[] = ['available', 'available', 'available', 'booked'];
  
  rows.forEach(row => {
    for (let i = 1; i <= 10; i++) {
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

const SeatMap: React.FC<SeatMapProps> = ({ venueId, sectionId, onSeatSelect, selectedSeats }) => {
  const { t } = useTranslation();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch seats from API
    const fetchSeats = async () => {
      try {
        setLoading(true);
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const seatsData = generateSeats();
        setSeats(seatsData);
      } catch (error) {
        console.error('Error fetching seats:', error);
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
  }, [venueId, sectionId, selectedSeats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'locked') return;

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSeatsForRow = (row: string) => seats.filter(seat => seat.row === row);
  const rows = Array.from(new Set(seats.map(seat => seat.row))).sort();

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Section {sectionId}</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-sm mr-2"></div>
            <span>Locked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-sm mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 p-2 text-center mb-8 rounded-lg">STAGE</div>

      <div className="space-y-2">
        {rows.map(row => (
          <div key={row} className="flex justify-center gap-1">
            <div className="w-6 flex items-center justify-center font-bold">{row}</div>
            {getSeatsForRow(row).map(seat => (
              <Button
                key={seat.id}
                className={`w-8 h-8 p-0 flex items-center justify-center text-xs rounded-sm ${
                  seat.status === 'booked' ? 'bg-gray-400 cursor-not-allowed' :
                  seat.status === 'locked' ? 'bg-yellow-500 cursor-not-allowed' :
                  seat.status === 'selected' ? 'bg-blue-500' :
                  'bg-green-500 hover:bg-green-600'
                }`}
                onClick={() => handleSeatClick(seat)}
                disabled={seat.status === 'booked' || seat.status === 'locked'}
              >
                {seat.number}
              </Button>
            ))}
            <div className="w-6 flex items-center justify-center font-bold">{row}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="border rounded-md p-4">
          <h4 className="font-semibold mb-2">Selected Seats</h4>
          {selectedSeats.length === 0 ? (
            <p className="text-gray-500">No seats selected</p>
          ) : (
            <div>
              <div className="space-y-2">
                {selectedSeats.map(seat => (
                  <div key={seat.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 text-white w-6 h-6 rounded-sm flex items-center justify-center text-xs">
                        {seat.row}{seat.number}
                      </div>
                      <span>{seat.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">₹{seat.price}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleSeatClick(seat)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="font-bold text-lg">
                    ₹{selectedSeats.reduce((sum, seat) => sum + seat.price, 0)}
                  </div>
                </div>
                <Button>
                  <Check className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
