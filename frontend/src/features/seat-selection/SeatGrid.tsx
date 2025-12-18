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
  loading 
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Loading seat map...</p>
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

  const getSeatStatusColor = (seat: ZoneSeatDetail) => {
    const isInCart = cart.some(s => s.id === seat.id);
    if (isInCart) return 'bg-green-500 border-green-600 text-white';

    switch (seat.status) {
      case 'AVAILABLE':
        return 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50';
      case 'BOOKED':
        return 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60';
      case 'LOCKED':
        return 'bg-red-100 border-red-300 cursor-not-allowed';
      case 'SELECTED':
        return 'bg-green-500 border-green-600 text-white';
      default:
        return 'bg-white border-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{selectedStand?.name}</h3>
          <p className="text-sm text-gray-500">
            {seats.filter(s => s.status === 'AVAILABLE').length} seats available
          </p>
        </div>
        
        {/* Color Legend (Mini) */}
        <div className="flex gap-4 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 bg-white rounded-sm"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
        {/* Screen / Ground Indicator */}
        <div className="w-2/3 h-2 bg-gray-300 rounded-full mb-16 relative">
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Field This Way
          </span>
        </div>

        <div className="flex flex-col gap-3 min-w-max">
          {sortedRowKeys.map(rowKey => (
            <div key={rowKey} className="flex items-center gap-4">
              <div className="w-6 text-center text-xs font-bold text-gray-400">{rowKey}</div>
              <div className="flex gap-2">
                {rows[rowKey].sort((a, b) => a.grid.col - b.grid.col).map(seat => (
                  <button
                    key={seat.id}
                    disabled={seat.status !== 'AVAILABLE'}
                    onClick={() => onSeatClick(seat)}
                    className={`
                      w-8 h-8 rounded-t-md border-b-4 text-[10px] font-bold transition-all
                      flex items-center justify-center
                      ${getSeatStatusColor(seat)}
                    `}
                    title={`Seat ${seat.rowLabel}-${seat.seatNumber} | ₹${seat.price}`}
                  >
                    {seat.seatNumber}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
