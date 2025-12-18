import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface Seat {
  id: string;
  row: string;
  seatNumber: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'RESERVED';
  price?: number;
  type?: string;
  section?: string;
}

interface SeatLayoutProps {
  standName: string;
  seats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeats: Seat[];
  isLoading?: boolean;
}

const SeatLayout = ({
  standName,
  seats,
  onSeatSelect,
  selectedSeats,
  isLoading = false
}: SeatLayoutProps) => {

  const selectedSeatIds = useMemo(() => new Set(selectedSeats.map(s => s.id)), [selectedSeats]);

  // Group seats by row
  const rows = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach(seat => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    // Sort rows alphabetically/numerically
    return Object.keys(grouped).sort().map(rowKey => ({
      rowLabel: rowKey,
      seats: grouped[rowKey].sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber))
    }));
  }, [seats]);

  if (isLoading) {
    return <div className="text-center py-20 text-slate-400">Loading seats...</div>;
  }

  if (seats.length === 0) {
    return <div className="text-center py-20 text-slate-400">No seats available in this section.</div>;
  }

  const getSeatColor = (status: string, isSelected: boolean) => {
    if (isSelected) return "bg-green-500 text-white border-green-600";
    switch (status) {
      case 'AVAILABLE': return "bg-white text-slate-900 hover:bg-green-100 border-slate-300";
      case 'BOOKED': return "bg-slate-700 text-slate-500 cursor-not-allowed border-transparent";
      case 'LOCKED': return "bg-yellow-500/50 text-yellow-100 cursor-not-allowed border-transparent";
      default: return "bg-slate-800 text-slate-600";
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">{standName}</h3>
        <div className="w-2/3 mx-auto h-2 bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded mb-2"></div>
        <p className="text-xs text-slate-500 uppercase tracking-widest">Screen / Pitch This Way</p>
      </div>

      <ScrollArea className="h-[400px] w-full pr-4">
        <div className="flex flex-col gap-3 min-w-[600px] items-center">
          <TooltipProvider delayDuration={0}>
          {rows.map((row) => (
            <div key={row.rowLabel} className="flex items-center gap-4">
              <div className="w-8 text-right text-sm font-mono text-slate-400 font-bold">
                {row.rowLabel}
              </div>
              <div className="flex gap-1.5 justify-center">
                {row.seats.map((seat) => {
                  const isSelected = selectedSeatIds.has(seat.id);
                  const isBooked = seat.status === 'BOOKED' || seat.status === 'LOCKED';

                  return (
                    <Tooltip key={seat.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={!isBooked ? { scale: 1.2 } : {}}
                          whileTap={!isBooked ? { scale: 0.9 } : {}}
                          onClick={() => !isBooked && onSeatSelect(seat)}
                          disabled={isBooked}
                          className={cn(
                            "w-8 h-8 rounded-t-lg rounded-b-md text-[10px] font-bold flex items-center justify-center border transition-colors shadow-sm",
                            getSeatColor(seat.status, isSelected)
                          )}
                        >
                          {seat.seatNumber}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-slate-950 text-white border-slate-800">
                        <p className="font-bold">Row {seat.row} - Seat {seat.seatNumber}</p>
                        <p className="text-xs capitalize text-slate-300">{seat.section}</p>
                        <p className="font-mono text-green-400">₹{seat.price || '---'}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="w-8 text-left text-sm font-mono text-slate-400 font-bold">
                {row.rowLabel}
              </div>
            </div>
          ))}
          </TooltipProvider>
        </div>
      </ScrollArea>

      <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-slate-300 bg-white"></div> Available
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div> Selected
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-700"></div> Booked
          </div>
      </div>
    </div>
  );
};

export default SeatLayout;
