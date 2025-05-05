import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import seatMapApi, { Seat, SeatMap, SeatReservationRequest } from '@/services/api/seatMapApi';
import { useToast } from '@/hooks/use-toast';
import { useARMode } from '@/hooks/useARMode';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [reservationId, setReservationId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // AR mode
  const { isARSupported, launchARMode } = useARMode();
  const [showARButton, setShowARButton] = useState(false);

  // Check if AR is supported
  useEffect(() => {
    if (enableAR) {
      setShowARButton(isARSupported);
    }
  }, [enableAR, isARSupported]);

  // Calculate total price and selected count
  useEffect(() => {
    if (selectedSeats && selectedSeats.length > 0) {
      const price = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
      setTotalPrice(price);
      setSelectedCount(selectedSeats.length);
    } else {
      setTotalPrice(0);
      setSelectedCount(0);
    }
  }, [selectedSeats]);

  // Fetch seat map data
  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        setLoading(true);
        const response = await seatMapApi.getSeatMapByEventId(eventId);
        const data = response.data.data;
        setSeatMap(data);
        
        // Set the first section as active if there are sections
        if (data.sections && data.sections.length > 0) {
          setActiveSection(data.sections[0].id);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching seat map:', error);
        setError(t('seatMap.errorLoading', 'Error loading seat map. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    fetchSeatMap();

    // Clean up any reservations when component unmounts
    return () => {
      if (reservationId) {
        releaseSeats(reservationId);
      }
    };
  }, [eventId, venueId, t]);

  // Handle seat click
  const handleSeatClick = useCallback(async (seat: Seat) => {
    if (disabled || seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'blocked') {
      return;
    }

    // Check if the seat is already selected
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    let updatedSeats: Seat[];

    try {
      if (isSelected) {
        // Deselect the seat
        updatedSeats = selectedSeats.filter(s => s.id !== seat.id);
        onSeatSelect(updatedSeats);

        // If we have a reservation, release this seat
        if (reservationId) {
          await seatMapApi.releaseReservation(reservationId);
        }
      } else {
        // Reserve the seat first
        const reservationRequest: SeatReservationRequest = {
          seat_ids: [seat.id],
          expiration_time: 10 // 10 minutes lock
        };

        // You may need to pass the seatMapId here, adjust as needed
        const response = await seatMapApi.reserveSeats(eventId, reservationRequest);

        // Set the reservation ID if we got one back
        if (response.data && response.data.data && response.data.data.reservation_id) {
          setReservationId(response.data.data.reservation_id);
        }

        // Add the seat to selection with selected status
        updatedSeats = [...selectedSeats, { ...seat, status: 'selected' }];
        onSeatSelect(updatedSeats);

        // Show selection toast
        toast({
          title: t('seatMap.seatSelected', 'Seat Selected'),
          description: t('seatMap.seatSelectedFor', 'Selected {{seat}} for {{price}}', {
            seat: seat.name,
            price: new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR'
            }).format(seat.price || 0)
          }),
          duration: 3000,
        });
      }

      // Update the local seat map to reflect selection
      if (seatMap) {
        const updatedSeatMap = { ...seatMap };
        updatedSeatMap.sections = updatedSeatMap.sections.map(section => ({
          ...section,
          rows: section.rows.map(row => ({
            ...row,
            seats: row.seats.map(s =>
              s.id === seat.id ? { ...s, status: isSelected ? 'available' : 'selected' } : s
            )
          }))
        }));
        setSeatMap(updatedSeatMap);
      }
    } catch (error) {
      console.error('Error handling seat selection:', error);
      toast({
        title: t('seatMap.selectionError', 'Selection Error'),
        description: t('seatMap.selectionErrorDescription', 'Unable to select this seat. Please try again.'),
        variant: 'destructive',
      });
    }
  }, [selectedSeats, onSeatSelect, disabled, seatMap, reservationId, t, toast, eventId]);

  // Release seats when user navigates away or session expires
  const releaseSeats = async (resId: string) => {
    try {
      await seatMapApi.releaseReservation(resId);
      setReservationId(null);
    } catch (error) {
      console.error('Error releasing seats:', error);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handlePan = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handleARView = () => {
    if (isARSupported) {
      launchARMode({
        eventId,
        venueId,
        seatMap,
        selectedSeats
      });
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
      zoomLevel={zoomLevel}
      pan={pan}
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