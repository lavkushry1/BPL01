import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import matchLayoutApi, { MatchLayoutResponse, MatchLayoutSeat, MatchSeatStatus } from '@/services/api/matchLayoutApi';
import { useCart } from '@/hooks/useCart';
import { ChevronLeft, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const getOrCreateLockerId = (): string => {
  const key = 'eventia_locker_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `guest-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(key, created);
  return created;
};

const getStandFill = (stand: MatchLayoutResponse['stands'][number]) => {
  if (stand.availability.isSoldOut) return '#6b7280'; // gray-500

  const price = stand.price ?? 0;
  if (price >= 15000) return '#6366f1'; // indigo
  if (price >= 8000) return '#f59e0b'; // amber
  if (price >= 4000) return '#10b981'; // emerald
  return '#8b5cf6'; // violet
};

const isSeatDisabled = (status: MatchSeatStatus) =>
  status === 'BOOKED' || status === 'SOLD' || status === 'BLOCKED' || status === 'MAINTENANCE';

const MatchSeatSelection: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [lockerId] = useState(() => getOrCreateLockerId());
  const [layout, setLayout] = useState<MatchLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const [svgZoom, setSvgZoom] = useState(1);
  const [hoveredStandId, setHoveredStandId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!matchId) return;
      try {
        setLoading(true);
        const data = await matchLayoutApi.getMatchLayout(matchId, lockerId);
        setLayout(data);
      } catch (err: any) {
        console.error('Failed to load match layout:', err);
        toast({
          title: 'Unable to load stadium layout',
          description: err?.response?.data?.message || err?.message || 'Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId, lockerId]);

  const selectedStand = useMemo(() => {
    if (!layout || !selectedStandId) return null;
    return layout.stands.find(s => s.id === selectedStandId) || null;
  }, [layout, selectedStandId]);

  const selectedSeats = useMemo(() => {
    if (!layout || selectedSeatIds.length === 0) return [];
    const byId = new Map<string, MatchLayoutSeat>();
    for (const stand of layout.stands) {
      for (const row of stand.rows) {
        for (const seat of row.seats) {
          if (seat.id) byId.set(seat.id, seat);
        }
      }
    }
    return selectedSeatIds.map(id => byId.get(id)).filter(Boolean) as MatchLayoutSeat[];
  }, [layout, selectedSeatIds]);

  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0),
    [selectedSeats]
  );

  const mutateLayoutSeat = (seatId: string, patch: Partial<MatchLayoutSeat>) => {
    setLayout(prev => {
      if (!prev) return prev;
      const next: MatchLayoutResponse = {
        ...prev,
        stands: prev.stands.map(stand => ({
          ...stand,
          rows: stand.rows.map(row => ({
            ...row,
            seats: row.seats.map(seat => (seat.id === seatId ? { ...seat, ...patch } : seat))
          }))
        }))
      };
      return next;
    });
  };

  const handleToggleSeat = async (seat: MatchLayoutSeat) => {
    if (!matchId) return;
    if (!seat.id) return;

    const isSelected = selectedSeatIds.includes(seat.id);
    if (isSelected) {
      try {
        await matchLayoutApi.unlockSeats(matchId, [seat.id], lockerId);
        setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
        mutateLayoutSeat(seat.id, { status: 'AVAILABLE', lockedByMe: false, lockExpiresAt: null });
      } catch (err: any) {
        console.error('Failed to unlock seat:', err);
        toast({
          title: 'Unable to release seat',
          description: err?.response?.data?.message || err?.message || 'Please try again.',
          variant: 'destructive'
        });
      }
      return;
    }

    if (isSeatDisabled(seat.status) || (seat.status === 'LOCKED' && !seat.lockedByMe)) {
      return;
    }

    try {
      const result = await matchLayoutApi.lockSeats(matchId, [seat.id], lockerId);
      setSelectedSeatIds(prev => [...prev, seat.id!]);
      mutateLayoutSeat(seat.id, { status: 'LOCKED', lockedByMe: true, lockExpiresAt: result.lockExpiresAt });
    } catch (err: any) {
      console.error('Failed to lock seat:', err);
      toast({
        title: 'Seat not available',
        description: err?.response?.data?.message || err?.message || 'Someone else may have selected it.',
        variant: 'destructive'
      });
    }
  };

  const handleAddToCart = () => {
    if (!layout) return;
    if (selectedSeats.length === 0) {
      toast({
        title: 'Select seats',
        description: 'Pick at least 1 seat to continue.',
        variant: 'destructive'
      });
      return;
    }

    addToCart({
      eventId: layout.event.id,
      eventTitle: layout.event.title,
      eventDate: new Date(layout.event.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
      eventTime: new Date(layout.event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      eventVenue: layout.event.location,
      tickets: selectedSeats.map(seat => ({
        id: seat.id!,
        name: seat.label,
        price: seat.price,
        quantity: 1,
        kind: 'seat'
      })),
      totalAmount: totalPrice
    });

    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <h1 className="text-2xl font-bold">Layout unavailable</h1>
            <p className="text-muted-foreground">
              This match does not have a stadium layout configured yet. Seed the stadium data and try again.
            </p>
            <Button asChild>
              <Link to="/ipl-tickets">Back to IPL Tickets</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/ipl-tickets" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSvgZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-14 text-center">{Math.round(svgZoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setSvgZoom(z => Math.min(2, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSvgZoom(1)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview SVG */}
          <div className="lg:col-span-2 rounded-2xl border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold">{layout.event.title}</h1>
              <p className="text-sm text-muted-foreground">
                {layout.stadium.name} · {new Date(layout.event.startDate).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground">Click a stand to pick seats</p>
            </div>

            <div className="p-4 bg-gradient-to-b from-green-900 to-green-800 overflow-auto">
              <div className="flex items-center justify-center min-h-[420px]" style={{ transform: `scale(${svgZoom})`, transformOrigin: 'center' }}>
                <svg viewBox={layout.stadium.svgViewBox} className="w-full max-w-3xl">
                  {/* Ground */}
                  <ellipse cx="250" cy="200" rx="180" ry="150" fill="#4ade80" stroke="#22c55e" strokeWidth="3" />
                  <rect x="220" y="130" width="60" height="140" fill="#d4b896" rx="4" />
                  <line x1="230" y1="145" x2="270" y2="145" stroke="white" strokeWidth="2" />
                  <line x1="230" y1="255" x2="270" y2="255" stroke="white" strokeWidth="2" />

                  {layout.stands.map((stand) => {
                    const isHovered = hoveredStandId === stand.id;
                    const isSelected = selectedStandId === stand.id;
                    const fill = getStandFill(stand);
                    const fillOpacity = isSelected ? 1 : isHovered ? 0.95 : 0.8;
                    const stroke = isSelected ? '#ffffff' : '#111827';
                    const strokeWidth = isSelected ? 3 : 1;

                    return (
                      <path
                        key={stand.id}
                        d={stand.svgPath}
                        fill={fill}
                        fillOpacity={fillOpacity}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        className={cn('cursor-pointer transition-all', stand.availability.isSoldOut && 'opacity-60')}
                        onMouseEnter={() => setHoveredStandId(stand.id)}
                        onMouseLeave={() => setHoveredStandId(null)}
                        onClick={() => setSelectedStandId(prev => (prev === stand.id ? null : stand.id))}
                      >
                        <title>
                          {stand.name} · {stand.availability.availableSeats}/{stand.availability.totalSeats} available ·{' '}
                          {stand.price ? `₹${stand.price.toLocaleString('en-IN')}` : 'Price TBD'}
                        </title>
                      </path>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="p-4 border-t text-sm text-muted-foreground flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#10b981]" /> Silver (₹4,000+)</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#f59e0b]" /> Gold (₹8,000+)</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#6366f1]" /> Premium (₹15,000+)</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#6b7280]" /> Sold out</div>
            </div>
          </div>

          {/* Seat grid */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{selectedStand ? selectedStand.name : 'Choose a stand'}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedStand
                  ? `${selectedStand.availability.availableSeats}/${selectedStand.availability.totalSeats} available`
                  : 'Select a stand from the stadium map to view seats.'}
              </p>
            </div>

            <div className="p-4">
              {selectedStand ? (
                <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                  {selectedStand.rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                      <div className="w-7 text-xs font-semibold text-muted-foreground">{row.label}</div>
                      <div className="grid grid-cols-10 gap-1">
                        {row.seats.map((seat) => {
                          const selectable = !!seat.id && !isSeatDisabled(seat.status) && (seat.status !== 'LOCKED' || seat.lockedByMe);
                          const selected = seat.id ? selectedSeatIds.includes(seat.id) : false;

                          const base =
                            selected ? 'bg-blue-600 text-white'
                            : seat.status === 'AVAILABLE' ? 'bg-emerald-500 text-emerald-950'
                            : seat.status === 'LOCKED' ? 'bg-amber-400 text-amber-950'
                            : seat.status === 'BOOKED' || seat.status === 'SOLD' ? 'bg-rose-500 text-rose-950'
                            : 'bg-slate-300 text-slate-700';

                          return (
                            <button
                              key={seat.stadiumSeatId}
                              type="button"
                              disabled={!selectable}
                              onClick={() => handleToggleSeat(seat)}
                              className={cn(
                                'h-7 w-7 rounded text-[10px] font-bold transition-opacity',
                                base,
                                !selectable && 'opacity-60 cursor-not-allowed'
                              )}
                              title={`${seat.label} · ${seat.status} · ₹${seat.price.toLocaleString('en-IN')}`}
                            >
                              {seat.seatNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Pick a stand from the stadium map to view rows and seats.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky cart summary */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Selected seats</div>
              <div className="font-semibold">
                {selectedSeats.length} · ₹{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
            <Button onClick={handleAddToCart} disabled={selectedSeats.length === 0}>
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Give space for sticky bar */}
        <div className="h-20" />
      </main>

      <Footer />
    </div>
  );
};

export default MatchSeatSelection;

