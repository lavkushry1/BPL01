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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-blue-50 p-3 rounded-full hidden sm:block">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{cart.length} {cart.length === 1 ? 'Seat' : 'Seats'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-lg font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {cart.map(s => `${s.rowLabel}-${s.seatNumber}`).join(', ')}
            </div>
          </div>
        </div>

        <button
          onClick={onProceed}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-200 flex items-center gap-2 transition-all hover:scale-105"
        >
          Proceed to Checkout
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SeatCart;
