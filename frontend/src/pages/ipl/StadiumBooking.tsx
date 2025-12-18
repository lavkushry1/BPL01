import StadiumLayout from '@/components/ipl/StadiumLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getIplMatchById } from '@/services/api/iplApi';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Timer } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const StadiumBooking = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'stadium' | 'seat'>('stadium');
  const [selectedStand, setSelectedStand] = useState<any>(null);

  const { data: match, isLoading, isError } = useQuery({
    queryKey: ['iplMatch', matchId],
    queryFn: () => getIplMatchById(matchId!),
    enabled: !!matchId,
    staleTime: 60 * 1000,
  });

  const handleStandSelect = (stand: any) => {
    console.log('Stand selected:', stand);
    setSelectedStand(stand);

    // Simulate navigation to seat view
    toast({
      title: `Selected ${stand.name}`,
      description: "Zooming into seat selection...",
    });
    // setView('seat'); // TODO: Implement Seat Layout
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <h2 className="text-2xl font-bold mb-4">Match not found</h2>
        <Button onClick={() => navigate('/ipl-tickets')}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {match.teams.team1.shortName} vs {match.teams.team2.shortName}
              </h1>
              <div className="flex items-center text-xs text-slate-400 gap-3">
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(match.matchDate).toLocaleDateString()}</span>
                <span className="flex items-center"><Timer className="w-3 h-3 mr-1" /> {match.matchTime}</span>
                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {match.venueDetails.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">

        {/* Progress Steps (Optional) */}

        <div className="max-w-5xl mx-auto">
           {view === 'stadium' ? (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Select a Stand</h2>
                  <div className="text-sm text-slate-400">Prices start from ₹{match.pricing.minPrice}</div>
                </div>

                <StadiumLayout
                   venueName={match.venueDetails.name}
                   stands={match.venueDetails.stands}
                   onStandSelect={handleStandSelect}
                   pricing={{}} // Helper to map prices if needed
                />
             </div>
           ) : (
             <div>
                {/* Seat Layout Placeholder */}
                <Button onClick={() => setView('stadium')}>Back to Map</Button>
                <div className="mt-8 p-12 border border-dashed border-slate-700 rounded-xl text-center">
                  Micro Seat View for {selectedStand?.name} Coming Soon
                </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default StadiumBooking;
