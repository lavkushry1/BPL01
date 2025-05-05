import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import seatMapApi from '@/services/api/seatMapApi';
import { Seat, SeatMap, SeatReservationRequest, ViewState } from '../types';

interface UseSeatMapOptions {
  eventId: string;
  venueId: string;
  onSeatSelect?: (seats: Seat[]) => void;
}

interface UseSeatMapReturn {
  seatMap: SeatMap | null;
  loading: boolean;
  error: string | null;
  activeSection: string | null;
  selectedSeats: Seat[];
  viewState: ViewState;
  totalPrice: number;
  selectedCount: number;
  reservationId: string | null;
  handleSeatClick: (seat: Seat) => Promise<void>;
  setActiveSection: (sectionId: string) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePan: (dx: number, dy: number) => void;
  resetView: () => void;
}

/**
 * Custom hook for seat map functionality
 * Handles all seat map business logic and API interactions
 */
export function useSeatMap({
  eventId,
  venueId,
  onSeatSelect
}: UseSeatMapOptions): UseSeatMapReturn {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [viewState, setViewState] = useState<ViewState>({
    zoomLevel: 1,
    pan: { x: 0, y: 0 }
  });
  const [reservationId, setReservationId] = useState<string | null>(null);

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

  // Release seats when user navigates away or session expires
  const releaseSeats = async (resId: string) => {
    try {
      await seatMapApi.releaseReservation(resId);
      setReservationId(null);
    } catch (error) {
      console.error('Error releasing seats:', error);
    }
  };

  // Handle seat click
  const handleSeatClick = useCallback(async (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'blocked') {
      return;
    }

    // Check if the seat is already selected
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    let updatedSeats: Seat[];

    try {
      if (isSelected) {
        // Deselect the seat
        updatedSeats = selectedSeats.filter(s => s.id !== seat.id);
        setSelectedSeats(updatedSeats);
        if (onSeatSelect) onSeatSelect(updatedSeats);

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

        const response = await seatMapApi.reserveSeats(eventId, reservationRequest);

        // Set the reservation ID if we got one back
        if (response.data && response.data.data && response.data.data.reservation_id) {
          setReservationId(response.data.data.reservation_id);
        }

        // Add the seat to selection with selected status
        updatedSeats = [...selectedSeats, { ...seat, status: 'selected' }];
        setSelectedSeats(updatedSeats);
        if (onSeatSelect) onSeatSelect(updatedSeats);

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
  }, [selectedSeats, onSeatSelect, seatMap, reservationId, t, toast, eventId]);

  // View control handlers
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel + 0.2, 2.5)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel - 0.2, 0.5)
    }));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setViewState(prev => ({
      ...prev,
      pan: { x: prev.pan.x + dx, y: prev.pan.y + dy }
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewState({
      zoomLevel: 1,
      pan: { x: 0, y: 0 }
    });
  }, []);

  return {
    seatMap,
    loading,
    error,
    activeSection,
    selectedSeats,
    viewState,
    totalPrice,
    selectedCount,
    reservationId,
    handleSeatClick,
    setActiveSection,
    handleZoomIn,
    handleZoomOut,
    handlePan,
    resetView
  };
} 