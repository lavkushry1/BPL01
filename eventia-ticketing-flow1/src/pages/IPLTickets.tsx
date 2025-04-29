import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/ui/page-transition';
import { iplMatches as mockIplMatches, IPLMatch as MockIPLMatch } from '@/data/iplData';
import IPLMatchCard from '@/components/events/IPLMatchCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { motion } from 'framer-motion';
import { getIPLMatches, IPLMatch as ApiIPLMatch } from '@/services/api/eventApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Type to handle both API and mock data formats
type IPLMatch = ApiIPLMatch | MockIPLMatch;

const IPLTickets = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  
  // Fetch IPL matches from API
  const { data: apiIplMatches, isLoading, isError, refetch } = useQuery({
    queryKey: ['iplMatches'],
    queryFn: getIPLMatches,
    refetchOnWindowFocus: true, // Always refetch when window is focused to get latest data
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    retry: 2,
    refetchInterval: 60 * 1000 // Refetch every minute
  });
  
  // Use API data, fallback to mock data if needed
  const iplMatches = apiIplMatches || mockIplMatches;
  
  // Filter matches by team if filter is set
  const filteredMatches = filter === 'all' 
    ? iplMatches 
    : iplMatches.filter(match => 
        match.teams.team1.name.includes(filter) || 
        match.teams.team2.name.includes(filter)
      );
  
  // Get unique team names for filtering
  const teams = Array.from(new Set(
    iplMatches.flatMap(match => [match.teams.team1.name, match.teams.team2.name])
  ));

  // Function to get image URL regardless of data source
  const getImageUrl = (match: IPLMatch) => {
    // Check for API format with posterImage
    if ('posterImage' in match && match.posterImage) {
      return match.posterImage;
    }
    // Check for API format with images array
    if ('images' in match && match.images && match.images.length > 0) {
      return match.images[0].url;
    }
    // Check for mock data format with image
    if ('image' in match && match.image) {
      return match.image;
    }
    // Default fallback
    return '';
  };

  // Function to get date regardless of data source
  const getDate = (match: IPLMatch) => {
    // Check for mock data format with date property
    if ('date' in match && match.date) {
      return match.date;
    }
    // Check for API format with start_date
    if ('start_date' in match && match.start_date) {
      return match.start_date;
    }
    // Default fallback
    return '';
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="pt-16 pb-16">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/ipl-bg.jpg')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
            <div className="relative container mx-auto px-4 py-16 md:py-24">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">IPL 2025</h1>
                  <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8">
                    {t('ipl.heroSubtitle', 'Book official tickets for all IPL matches. Experience the thrill live!')}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="bg-white text-indigo-700 hover:bg-white/90 font-bold px-6 py-2.5 text-base"
                    >
                      {t('ipl.vipPackages', 'VIP Packages')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white text-white hover:bg-white/10 font-bold px-6 py-2.5 text-base"
                      onClick={() => refetch()}
                    >
                      {t('common.refresh', 'Refresh Data')}
                    </Button>
                  </div>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          
          {/* Team Filter */}
          <div className="bg-white shadow-md py-6">
            <div className="container mx-auto px-4">
              <h2 className="text-lg font-semibold mb-4">Filter by Team:</h2>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={filter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer py-1.5 px-3 text-sm font-medium"
                  onClick={() => setFilter('all')}
                >
                  All Teams
                </Badge>
                
                {teams.map(team => (
                  <Badge 
                    key={team}
                    variant={filter === team ? 'default' : 'outline'}
                    className="cursor-pointer py-1.5 px-3 text-sm font-medium"
                    onClick={() => setFilter(team)}
                  >
                    {team}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Matches Grid */}
          <div className="container mx-auto px-4 py-12">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <div className="text-6xl mb-6">⚠️</div>
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Error loading matches</h2>
                <p className="text-gray-600 text-lg">
                  We couldn't load the IPL matches. Please try again later.
                </p>
                <Button 
                  onClick={() => refetch()}
                  className="mt-6 px-6 py-2 bg-primary text-white hover:bg-primary/90"
                >
                  Retry Now
                </Button>
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <IPLMatchCard 
                      id={match.id}
                      title={match.title}
                      posterUrl={getImageUrl(match)}
                      date={getDate(match)}
                      time={match.time}
                      venue={match.venue}
                      startingPrice={Math.min(...match.ticketTypes.map(t => t.price))}
                      featured={index === 0} // Making the first match featured as an example
                      teams={match.teams}
                      altText={`IPL Match: ${match.teams.team1.name} vs ${match.teams.team2.name}`}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <div className="text-6xl mb-6">🏏</div>
                <h2 className="text-2xl font-bold mb-3 text-gray-800">No matches found</h2>
                <p className="text-gray-600 text-lg">
                  {filter !== 'all' 
                    ? t('ipl.noMatches', 'No matches available for the selected team.')
                    : t('ipl.noMatchesAtAll', 'No IPL matches are currently available in the backend.')}
                </p>
                {filter !== 'all' && (
                  <Button 
                    onClick={() => setFilter('all')}
                    className="mt-6"
                    variant="outline"
                  >
                    {t('common.showAll', 'Show All Matches')}
                  </Button>
                )}
                <div className="mt-6">
                  <Button
                    onClick={() => refetch()}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    Check for New Matches
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default IPLTickets;
