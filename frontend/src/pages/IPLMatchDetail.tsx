import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

// Component imports
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/PublicNavbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Icons
import { Calendar, Clock, MapPin, Shield, Ticket, Ticket, TrendingUp, Trophy, Verified, Zap } from 'lucide-react';

import CricketStadiumSeatMap, { defaultStadiumSections } from '@/components/booking/CricketStadiumSeatMap';
import IPLMatchCard from '@/components/events/IPLMatchCard';

const IPLMatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useTranslation();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [stadiumSections, setStadiumSections] = useState(defaultStadiumSections);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for Sticky Header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/ipl/matches/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match details');
        }
        const data = await response.json();
        setMatch(data.data || data);
        if (data.data?.ticketCategories && data.data.ticketCategories.length > 0) {
          setSelectedCategory(data.data.ticketCategories[0].id);
        } else if (data.ticketCategories && data.ticketCategories.length > 0) {
          setSelectedCategory(data.ticketCategories[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching match details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatchDetails();
    }
  }, [id]);

  // Fetch dynamic pricing and stadium status
  useEffect(() => {
    const fetchPricingAndStatus = async () => {
      try {
        const response = await fetch(`/api/v1/ipl/matches/${id}/pricing`);
        const data = await response.json();
        if (data.success && data.data) {
          const apiSections = data.data.sections.map((s: any) => {
            const defaultSection = defaultStadiumSections.find(ds => ds.name === s.name);
            return {
              ...defaultSection,
              id: defaultSection?.id || s.name.toLowerCase().replace(/\s+/g, '-'),
              basePrice: s.basePrice,
              availableSeats: s.available,
              priceCategory: defaultSection?.priceCategory || 'general'
            };
          }).filter((s: any) => s.path);

          if (apiSections.length > 0) {
            setStadiumSections(apiSections);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      }
    };

    if (id && selectedSection === 'stadium') {
      fetchPricingAndStatus();

      const socket = new WebSocket('ws://localhost:4001/ws');
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join:event', eventId: id }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'section_status_changed' && data.event_id === id) {
            setStadiumSections(prev => prev.map(section => {
              if (section.id === data.section_id) {
                return {
                  ...section,
                  availableSeats: data.available_seats
                };
              }
              return section;
            }));

            toast({
              title: "Seat Update",
              description: `${data.section_id} status updated: ${data.status}`,
            });
          }
        } catch (e) {
          console.error('Socket message parse error', e);
        }
      };

      return () => {
        socket.close();
      };
    }
  }, [id, selectedSection]);

  const handleBookNow = () => {
    if (!selectedCategory) {
      toast({
        title: "Please select a ticket category",
        variant: "destructive",
      });
      return;
    }

    const category = getSelectedCategoryDetails();
    if (!category) return;

    const bookingDetails = {
      eventId: match.eventId || match.id,
      eventTitle: match.title,
      eventDate: match.date,
      eventTime: match.time,
      venue: match.venue,
      bannerImage: match.bannerImage || `/assets/stadiums/${match.venue.replace(/\s+/g, '-').toLowerCase()}.jpg`,
      teams: match.teams,
      tickets: [{
        category: category.name,
        categoryId: category.id,
        quantity: ticketQuantity,
        price: category.price,
        subtotal: category.price * ticketQuantity
      }],
      totalAmount: category.price * ticketQuantity
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingDetails));
    navigate(`/checkout/${id}`);
  };

  const handleJoinWaitlist = async () => {
    if (!selectedCategory) return;
    const email = prompt("Enter your email to join the waitlist:");
    if (!email) return;

    try {
      const response = await fetch('/api/v1/ipl/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          matchId: id,
          sectionId: selectedCategory,
          userId: 'guest'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Joined Waitlist",
          description: "We'll notify you when tickets become available!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join waitlist",
        variant: "destructive",
      });
    }
  };

  const getSelectedCategoryDetails = () => {
    if (!match?.ticketCategories) return null;
    return match.ticketCategories.find((cat: any) => cat.id === selectedCategory);
  };

  const calculateTotalPrice = () => {
    const category = getSelectedCategoryDetails();
    return category ? category.price * ticketQuantity : 0;
  };

  const selectedSectionData = stadiumSections.find(s => s.id === selectedCategory);
  const isSoldOut = selectedSectionData?.availableSeats === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <Skeleton className="h-96 w-full rounded-3xl mb-8 bg-slate-900" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-12 w-3/4 bg-slate-900" />
                <Skeleton className="h-6 w-1/2 bg-slate-900" />
              </div>
              <Skeleton className="h-80 w-full rounded-xl bg-slate-900" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-red-500">Match Not Found</h2>
          <p className="text-slate-400">The match you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/events')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            View All Matches
          </Button>
        </div>
      </div>
    );
  }

  // Helper for team colors
  const team1Color = match.teams?.team1?.primaryColor || '#F9CD05'; // Default CSK Yellow
  const team2Color = match.teams?.team2?.primaryColor || '#004BA0'; // Default MI Blue

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      {/* Sticky Header */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-md z-50 border-b border-white/10 flex items-center shadow-lg"
          >
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={match.teams?.team1?.logo} className="w-8 h-8 object-contain" />
                  <span className="font-bold text-lg">{match.teams?.team1?.shortName}</span>
                </div>
                <span className="text-slate-500 text-sm">VS</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{match.teams?.team2?.shortName}</span>
                  <img src={match.teams?.team2?.logo} className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-xs text-slate-400">Tickets from</p>
                  <p className="font-bold text-xl text-green-400">₹{new Intl.NumberFormat('en-IN').format(Math.min(...match.ticketCategories.map((tc: any) => tc.price)))}</p>
                </div>
                <Button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="bg-blue-600 hover:bg-blue-700 rounded-full">Book Now</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
              src={match.bannerImage || `/assets/stadiums/${match.venue.replace(/\s+/g, '-').toLowerCase()}.jpg`}
              alt={match.title}
            className="w-full h-full object-cover"
            />
          {/* Gradients for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-32 animate-fade-in-up">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10 backdrop-blur-sm px-3 py-1">IPL 2026</Badge>
                  <div className="flex items-center text-slate-300 text-sm">
                    <Calendar className="w-4 h-4 mr-1" /> {match.date ? new Date(match.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                  </div>
                </div>

                <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {match.teams?.team1?.name}
                  </span>
                  <span className="block text-2xl md:text-4xl text-slate-400 font-light my-2">VS</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {match.teams?.team2?.name}
                  </span>
                </h1>

                <div className="flex items-center gap-6 text-lg text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-white" /> {match.venue}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-white" /> {match.time} IST
                  </div>
                </div>
              </div>

              {/* Team Logos Hero Display */}
              <div className="hidden lg:flex items-center gap-8 opacity-80">
                <img src={match.teams?.team1?.logo} className="w-40 h-40 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
                <span className="text-6xl font-black text-slate-700 italic">VS</span>
                <img src={match.teams?.team2?.logo} className="w-40 h-40 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 -mt-24 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tabs & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs Config */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-2 border border-white/5 inline-flex gap-2">
              {['overview', 'stadium', 'teams'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedSection(tab)}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${selectedSection === tab
                    ? 'bg-white text-slate-950 shadow-lg scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content Panels */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-3xl p-8 min-h-[500px]">
              {selectedSection === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                      <div className="text-slate-400 text-sm mb-1">Win Probability</div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-bold">{match.teams?.team1?.shortName}</div>
                        <Progress value={55} className="h-2 bg-slate-700" indicatorClassName="bg-yellow-500" />
                        <div className="text-xs text-slate-400">55%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold">{match.teams?.team2?.shortName}</div>
                        <Progress value={45} className="h-2 bg-slate-700" indicatorClassName="bg-blue-600" />
                        <div className="text-xs text-slate-400">45%</div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-slate-400 text-sm">Weather</div>
                        <div className="font-bold text-xl">28°C Clear</div>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Trophy className="text-yellow-500" /> Match Preview</h3>
                    <p className="text-slate-300 leading-relaxed text-lg">{match.description || "Get ready for an electrifying encounter as these two titans clash in the ultimate showdown. Expect high scores, breathtaking catches, and nail-biting finishes."}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-8">
                    <div className="flex items-center gap-3">
                      <Verified className="text-green-500" />
                      <div className="text-sm">
                        <div className="font-bold">Official Partner</div>
                        <div className="text-slate-500">100% Authentic Tickets</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-blue-500" />
                      <div className="text-sm">
                        <div className="font-bold">Fast Selling</div>
                        <div className="text-slate-500">Hurry, seats filling fast!</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="text-purple-500" />
                      <div className="text-sm">
                        <div className="font-bold">Secure Booking</div>
                        <div className="text-slate-500">Encrypted Transactions</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'stadium' && (
                <div className="animate-fade-in">
                  <h3 className="text-2xl font-bold mb-6">Live Seat Selection</h3>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <CricketStadiumSeatMap
                      venueName={match.venue}
                      sections={stadiumSections}
                      selectedSection={selectedCategory}
                      onSectionSelect={(sectionId) => sectionId && setSelectedCategory(sectionId)}
                      priceMultiplier={match.priceMultiplier || 1}
                      teamColors={{
                        primary: team1Color,
                        secondary: team2Color
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedSection === 'teams' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-transparent p-6 rounded-3xl border border-yellow-500/20">
                    <div className="flex items-center gap-4 mb-6">
                      <img src={match.teams?.team1?.logo} className="w-16 h-16 object-contain" />
                      <div>
                        <h3 className="text-2xl font-bold">{match.teams?.team1?.name}</h3>
                        <p className="text-yellow-500 font-bold">Home Team</p>
                      </div>
                    </div>
                    {/* Fake Stats */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Batting Strength</span>
                          <span className="font-bold">92/100</span>
                        </div>
                        <Progress value={92} className="h-1.5" indicatorClassName="bg-yellow-500" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Bowling Depth</span>
                          <span className="font-bold">85/100</span>
                        </div>
                        <Progress value={85} className="h-1.5" indicatorClassName="bg-yellow-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-6 rounded-3xl border border-blue-600/20">
                    <div className="flex items-center gap-4 mb-6">
                      <img src={match.teams?.team2?.logo} className="w-16 h-16 object-contain" />
                      <div>
                        <h3 className="text-2xl font-bold">{match.teams?.team2?.name}</h3>
                        <p className="text-blue-500 font-bold">Challenger</p>
                      </div>
                    </div>
                    {/* Fake Stats */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Batting Strength</span>
                          <span className="font-bold">88/100</span>
                        </div>
                        <Progress value={88} className="h-1.5" indicatorClassName="bg-blue-600" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Bowling Depth</span>
                          <span className="font-bold">90/100</span>
                        </div>
                        <Progress value={90} className="h-1.5" indicatorClassName="bg-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="relative">
            <div className="sticky top-24 pt-4">
              <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                {/* Card Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative bg-slate-900/90 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Ticket className="text-blue-500" /> Get Tickets
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="text-sm font-medium text-slate-400">Select Category</div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {match.ticketCategories?.map((category: any) => (
                        <div
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCategory === category.id
                            ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : 'bg-slate-800/30 border-white/5 hover:border-white/20'
                            }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white">{category.name}</span>
                            <span className="text-lg font-bold text-green-400">₹{new Intl.NumberFormat('en-IN').format(category.price)}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex justify-between">
                            <span>{category.description}</span>
                            <span className={category.available < 10 ? "text-red-400 font-bold" : "text-slate-500"}>
                              {category.available} left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {selectedCategory && (
                    <div className="mb-8 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400">Quantity</span>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1">
                          <button
                            onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10"
                          > - </button>
                          <span className="w-8 text-center font-bold">{ticketQuantity}</span>
                          <button
                            onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10"
                          > + </button>
                        </div>
                      </div>
                      <Separator className="bg-white/10 mb-4" />
                      <div className="flex justify-between items-end">
                        <span className="text-slate-400">Total Amount</span>
                        <span className="text-3xl font-bold text-white">₹{new Intl.NumberFormat('en-IN').format(calculateTotalPrice())}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={isSoldOut ? handleJoinWaitlist : handleBookNow}
                    disabled={!selectedCategory || loading}
                    size="lg"
                    className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-blue-600/20 ${isSoldOut
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                  >
                    {isSoldOut ? 'Join Waitlist' : 'Proceed to Checkout'}
                  </Button>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" /> Secure Payment via Razorpay
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div>

        {/* Suggestion / Related Rows similar to Netflix/District */}
        {match.relatedMatches?.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
              More from IPL 2026
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {match.relatedMatches.map((m: any) => (
                <IPLMatchCard key={m.id} {...m} />
              ))}
            </div>
            </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default IPLMatchDetail;
