import React from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Plus, Minus, Info, MapPin, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import {
  Seat,
  SeatMap,
  SeatSection,
} from '@/services/api/seatMapApi';

// Extended type for seat status that includes all possible values
type SeatStatus = 'available' | 'reserved' | 'booked' | 'blocked' | 'selected' | 'locked';

// Types for the presentational component
export interface SeatMapPresentationProps {
  seatMap: SeatMap | null;
  activeSection: string | null;
  selectedSeats: Seat[];
  loading: boolean;
  error: string | null;
  zoomLevel: number;
  pan: { x: number; y: number };
  totalPrice: number;
  selectedCount: number;
  showLegend: boolean;
  showTotalPrice: boolean;
  showARButton: boolean;
  disabled: boolean;
  onSeatClick: (seat: Seat) => void;
  onSectionChange: (sectionId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (dx: number, dy: number) => void;
  onResetView: () => void;
  onARView?: () => void;
}

/**
 * Seat Status Legend Component
 */
const SeatLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-3 justify-center my-4">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-green-500 mr-2"></div>
        <span className="text-xs">Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-blue-500 mr-2"></div>
        <span className="text-xs">Selected</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-red-500 mr-2"></div>
        <span className="text-xs">Booked</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-yellow-500 mr-2"></div>
        <span className="text-xs">Reserved</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-orange-500 mr-2"></div>
        <span className="text-xs">Locked</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-gray-400 mr-2"></div>
        <span className="text-xs">Blocked</span>
      </div>
    </div>
  );
};

/**
 * Section Tabs Component
 */
interface SectionTabsProps {
  sections: SeatSection[];
  activeSection: string | null;
  onSectionChange: (sectionId: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ sections, activeSection, onSectionChange }) => {
  return (
    <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
      {sections.map((section) => (
        <Button
          key={section.id}
          variant={activeSection === section.id ? "default" : "outline"}
          onClick={() => onSectionChange(section.id)}
          className="whitespace-nowrap"
        >
          {section.name}
        </Button>
      ))}
    </div>
  );
};

/**
 * Individual Seat Component
 */
interface SeatComponentProps {
  seat: Seat;
  isSelected: boolean;
  disabled: boolean;
  onClick: (seat: Seat) => void;
}

const SeatComponent: React.FC<SeatComponentProps> = ({ seat, isSelected, disabled, onClick }) => {
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
    (seat.status as SeatStatus) === 'locked';

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
            {(seat.status as SeatStatus) === 'locked' && (
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

/**
 * Seat Row Component
 */
interface SeatRowProps {
  row: { id: string; name: string; seats: Seat[] };
  selectedSeats: Seat[];
  disabled: boolean;
  onSeatClick: (seat: Seat) => void;
}

const SeatRow: React.FC<SeatRowProps> = ({ row, selectedSeats, disabled, onSeatClick }) => {
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

/**
 * Zoom Controls Component
 */
interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onARView?: () => void;
  showARButton: boolean;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  onZoomIn, 
  onZoomOut, 
  onResetView, 
  onARView, 
  showARButton 
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <Button size="icon" variant="outline" onClick={onZoomIn}>
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onZoomOut}>
        <Minus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onResetView}>
        <MapPin className="h-4 w-4" />
      </Button>
      {showARButton && onARView && (
        <Button size="icon" variant="outline" onClick={onARView}>
          <span className="font-bold">AR</span>
        </Button>
      )}
    </div>
  );
};

/**
 * Summary Footer Component
 */
interface SummaryFooterProps {
  totalPrice: number;
  selectedCount: number;
}

const SummaryFooter: React.FC<SummaryFooterProps> = ({ totalPrice, selectedCount }) => {
  return (
    <div className="p-4 bg-muted rounded-md mt-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">Selected Seats</p>
          <p className="text-2xl font-bold">{selectedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Total Price</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice, 'INR')}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <div className="flex gap-1">
              {Array(10).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <Skeleton className="h-16 w-full" />
    </div>
  );
};

/**
 * Error Message Component
 */
interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-800">Error loading seat map</h3>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main SeatMapPresentation Component
 */
const SeatMapPresentation: React.FC<SeatMapPresentationProps> = ({
  seatMap,
  activeSection,
  selectedSeats,
  loading,
  error,
  zoomLevel,
  pan,
  totalPrice,
  selectedCount,
  showLegend,
  showTotalPrice,
  showARButton,
  disabled,
  onSeatClick,
  onSectionChange,
  onZoomIn,
  onZoomOut,
  onPan,
  onResetView,
  onARView,
}) => {
  // Find the active section data
  const activeSectionData = seatMap?.sections.find(section => section.id === activeSection);
  
  // Render loading state
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  // Render error state
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Render empty state
  if (!seatMap || !seatMap.sections || seatMap.sections.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">No seat map available</h3>
            <p className="text-sm text-yellow-700">This event doesn't have a seat map or it hasn't been configured yet.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <SectionTabs 
        sections={seatMap.sections} 
        activeSection={activeSection} 
        onSectionChange={onSectionChange} 
      />
      
      {/* Seat Map */}
      <div 
        className="relative bg-gray-100 rounded-lg p-4 overflow-hidden"
        style={{ height: '400px' }}
      >
        <div 
          className="h-full overflow-auto relative" 
          style={{ 
            transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}
        >
          {activeSectionData && (
            <div className="min-w-max">
              <h3 className="text-lg font-bold mb-4 text-center">{activeSectionData.name}</h3>
              <div className="space-y-2">
                {activeSectionData.rows.map((row) => (
                  <SeatRow
                    key={row.id}
                    row={row}
                    selectedSeats={selectedSeats}
                    disabled={disabled}
                    onSeatClick={onSeatClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Zoom Controls */}
        <ZoomControls
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetView={onResetView}
          onARView={onARView}
          showARButton={showARButton}
        />
      </div>
      
      {/* Legend */}
      {showLegend && <SeatLegend />}
      
      {/* Summary */}
      {showTotalPrice && selectedCount > 0 && (
        <SummaryFooter totalPrice={totalPrice} selectedCount={selectedCount} />
      )}
    </div>
  );
};

export default SeatMapPresentation; 