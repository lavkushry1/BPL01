import React from 'react';
import { Check, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { Seat, SeatStatus } from '../../types';

/**
 * Individual Seat Component
 * Renders a single seat with appropriate styling based on status
 */
interface SeatComponentProps {
  seat: Seat;
  isSelected: boolean;
  disabled: boolean;
  onClick: (seat: Seat) => void;
}

const SeatComponent: React.FC<SeatComponentProps> = ({ 
  seat, 
  isSelected, 
  disabled, 
  onClick 
}) => {
  // Determine seat color based on status
  const getSeatColor = () => {
    if (isSelected) return "bg-blue-500 hover:bg-blue-600";
    
    const status = seat.status as SeatStatus;
    switch (status) {
      case 'available': return "bg-green-500 hover:bg-green-600";
      case 'booked': return "bg-red-500";
      case 'reserved': return "bg-yellow-500";
      case 'locked': return "bg-orange-500";
      case 'blocked': return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  // Determine if seat is disabled/clickable
  const isDisabled = disabled || 
    seat.status === 'booked' || 
    seat.status === 'reserved' || 
    seat.status === 'blocked' || 
    seat.status === 'locked';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "w-8 h-8 rounded-t-md text-xs font-medium text-white transition-colors relative",
              getSeatColor(),
              isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={() => !isDisabled && onClick(seat)}
            disabled={isDisabled}
          >
            {seat.name}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {seat.status === 'locked' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{seat.name} - {formatCurrency(seat.price || 0, 'INR')}</p>
          <p className="text-xs">{isDisabled ? `Status: ${seat.status}` : 'Available'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SeatComponent; 