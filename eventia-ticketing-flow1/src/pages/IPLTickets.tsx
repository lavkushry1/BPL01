import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/ui/page-transition';
import { iplMatches } from '@/data/iplData';
import IPLMatchCard from '@/components/events/IPLMatchCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { motion } from 'framer-motion';

const IPLTickets = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  
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
                    >
                      {t('ipl.calendar', 'View Calendar')}
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
                    posterUrl={match.image}
                    date={match.date}
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
            
            {filteredMatches.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <div className="text-6xl mb-6">🏏</div>
                <h2 className="text-2xl font-bold mb-3 text-gray-800">No matches found</h2>
                <p className="text-gray-600 text-lg">
                  {t('ipl.noMatches', 'No matches available for the selected team.')}
                </p>
                <Button 
                  onClick={() => setFilter('all')}
                  className="mt-6"
                  variant="outline"
                >
                  {t('common.showAll', 'Show All Matches')}
                </Button>
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
