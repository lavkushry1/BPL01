import React from 'react';
import { ZoneSeatDetail } from '../../services/api/matchLayoutApi';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface SeatCartProps {
  cart: ZoneSeatDetail[];
  onProceed: () => void;
}

const SeatCart: React.FC<SeatCartProps> = ({ cart, onProceed }) => {
  const totalAmount = cart.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 district-cart p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="p-3 rounded-full bg-white/10 border border-[var(--district-border)] hidden sm:block">
            <ShoppingBag className="w-6 h-6 text-[var(--district-accent)]" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-lg font-black">
              <span>{cart.length} {cart.length === 1 ? 'Seat' : 'Seats'}</span>
              <span className="text-[var(--district-muted)]">|</span>
              <span className="text-[var(--district-accent)]">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-[var(--district-muted)] font-semibold uppercase tracking-widest">
              {cart.map(s => `${s.rowLabel}-${s.seatNumber}`).join(', ')}
            </div>
          </div>
        </div>

        <button
          onClick={onProceed}
          className="district-button-primary flex items-center gap-2 justify-center w-full sm:w-auto"
        >
          Proceed to Pay
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SeatCart;
