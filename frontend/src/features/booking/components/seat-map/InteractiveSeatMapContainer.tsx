import React from 'react';
import { useARMode } from '@/hooks/useARMode';
import { Seat } from '../../types';
import { useSeatMap } from '../../hooks/useSeatMap';
import SeatMapPresentation from './SeatMapPresentation';

export interface InteractiveSeatMapContainerProps {
  eventId: string;
  venueId: string;
  onSeatSelect: (seats: Seat[]) => void;
  selectedSeats: Seat[];
  disabled?: boolean;
  showLegend?: boolean;
  showTotalPrice?: boolean;
  enableAR?: boolean;
}

/**
 * Container component for the Interactive Seat Map
 * Handles all business logic, API calls, and state management
 */
const InteractiveSeatMapContainer: React.FC<InteractiveSeatMapContainerProps> = ({
  eventId,
  venueId,
  onSeatSelect,
  selectedSeats,
  disabled = false,
  showLegend = true,
  showTotalPrice = true,
  enableAR = true
}) => {
  // AR mode
  const { isARSupported, launchARMode } = useARMode();
  const [showARButton, setShowARButton] = React.useState(false);

  // Use the custom hook for seat map functionality
  const {
    seatMap,
    loading,
    error,
    activeSection,
    viewState,
    totalPrice,
    selectedCount,
    handleSeatClick,
    setActiveSection,
    handleZoomIn,
    handleZoomOut,
    handlePan,
    resetView
  } = useSeatMap({
    eventId,
    venueId,
    onSeatSelect
  });

  // Check if AR is supported
  React.useEffect(() => {
    if (enableAR) {
      setShowARButton(isARSupported);
    }
  }, [enableAR, isARSupported]);

  // Handler for AR view
  const handleARView = () => {
    if (isARSupported && seatMap) {
      // Call launchARMode with the required parameters
      launchARMode(eventId, venueId);
    }
  };

  // Render using the presentational component
  return (
    <SeatMapPresentation
      seatMap={seatMap}
      activeSection={activeSection}
      selectedSeats={selectedSeats}
      loading={loading}
      error={error}
      zoomLevel={viewState.zoomLevel}
      pan={viewState.pan}
      totalPrice={totalPrice}
      selectedCount={selectedCount}
      showLegend={showLegend}
      showTotalPrice={showTotalPrice}
      showARButton={showARButton}
      disabled={disabled}
      onSeatClick={handleSeatClick}
      onSectionChange={setActiveSection}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onPan={handlePan}
      onResetView={resetView}
      onARView={handleARView}
    />
  );
};

export default InteractiveSeatMapContainer; 