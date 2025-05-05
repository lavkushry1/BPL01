import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Component imports
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Icons
import { Calendar, Clock, MapPin, ArrowLeft, Verified, Shield, BadgeCheck } from 'lucide-react';

import IPLMatchCard from '@/components/events/IPLMatchCard';

const IPLMatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/matches/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match details');
        }
        const data = await response.json();
        setMatch(data);
        if (data.ticketCategories && data.ticketCategories.length > 0) {
          setSelectedCategory(data.ticketCategories[0].id);
        }
      } catch (err) {
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

  const handleBookNow = () => {
    if (!selectedCategory) {
      toast({
        title: "Please select a ticket category",
        variant: "destructive",
      });
      return;
    }

    navigate(`/checkout/${id}?category=${selectedCategory}&quantity=${ticketQuantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 pb-12">
          <div className="container mx-auto px-4">
            <Button 
              variant="ghost" 
              className="mb-6 pl-0 hover:bg-transparent"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to all matches
            </Button>

            {/* Loading skeleton for match banner */}
            <div className="mb-8">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>

            {/* Loading skeleton for match info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3 mb-6" />
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>

                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Match Details</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate('/events')}>
              View All Events
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Match Not Found</h2>
            <p className="mb-4">The match you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/events')}>
              View All Events
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getSelectedCategoryDetails = () => {
    return match.ticketCategories.find(cat => cat.id === selectedCategory);
  };

  const calculateTotalPrice = () => {
    const category = getSelectedCategoryDetails();
    return category ? category.price * ticketQuantity : 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16 pb-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-6 pl-0 hover:bg-transparent"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all matches
          </Button>

          {/* Match Banner */}
          <div className="relative mb-8 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 z-10"></div>
            <img 
              src={match.bannerImage || `/assets/stadiums/${match.venue.replace(/\s+/g, '-').toLowerCase()}.jpg`} 
              alt={match.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                    <img 
                      src={match.teams.team1.logo} 
                      alt={match.teams.team1.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="text-white text-3xl font-bold">VS</div>
                  <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                    <img 
                      src={match.teams.team2.logo} 
                      alt={match.teams.team2.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </div>

                <div className="hidden md:block text-white">
                  <div className="text-sm opacity-80">Starting from</div>
                  <div className="text-3xl font-bold">
                    ₹{match.ticketCategories && match.ticketCategories.length > 0 
                      ? new Intl.NumberFormat('en-IN').format(Math.min(...match.ticketCategories.map(tc => tc.price))) 
                      : '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{match.title}</h1>
              <p className="text-lg text-gray-700 mb-6">{match.subtitle}</p>

              {/* Key Match Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center text-blue-600 mb-2">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-medium">Date</span>
                  </div>
                  <p className="text-gray-700">{match.date}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center text-blue-600 mb-2">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-medium">Time</span>
                  </div>
                  <p className="text-gray-700">{match.time}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center text-blue-600 mb-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="font-medium">Venue</span>
                  </div>
                  <p className="text-gray-700">{match.venue}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      selectedSection === 'overview' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSelectedSection('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      selectedSection === 'stadium' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSelectedSection('stadium')}
                  >
                    Stadium Info
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      selectedSection === 'teams' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSelectedSection('teams')}
                  >
                    Teams
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                {selectedSection === 'overview' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Match Overview</h3>
                    <p className="text-gray-700 mb-4">{match.description}</p>
                    
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <Verified className="h-5 w-5" />
                      <span className="text-sm font-medium">Verified Official Tickets</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <Shield className="h-5 w-5" />
                      <span className="text-sm font-medium">Secure Payments</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <BadgeCheck className="h-5 w-5" />
                      <span className="text-sm font-medium">Instant Ticket Delivery</span>
                    </div>
                  </div>
                )}
                
                {selectedSection === 'stadium' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Stadium Information</h3>
                    <p className="text-gray-700 mb-4">{match.venueInfo || 'Stadium information is currently being updated.'}</p>
                    
                    {match.stadiumMapImage && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Stadium Map</h4>
                        <img 
                          src={match.stadiumMapImage} 
                          alt="Stadium Map" 
                          className="w-full max-w-2xl rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {selectedSection === 'teams' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Team Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-white p-1 shadow-sm">
                            <img 
                              src={match.teams.team1.logo} 
                              alt={match.teams.team1.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <h4 className="font-bold">{match.teams.team1.name}</h4>
                        </div>
                        <p className="text-sm text-gray-700">{match.teams.team1.description || 'Team details will be updated soon.'}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-white p-1 shadow-sm">
                            <img 
                              src={match.teams.team2.logo} 
                              alt={match.teams.team2.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <h4 className="font-bold">{match.teams.team2.name}</h4>
                        </div>
                        <p className="text-sm text-gray-700">{match.teams.team2.description || 'Team details will be updated soon.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Ticket Booking Card */}
            <div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4">Book Tickets</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Ticket Category
                  </label>
                  <div className="space-y-2">
                    {match.ticketCategories && match.ticketCategories.map((category) => (
                      <div 
                        key={category.id}
                        className={`border rounded-lg p-3 cursor-pointer ${
                          selectedCategory === category.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">{category.description}</div>
                          </div>
                          <div className="font-bold">₹{new Intl.NumberFormat('en-IN').format(category.price)}</div>
                        </div>
                        {selectedCategory === category.id && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">Quantity</div>
                              <div className="flex items-center space-x-3">
                                <button 
                                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ticketQuantity > 1) setTicketQuantity(ticketQuantity - 1);
                                  }}
                                  disabled={ticketQuantity <= 1}
                                >
                                  -
                                </button>
                                <span className="w-5 text-center">{ticketQuantity}</span>
                                <button 
                                  className="h-7 w-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (ticketQuantity < (category.maxPerOrder || 10)) {
                                      setTicketQuantity(ticketQuantity + 1);
                                    }
                                  }}
                                  disabled={ticketQuantity >= (category.maxPerOrder || 10)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between mb-6">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-lg">₹{new Intl.NumberFormat('en-IN').format(calculateTotalPrice())}</span>
                </div>
                
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleBookNow}
                  disabled={!selectedCategory}
                >
                  Book Now
                </Button>
                
                <div className="mt-4 text-center text-xs text-gray-500">
                  By proceeding, you agree to our Terms of Service
                </div>
              </div>
            </div>
          </div>

          {/* More IPL Matches */}
          {match.relatedMatches && match.relatedMatches.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">More IPL Matches</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {match.relatedMatches.map((relatedMatch) => (
                  <IPLMatchCard
                    key={relatedMatch.id}
                    id={relatedMatch.id}
                    title={relatedMatch.title}
                    posterUrl={relatedMatch.posterUrl}
                    date={relatedMatch.date}
                    time={relatedMatch.time}
                    venue={relatedMatch.venue}
                    startingPrice={relatedMatch.startingPrice}
                    teams={relatedMatch.teams}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default IPLMatchDetail;