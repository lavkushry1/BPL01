import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MoonStar, SunMedium, Sparkles } from 'lucide-react';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('district_theme') : null;
    if (stored === 'light' || stored === 'dark') return stored;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('district_theme', theme);
    }
  }, [theme]);

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
    <div className={`district-theme ${theme === 'dark' ? 'district-dark' : 'district-light'}`}>
      <div className="district-shell flex flex-col min-h-screen">
        <header className="district-panel p-4 sm:p-5 shadow z-10 mx-auto mt-4 mb-2 w-[min(1100px,95vw)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/10 border border-white/10">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <p className="uppercase tracking-[0.18em] text-xs text-[var(--district-muted)] font-semibold">
                  District Mode
                </p>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {layoutData?.stadium.name || 'Stadium'} · {step === 1 ? 'Pick Your Stand' : 'Pick Your Seats'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={handleBackToMap}
                  className="district-chip whitespace-nowrap"
                >
                  ← Back to Stadium
                </button>
              )}
              <button
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="district-chip"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
          {layoutData && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--district-muted)]">
              <span className="district-badge">{layoutData.event?.title || 'IPL Match'}</span>
              <span className="district-badge">{layoutData.event?.location || layoutData.stadium.name}</span>
              <span className="district-badge">
                {layoutData.stands.length} stands · Lazy-loaded seats · 5m locks
              </span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-hidden relative pb-24">
          <div className="mx-auto w-[min(1100px,95vw)]">
            {step === 1 && layoutData ? (
              <div className="district-panel p-4 sm:p-6">
                <StadiumMap layout={layoutData} onStandClick={handleStandClick} />
              </div>
            ) : step === 2 ? (
              <div className="district-panel p-0 overflow-hidden">
                <SeatGrid
                  seats={seatData}
                  selectedStand={selectedStand}
                  cart={cart}
                  onSeatClick={handleSeatClick}
                  loading={loading}
                />
              </div>
            ) : null}
          </div>
        </main>

        {cart.length > 0 && <SeatCart cart={cart} onProceed={handleProceed} />}
      </div>
    </div>
  );
};

export default SeatSelectionContainer;
