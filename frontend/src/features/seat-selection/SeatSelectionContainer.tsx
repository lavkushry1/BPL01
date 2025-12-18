import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import matchLayoutApi, {
  LayoutStandSummary,
  MatchLayoutResponse,
  ZoneSeatDetail,
} from '../../services/api/matchLayoutApi';
import SeatCart from './SeatCart';
import SeatGrid from './SeatGrid';
import StadiumMap from './StadiumMap';

const MAX_SEATS = 4;

const getOrCreateLockerId = (): string => {
  const key = 'eventia_locker_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(key, created);
  return created;
};

const SeatSelectionContainer: React.FC = () => {
  const params = useParams();
  const matchId = params.matchId || params.id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const lockerId = useMemo(() => getOrCreateLockerId(), []);

  const [step, setStep] = useState<1 | 2>(1);
  const [layoutData, setLayoutData] = useState<MatchLayoutResponse | null>(null);
  const [selectedStand, setSelectedStand] = useState<LayoutStandSummary | null>(null);
  const [seatData, setSeatData] = useState<ZoneSeatDetail[]>([]);
  const [cart, setCart] = useState<ZoneSeatDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshZoneSeats = async (zoneId: string) => {
    if (!matchId) return;
    const seats = await matchLayoutApi.getZoneSeats(matchId, zoneId, lockerId);
    setSeatData(seats);
    setCart(seats.filter((s) => s.status === 'SELECTED'));
  };

  const releaseSelectedSeats = async () => {
    if (!matchId) return;
    if (cart.length === 0) return;
    try {
      await matchLayoutApi.unlockSeats(
        matchId,
        cart.map((s) => s.id),
        lockerId
      );
    } catch (err) {
      // Best-effort; locks will expire server-side anyway.
      console.warn('Failed to unlock seats on cleanup', err);
    }
  };

  // Fetch Macro Layout (Step 1)
  useEffect(() => {
    if (!matchId) return;

    const fetchLayout = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await matchLayoutApi.getMatchLayout(matchId, lockerId);
        setLayoutData(data);
      } catch (err) {
        setError('Failed to load stadium layout');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [matchId, lockerId]);

  // Unlock seats if user leaves the page
  useEffect(() => {
    return () => {
      void releaseSelectedSeats();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, matchId]);

  // Handle Stand Selection
  const handleStandClick = async (stand: LayoutStandSummary) => {
    if (!matchId) return;
    if (stand.status === 'SOLD_OUT') return;

    // If changing stands, release any previously held seats first
    if (cart.length > 0) {
      await releaseSelectedSeats();
      setCart([]);
    }

    setSelectedStand(stand);
    setLoading(true);
    setStep(2);

    try {
      await refreshZoneSeats(stand.id);
    } catch (err) {
      console.error('Failed to load seats for stand', err);
      toast({
        title: 'Unable to load seats',
        description: 'Please try another stand.',
        variant: 'destructive',
      });
      setStep(1);
      setSelectedStand(null);
      setSeatData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Back to Map
  const handleBackToMap = async () => {
    await releaseSelectedSeats();
    setCart([]);
    setStep(1);
    setSelectedStand(null);
    setSeatData([]);
  };

  const updateSeatStatus = (seatId: string, status: ZoneSeatDetail['status']) => {
    setSeatData((prev) => prev.map((s) => (s.id === seatId ? { ...s, status } : s)));
  };

  // Handle Seat Toggle (locks seat immediately on the backend)
  const handleSeatClick = async (seat: ZoneSeatDetail) => {
    if (!matchId) return;

    const isSelected = cart.some((s) => s.id === seat.id) || seat.status === 'SELECTED';

    // Deselect
    if (isSelected) {
      try {
        await matchLayoutApi.unlockSeats(matchId, [seat.id], lockerId);
        setCart((prev) => prev.filter((s) => s.id !== seat.id));
        updateSeatStatus(seat.id, 'AVAILABLE');
      } catch (err: any) {
        console.error('Unlock failed', err);
        toast({
          title: 'Unable to release seat',
          description: err?.response?.data?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Select
    if (seat.status !== 'AVAILABLE') return;
    if (cart.length >= MAX_SEATS) {
      toast({
        title: 'Limit reached',
        description: `You can select up to ${MAX_SEATS} seats.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await matchLayoutApi.lockSeats(matchId, [seat.id], lockerId);
      setCart((prev) => [...prev, { ...seat, status: 'SELECTED' }]);
      updateSeatStatus(seat.id, 'SELECTED');
    } catch (err: any) {
      console.error('Lock failed', err);
      toast({
        title: 'Seat not available',
        description: err?.response?.data?.message || 'Someone else may have locked it.',
        variant: 'destructive',
      });

      // Refresh to show the latest seat state
      if (selectedStand) {
        try {
          await refreshZoneSeats(selectedStand.id);
        } catch (refreshErr) {
          console.error('Failed to refresh zone seats after conflict', refreshErr);
        }
      }
    }
  };

  const handleProceed = () => {
    if (!matchId || cart.length === 0) return;

    const eventTitle = layoutData?.event?.title || 'IPL Match';
    const startDate = layoutData?.event?.startDate ? new Date(layoutData.event.startDate) : null;

    sessionStorage.setItem(
      'bookingData',
      JSON.stringify({
        eventId: matchId,
        eventTitle,
        eventDate: startDate ? startDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD',
        eventTime: startDate ? startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        venue: layoutData?.event?.location || layoutData?.stadium?.name || 'Stadium',
        seatIds: cart.map((s) => s.id),
        tickets: [],
        totalAmount: cart.reduce((sum, s) => sum + (s.price || 0), 0),
        lockerId
      })
    );

    navigate('/checkout');
  };

  if (loading && step === 1 && !layoutData) {
    return <div className="flex justify-center items-center h-screen">Loading Stadium...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-10">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            {layoutData?.stadium.name || 'Stadium'} - {step === 1 ? 'Select Stand' : 'Select Seats'}
          </h1>
          {step === 2 && (
            <button
              onClick={handleBackToMap}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              &larr; Back to Stadium
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {step === 1 && layoutData ? (
          <StadiumMap layout={layoutData} onStandClick={handleStandClick} />
        ) : step === 2 ? (
          <SeatGrid
            seats={seatData}
            selectedStand={selectedStand}
            cart={cart}
            onSeatClick={handleSeatClick}
            loading={loading}
          />
        ) : null}
      </main>

      {cart.length > 0 && <SeatCart cart={cart} onProceed={handleProceed} />}
    </div>
  );
};

export default SeatSelectionContainer;
