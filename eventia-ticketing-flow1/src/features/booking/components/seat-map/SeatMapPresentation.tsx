import React from 'react';
import { Info } from 'lucide-react';
import { Seat, SeatMap } from '../../types';
import SeatLegend from './SeatLegend';
import SectionTabs from './SectionTabs';
import SeatRow from './SeatRow';
import ZoomControls from './ZoomControls';
import SummaryFooter from './SummaryFooter';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';

/**
 * Props for the SeatMapPresentation component
 */
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
 * Main SeatMapPresentation Component
 * Pure presentational component that renders the seat map UI
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