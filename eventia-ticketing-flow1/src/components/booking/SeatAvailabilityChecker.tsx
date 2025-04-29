import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import paymentApi from '@/services/api/paymentApi';
import { AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SeatAvailabilityCheckerProps {
  eventId: string;
  seatIds: string[];
  onAvailabilityChecked?: (result: {
    isAllAvailable: boolean;
    availableCount: number;
    unavailableCount: number;
    unavailableSeats: string[];
  }) => void;
}

const SeatAvailabilityChecker = ({
  eventId,
  seatIds,
  onAvailabilityChecked
}: SeatAvailabilityCheckerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    seats: Array<{seat_id: string; is_available: boolean; status: string; error?: string}>;
    summary: {total: number; available: number; unavailable: number};
  } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkAvailability = async () => {
    if (!eventId || !seatIds.length) {
      toast({
        title: t('booking.noSeatsSelected', 'No seats selected'),
        description: t('booking.selectSeatsFirst', 'Please select seats first'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentApi.checkBulkSeatAvailability(seatIds, eventId);
      setResults(response.data.data);
      
      // Extract unavailable seat IDs
      const unavailableSeats = response.data.data.seats
        .filter(seat => !seat.is_available)
        .map(seat => seat.seat_id);
      
      // Call the callback if provided
      if (onAvailabilityChecked) {
        onAvailabilityChecked({
          isAllAvailable: response.data.data.summary.unavailable === 0,
          availableCount: response.data.data.summary.available,
          unavailableCount: response.data.data.summary.unavailable,
          unavailableSeats
        });
      }
      
      if (response.data.data.summary.unavailable > 0) {
        toast({
          title: t('booking.someSeatsUnavailable', 'Some seats are no longer available'),
          description: t('booking.pleaseSelectOthers', 'Please select different seats'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('booking.allSeatsAvailable', 'All seats are available'),
          description: t('booking.proceedToBooking', 'You can proceed with booking')
        });
      }
    } catch (error: any) {
      console.error('Error checking seat availability:', error);
      toast({
        title: t('booking.availabilityCheckFailed', 'Availability check failed'),
        description: error?.response?.data?.message || t('booking.tryAgain', 'Please try again'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={checkAvailability}
        disabled={isLoading || !seatIds.length}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            {t('common.checking', 'Checking...')}
          </>
        ) : (
          t('booking.checkAvailability', 'Check Seat Availability')
        )}
      </Button>

      {results && (
        <div className="mt-4">
          {results.summary.unavailable > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {t('booking.unavailableSeats', 'Unavailable Seats')}
              </AlertTitle>
              <AlertDescription>
                {t('booking.ofSelectedSeats', '{{unavailable}} of {{total}} selected seats are no longer available.', {
                  unavailable: results.summary.unavailable,
                  total: results.summary.total
                })}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <Check className="h-4 w-4" />
              <AlertTitle>
                {t('booking.allSeatsAvailable', 'All Seats Available')}
              </AlertTitle>
              <AlertDescription>
                {t('booking.allSelectedSeatsAvailable', 'All {{total}} selected seats are available.', {
                  total: results.summary.total
                })}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 max-h-40 overflow-y-auto">
            <ul className="space-y-1 text-sm">
              {results.seats.map((seat) => (
                <li key={seat.seat_id} className="flex items-center justify-between p-2 border-b">
                  <span>Seat {seat.seat_id}</span>
                  <span className="flex items-center">
                    {seat.is_available ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    {seat.is_available ? 
                      t('booking.available', 'Available') : 
                      t('booking.unavailable', `Unavailable (${seat.status})`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatAvailabilityChecker; 