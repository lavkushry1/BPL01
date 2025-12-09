import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
import seatMapApi, {
  Seat,
  SeatMap,
  SeatSection,
  SeatReservationRequest
} from '@/services/api/seatMapApi';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { useARMode } from '@/hooks/useARMode';

interface InteractiveSeatMapProps {
  eventId: string;
  venueId: string;
  onSeatSelect: (seats: Seat[]) => void;
  selectedSeats: Seat[];
  disabled?: boolean;
  showLegend?: boolean;
  showTotalPrice?: boolean;
  enableAR?: boolean;
}

const InteractiveSeatMap: React.FC<InteractiveSeatMapProps> = ({
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
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
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
        // For now, let's assume eventId is used as seatMapId
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
            price: formatCurrency(seat.price || 0, 'INR')
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
  }, [selectedSeats, onSeatSelect, disabled, seatMap, reservationId, t, toast]);

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

  // Reset zoom and pan
  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle AR view
  const handleARView = () => {
    if (isARSupported) {
      launchARMode(eventId, venueId);
    } else {
      toast({
        title: t('seatMap.arNotSupported', 'AR Not Supported'),
        description: t('seatMap.arNotSupportedDesc', 'Your device or browser does not support AR.'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1">
          {Array.from({ length: 48 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
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

  if (!seatMap) {
    return (
      <div className="p-4 bg-muted rounded-md text-center">
        {t('seatMap.noSeatMap', 'No seat map available for this event.')}
      </div>
    );
  }

  // Get the active section
  const activeSectionData = seatMap.sections.find(section => section.id === activeSection);

  return (
    <div className="space-y-4 select-none">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl font-semibold">{t('seatMap.title', 'Select Your Seats')}</h2>

        {showARButton && (
          <Button variant="outline" size="sm" onClick={handleARView} className="flex items-center gap-1">
            <MapPin size={16} />
            {t('seatMap.viewInAR', 'View in AR')}
          </Button>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {seatMap.sections.map((section) => (
          <Button
            key={section.id}
            variant={section.id === activeSection ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => setActiveSection(section.id)}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: section.color || 'currentColor' }}
            ></div>
            {section.name}
          </Button>
        ))}
      </div>

      {showLegend && (
        <div className="p-2 bg-muted/40 rounded-md text-sm">
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
              <span>{t('seatMap.available', 'Available')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span>{t('seatMap.selected', 'Selected')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
              <span>{t('seatMap.reserved', 'Reserved')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
              <span>{t('seatMap.unavailable', 'Unavailable')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage Area */}
      <div className="w-full bg-gray-800 text-white py-2 rounded-md mb-4 text-center">
        {t('seatMap.stage', 'STAGE')}
      </div>

      {/* Zoom Controls */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
            <Minus size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={resetView}>
            <MapPin size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2.5}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => handlePan(-20, 0)}>
            <ArrowLeft size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handlePan(0, -20)}>
            <ArrowLeft size={16} className="rotate-90" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handlePan(0, 20)}>
            <ArrowRight size={16} className="rotate-90" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handlePan(20, 0)}>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* Seat Map */}
      <div
        ref={mapContainerRef}
        className="relative overflow-hidden border border-border rounded-md"
        style={{ height: '400px' }}
      >
        <motion.div
          className="absolute"
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
          }}
        >
          {activeSectionData && (
            <div className="p-4">
              {activeSectionData.rows.map((row) => (
                <div key={row.id} className="flex items-center mb-3">
                  <div className="w-6 text-center font-medium mr-2">{row.name}</div>
                  <div className="flex gap-1">
                    {row.seats.map((seat) => {
                      const isSelected = selectedSeats.some(s => s.id === seat.id);

                      return (
                        <TooltipProvider key={seat.id}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSeatClick(seat)}
                                className={cn(
                                  "w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center transition-colors relative",
                                  {
                                    'bg-green-500 hover:bg-green-600 text-white': seat.status === 'available',
                                    'bg-blue-500 hover:bg-blue-600 text-white': isSelected || seat.status === 'selected',
                                    'bg-yellow-500 text-white cursor-not-allowed': seat.status === 'reserved',
                                    'bg-gray-400 text-white cursor-not-allowed': seat.status === 'booked' || seat.status === 'blocked',
                                    'pointer-events-none': disabled,
                                  }
                                )}
                                aria-label={`Seat ${seat.name}`}
                              >
                                <span className="text-xs font-medium">{seat.name}</span>
                                {seat.status === 'reserved' && (
                                  <Lock size={10} className="absolute top-1 right-1" />
                                )}
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent className="p-2">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">{t('seatMap.seat', 'Seat')}: {seat.name}</p>
                                <p>{t('seatMap.row', 'Row')}: {row.name}</p>
                                <p>{t('seatMap.section', 'Section')}: {activeSectionData.name}</p>
                                <p>{t('seatMap.price', 'Price')}: {formatCurrency(seat.price || 0, 'INR')}</p>
                                <p>
                                  {t('seatMap.status', 'Status')}: {
                                    isSelected
                                      ? t('seatMap.selected', 'Selected')
                                      : t(`seatMap.${seat.status}`, seat.status)
                                  }
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Selection Summary */}
      {showTotalPrice && selectedCount > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="outline" className="mb-1">
                  {t('seatMap.seatsSelected', '{{count}} Seats Selected', { count: selectedCount })}
                </Badge>
                <h3 className="text-lg font-semibold">{formatCurrency(totalPrice, 'INR')}</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSeatSelect([])}
                className="text-destructive"
              >
                <X size={16} className="mr-1" />
                {t('common.clear', 'Clear')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractiveSeatMap;