import React from 'react';
import { LayoutStandSummary, ZoneSeatDetail } from '../../services/api/matchLayoutApi';

interface SeatGridProps {
  seats: ZoneSeatDetail[];
  selectedStand: LayoutStandSummary | null;
  cart: ZoneSeatDetail[];
  onSeatClick: (seat: ZoneSeatDetail) => void;
  loading: boolean;
}

const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedStand,
  cart,
  onSeatClick,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--district-accent)]"></div>
        <p className="font-medium text-[var(--district-muted)]">Loading seat map...</p>
      </div>
    );
  }

  // Group seats by row for the grid layout
  const rows = seats.reduce((acc, seat) => {
    const row = seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, ZoneSeatDetail[]>);

  // Sort rows alphabetically/numerically
  const sortedRowKeys = Object.keys(rows).sort();

  const getSeatStatusClass = (seat: ZoneSeatDetail) => {
    const isInCart = cart.some((s) => s.id === seat.id);
    if (isInCart || seat.status === 'SELECTED') return 'selected';
    if (seat.status === 'BOOKED') return 'booked';
    if (seat.status === 'LOCKED') return 'locked';
    return 'available';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[var(--district-border)] bg-gradient-to-r from-white/5 to-white/0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg sm:text-xl">{selectedStand?.name}</h3>
            <p className="text-sm text-[var(--district-muted)]">
              {seats.filter((s) => s.status === 'AVAILABLE').length} seats available
            </p>
          </div>
          <div className="district-legend text-[10px] font-semibold uppercase tracking-widest text-[var(--district-muted)] w-full sm:w-auto">
            <span className="district-pill">
              <span className="w-3 h-3 rounded-sm district-seat available inline-block border border-[var(--district-border)]" /> Available
            </span>
            <span className="district-pill">
              <span className="w-3 h-3 rounded-sm district-seat booked inline-block border border-[var(--district-border)]" /> Booked
            </span>
            <span className="district-pill">
              <span className="w-3 h-3 rounded-sm district-seat locked inline-block border border-[var(--district-border)]" /> Locked
            </span>
            <span className="district-pill">
              <span className="w-3 h-3 rounded-sm district-seat selected inline-block border border-[var(--district-border)]" /> Selected
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 sm:p-8 flex flex-col items-center">
        <div className="w-2/3 h-2 rounded-full mb-14 relative bg-gradient-to-r from-transparent via-[var(--district-accent)] to-transparent opacity-70">
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-extrabold tracking-[0.2em] text-[var(--district-muted)] uppercase">
            Field This Way
          </span>
        </div>

        <div className="flex flex-col gap-3 min-w-max">
          {sortedRowKeys.map((rowKey) => (
            <div key={rowKey} className="flex items-center gap-4">
              <div className="w-6 text-center text-xs font-black text-[var(--district-muted)]">{rowKey}</div>
              <div className="flex gap-2">
                {rows[rowKey]
                  .sort((a, b) => a.grid.col - b.grid.col)
                  .map((seat) => {
                    const statusClass = getSeatStatusClass(seat);
                    const disabled = seat.status === 'BOOKED' || seat.status === 'LOCKED';
                    return (
                      <button
                        key={seat.id}
                        data-status={seat.status}
                        disabled={disabled}
                        onClick={() => onSeatClick(seat)}
                        className={`district-seat ${statusClass} text-[10px] px-0.5`}
                        title={`Seat ${seat.rowLabel}-${seat.seatNumber} | ₹${seat.price}`}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
