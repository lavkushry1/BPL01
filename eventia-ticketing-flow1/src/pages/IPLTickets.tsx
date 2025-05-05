import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/ui/page-transition';
import IPLMatchCard from '@/components/events/IPLMatchCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { motion } from 'framer-motion';
import { getIPLMatches, IPLMatch as ApiIPLMatch, Event } from '@/services/api/eventApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Type to handle API data format
type IPLMatch = ApiIPLMatch;

const IPLTickets = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  // Check for localStorage stored admin events
  const [localEvents, setLocalEvents] = useState<Event[]>([]);

  useEffect(() => {
    try {
      // Try to load admin created events from localStorage
      const storedEvents = localStorage.getItem('admin_created_events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (Array.isArray(parsedEvents)) {
          const cricketEvents = parsedEvents.filter(event =>
            event.category?.toLowerCase() === 'cricket' ||
            event.title?.toLowerCase().includes('ipl') ||
            event.title?.toLowerCase().includes('vs')
          );
          setLocalEvents(cricketEvents);
        }
      }
    } catch (error) {
      console.error('Error loading local events:', error);
    }
  }, []);

  // Listen for localStorage changes to update displayed events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_created_events' && e.newValue) {
        try {
          const parsedEvents = JSON.parse(e.newValue);
          if (Array.isArray(parsedEvents)) {
            const cricketEvents = parsedEvents.filter(event =>
              event.category?.toLowerCase() === 'cricket' ||
              event.title?.toLowerCase().includes('ipl') ||
              event.title?.toLowerCase().includes('vs')
            );
            setLocalEvents(cricketEvents);
          }
        } catch (error) {
          console.error('Error parsing localStorage events:', error);
        }
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-window updates
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail && e.detail.key === 'admin_created_events') {
        try {
          const storedEvents = localStorage.getItem('admin_created_events');
          if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents)) {
              const cricketEvents = parsedEvents.filter(event =>
                event.category?.toLowerCase() === 'cricket' ||
                event.title?.toLowerCase().includes('ipl') ||
                event.title?.toLowerCase().includes('vs')
              );
              setLocalEvents(cricketEvents);
            }
          }
        } catch (error) {
          console.error('Error processing custom event:', error);
        }
      }
    };

    // Add custom event listener
    window.addEventListener('admin-events-updated' as any, handleCustomEvent);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('admin-events-updated' as any, handleCustomEvent);
    };
  }, []);

  // Fetch IPL matches from API
  const { data: apiIplMatches, isLoading, isError, refetch } = useQuery({
    queryKey: ['iplMatches'],
    queryFn: getIPLMatches,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    retry: 2,
    refetchInterval: 60 * 1000
  });

  // Convert local events to IPL match format
  const localIplMatches = localEvents.map(event => {
    // Try to extract team names from title (assuming format like "Team1 vs Team2")
    const titleParts = event.title.split(' vs ');
    const team1Name = titleParts.length > 0 ? titleParts[0].trim() : 'Team 1';
    const team2Name = titleParts.length > 1 ? titleParts[1].trim() : 'Team 2';

    // Create default teams if not present
    const teams = {
      team1: {
        name: team1Name,
        shortName: team1Name.split(' ').map(word => word[0]).join(''),
        logo: ''
      },
      team2: {
        name: team2Name,
        shortName: team2Name.split(' ').map(word => word[0]).join(''),
        logo: ''
      }
    };

    // Convert ticket_types to ticketTypes format
    const ticketTypes = event.ticket_types.map(tt => ({
      category: tt.name,
      price: tt.price,
      available: tt.available || tt.quantity,
      capacity: tt.quantity
    }));

    // Return converted IPL match
    return {
      ...event,
      teams,
      ticketTypes,
      venue: event.location,
      time: new Date(event.start_date || event.date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Add source property to track origin
      source: 'admin'
    } as IPLMatch & { source: string };
  });

  // Add source property to API matches if they exist
  const apiMatchesWithSource = apiIplMatches
    ? apiIplMatches.map(match => ({ ...match, source: 'api' as const }))
    : [];

  // Use API data and include local events
  const iplMatches = [
    ...apiMatchesWithSource,
    ...localIplMatches
  ];

  // Filter matches by team if filter is set
  const filteredMatches = filter === 'all'
    ? iplMatches
    : iplMatches.filter(match =>
      match.teams?.team1?.name?.includes(filter) ||
      match.teams?.team2?.name?.includes(filter)
    );

  // Get unique team names for filtering
  const teams = Array.from(new Set(
    iplMatches.flatMap(match => [
      match.teams?.team1?.name,
      match.teams?.team2?.name
    ].filter(Boolean))
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
    // Check for local admin event
    if ('poster_image' in match && match.poster_image) {
      return match.poster_image;
    }
    // Default fallback
    return '';
  };

  // Function to get date regardless of data source
  const getDate = (match: IPLMatch) => {
    // Check for date property
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

  // Function to get starting price from ticket types
  const getStartingPrice = (match: IPLMatch) => {
    if (!match.ticketTypes || match.ticketTypes.length === 0) {
      return 999; // Default price if no tickets available
    }
    return Math.min(...match.ticketTypes.map(ticket => ticket.price));
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-8">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t('iplTickets.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('iplTickets.subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Filter by team */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                className="whitespace-nowrap"
                onClick={() => setFilter('all')}
              >
                {t('iplTickets.allMatches')}
              </Button>

              {teams.map((team) => (
                <Button
                  key={team}
                  variant={filter === team ? 'default' : 'outline'}
                  className="whitespace-nowrap"
                  onClick={() => setFilter(team)}
                >
                  {team}
                </Button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="h-40 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {isError && filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">{t('iplTickets.error')}</h3>
              <p className="text-muted-foreground mb-4">{t('iplTickets.errorMessage')}</p>
              <Button onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          )}

          {!isLoading && filteredMatches.length === 0 && !isError && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">{t('iplTickets.noMatches')}</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? t('iplTickets.noMatchesGeneral') : t('iplTickets.noMatchesFiltered', { team: filter })}
              </p>
            </div>
          )}

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
                  teams={match.teams}
                  date={getDate(match)}
                  time={match.time}
                  venue={match.venue}
                  posterUrl={getImageUrl(match)}
                  startingPrice={getStartingPrice(match)}
                  featured={match.featured || false}
                  dataSource={match.source || 'unknown'}
                />
              </motion.div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default IPLTickets;
