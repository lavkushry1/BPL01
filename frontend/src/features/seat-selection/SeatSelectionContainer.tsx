import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import matchLayoutApi, { LayoutStandSummary, ZoneSeatDetail } from '../../services/api/matchLayoutApi';
import StadiumMap from './StadiumMap';
import SeatGrid from './SeatGrid';
import SeatCart from './SeatCart';

const MAX_SEATS = 4;

const SeatSelectionContainer: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [layoutData, setLayoutData] = useState<LayoutStandSummary[]>([]);
  const [selectedStand, setSelectedStand] = useState<LayoutStandSummary | null>(null);
  const [seatData, setSeatData] = useState<ZoneSeatDetail[]>([]);
  const [cart, setCart] = useState<ZoneSeatDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Macro Layout (Step 1)
  useEffect(() => {
    if (!matchId) return;
    
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const data = await matchLayoutApi.getMatchLayout(matchId);
        setLayoutData(data);
      } catch (err) {
        setError('Failed to load stadium layout');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [matchId]);

  // Handle Stand Selection
  const handleStandClick = async (stand: LayoutStandSummary) => {
    if (stand.status === 'SOLD_OUT') return; // Prevent clicking sold out stands
    
    setSelectedStand(stand);
    setLoading(true);
    setStep(2);
    
    try {
      // Fetch Micro Layout (Step 2)
      if (matchId) {
        const seats = await matchLayoutApi.getZoneSeats(matchId, stand.id);
        setSeatData(seats);
      }
    } catch (err) {
      console.error('Failed to load seats for stand', err);
      // Revert to step 1 on error
      setStep(1);
      setSelectedStand(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Back to Map
  const handleBackToMap = () => {
    setStep(1);
    setSelectedStand(null);
    setSeatData([]);
  };

  // Handle Seat Toggle
  const handleSeatClick = (seat: ZoneSeatDetail) => {
    if (seat.status !== 'AVAILABLE' && seat.status !== 'SELECTED') return;

    const isSelected = cart.some(s => s.id === seat.id);

    if (isSelected) {
      setCart(cart.filter(s => s.id !== seat.id));
    } else {
      if (cart.length >= MAX_SEATS) {
        alert(`You can only select up to ${MAX_SEATS} seats.`);
        return;
      }
      setCart([...cart, { ...seat, status: 'SELECTED' }]);
    }
  };

  const handleProceed = () => {
    // Navigate to checkout or summary
    // Typically pass cart data via state or context
    console.log('Proceeding with cart:', cart);
    alert('Proceeding to checkout with ' + cart.length + ' seats');
  };

  if (loading && step === 1 && layoutData.length === 0) {
    return <div className="flex justify-center items-center h-screen">Loading Stadium...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-10">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Select Seats</h1>
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
        {step === 1 ? (
          <StadiumMap 
            stands={layoutData} 
            onStandClick={handleStandClick} 
          />
        ) : (
          <SeatGrid 
            seats={seatData} 
            selectedStand={selectedStand} 
            cart={cart}
            onSeatClick={handleSeatClick}
            loading={loading}
          />
        )}
      </main>

      {cart.length > 0 && (
        <SeatCart 
          cart={cart} 
          onProceed={handleProceed} 
        />
      )}
    </div>
  );
};

export default SeatSelectionContainer;
