import React from 'react';
import SeatComponent from './SeatComponent';
import { Seat, SeatRow as SeatRowType } from '../../types';

/**
 * Seat Row Component
 * Renders a row of seats with a label
 */
interface SeatRowProps {
  row: SeatRowType;
  selectedSeats: Seat[];
  disabled: boolean;
  onSeatClick: (seat: Seat) => void;
}

const SeatRow: React.FC<SeatRowProps> = ({ 
  row, 
  selectedSeats, 
  disabled, 
  onSeatClick 
}) => {
  return (
    <div className="flex items-center mb-2 gap-2">
      <div className="w-8 text-center text-xs font-medium">{row.name}</div>
      <div className="flex gap-1">
        {row.seats.map((seat) => (
          <SeatComponent
            key={seat.id}
            seat={seat}
            isSelected={selectedSeats.some(s => s.id === seat.id)}
            disabled={disabled}
            onClick={onSeatClick}
          />
        ))}
      </div>
    </div>
  );
};

export default SeatRow; 