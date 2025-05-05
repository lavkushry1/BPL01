/**
 * @component Events
 * @description Main page that displays all available events with filtering and sorting options.
 * Entry point for the user to browse events and select one for booking.
 * 
 * @apiDependencies
 * - GET /api/events - Fetch all events with optional filtering
 * 
 * @stateManagement
 * - searchTerm - For filtering events by title/description
 * - selectedCategory - Filter by event category
 * - selectedVenue - Filter by venue
 * - dateRange - Filter by date range
 * - activeFilters - Track all active filters
 * - sortBy - Control sorting order
 * 
 * @dataModel
 * Uses Event model:
 * - id: string
 * - title: string
 * - description: string
 * - date: string
 * - time: string
 * - venue: string
 * - category: string
 * - ticketTypes: {category, price, available, capacity}[]
 * - image: string
 * 
 * @navigationFlow
 * - When user clicks on an event card → EventDetail page (/events/:id)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/events/EventCard';
import { FilterBar, FilterOptions } from '@/components/events/FilterBar';
import { getEvents, getEventCategories, Event as ApiEvent, EventFilters as ApiEventFilters } from '@/services/api/eventApi';
import { ArrowUpDown, Calendar, Search, MapPin, SlidersHorizontal, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { EventSort, SortOption } from '@/components/events/EventSort';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Update FilterOptions to match what we're using
interface FilterOptions {
  searchTerm?: string;
  categories?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  location?: string;
  useCurrentLocation?: boolean;
}

// Define Category type locally since it's not exported from eventApi
interface Category {
  id: string;
  name: string;
}

// Define our local version of filter options that matches our component needs
interface LocalFilterOptions {
  search: string;
  categories: string[];
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  useCurrentLocation?: boolean;
}

// Define our local Event model 
interface LocalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  duration: string;
  image: string;
  posterImage?: string;
  ticketTypes: {
    category: string;
    price: number;
    available: number;
    capacity: number;
  }[];
  featured?: boolean;
  discount?: {
    type: 'percent' | 'amount';
    value: number;
  } | null;
}

// Define our local EventFilters interface
interface EventFilters {
  search?: string;
  category?: string;
  startDate?: string; // API expects date as string
  endDate?: string;   // API expects date as string
  page: number;
  limit: number;
}

// Extend SortOption to include 'featured'
type ExtendedSortOption = SortOption | 'featured';

// Function to map API event to our local event model
const mapApiToLocalEvent = (apiEvent: any): LocalEvent => {
  if (!apiEvent) {
    throw new Error("Invalid event data received from API");
  }

  // Check if it's an IPL match with teams property
  const isIplMatch = !!apiEvent.teams;

  // Find featured image or use first image
  const mainImageUrl = apiEvent.images && apiEvent.images.length > 0
    ? (apiEvent.images.find((img: any) => img.is_featured)?.url || apiEvent.images[0].url)
    : (apiEvent.imageUrl || apiEvent.image || apiEvent.poster_image || '');

  return {
    id: apiEvent.id || 'unknown',
    title: isIplMatch && apiEvent.teams
      ? `${apiEvent.teams.team1?.name || 'Team 1'} vs ${apiEvent.teams.team2?.name || 'Team 2'}`
      : (apiEvent.title || 'Untitled Event'),
    description: apiEvent.description || '',
    date: apiEvent.start_date || apiEvent.date || apiEvent.startDate || '',
    time: apiEvent.time || (new Date(apiEvent.start_date || apiEvent.date || apiEvent.startDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    venue: apiEvent.venue || apiEvent.location || '',
    category: apiEvent.category || 'Event',
    duration: apiEvent.duration || '2-3 hours',
    image: mainImageUrl,
    posterImage: apiEvent.posterImage || mainImageUrl,
    ticketTypes: isIplMatch && Array.isArray(apiEvent.ticketTypes)
      ? apiEvent.ticketTypes.map((tt: any) => ({
        category: tt?.category || tt?.name || 'General',
        price: tt?.price || 0,
        available: tt?.available || 0,
        capacity: tt?.capacity || tt?.quantity || tt?.available * 2 || 0
      }))
      : (Array.isArray(apiEvent.ticket_types) ? apiEvent.ticket_types : []).map((tc: any) => ({
        category: tc?.name || 'General',
        price: tc?.price || 0,
        available: tc?.available || 0,
        capacity: tc?.quantity || tc?.available * 2 || 0
      })),
    featured: apiEvent.featured || false,
    discount: apiEvent.discount || null
  };
};

const Events = () => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<ExtendedSortOption>('date-asc');
  const [filters, setFilters] = useState<LocalFilterOptions>({
    search: '',
    categories: [],
    startDate: null,
    endDate: null,
    location: null,
    useCurrentLocation: false
  });

  // Convert our filter state to API filter format
  const getApiFilters = (): EventFilters => {
    return {
      search: filters.search || undefined,
      category: filters.categories && filters.categories.length ? filters.categories.join(',') : undefined,
      startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
      page: 1,
      limit: 50
    };
  };

  // Fetch events from API
  const { data: eventsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', getApiFilters()],
    queryFn: async () => {
      try {
        const events = await getEvents(getApiFilters());
        return events;
      } catch (err) {
        throw new Error('Failed to fetch events from the API');
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch event categories
  const { data: categoriesData, isLoading: isCategoriesLoading, isError: isCategoriesError } = useQuery({
    queryKey: ['eventCategories'],
    queryFn: getEventCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });

  // Process events from API 
  const events = useMemo(() => {
    // Process events from API if available
    if (!isLoading && !isError && eventsData) {
      const mappedEvents = eventsData.map((event: ApiEvent) => {
        const mappedEvent = mapApiToLocalEvent(event);
        return { ...mappedEvent };
      });
      return mappedEvents;
    }
    return [];
  }, [eventsData, isLoading, isError]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    // Convert FilterOptions to our local filter format
    setFilters({
      search: newFilters.searchTerm || '',
      categories: newFilters.categories || [],
      startDate: newFilters.dateRange?.from || null,
      endDate: newFilters.dateRange?.to || null,
      location: newFilters.location || null,
      useCurrentLocation: newFilters.useCurrentLocation
    });
  };

  const handleSortChange = (value: ExtendedSortOption) => {
    setSortBy(value);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      startDate: null,
      endDate: null,
      location: null
    });
  };

  // Filter badges to show active filters
  const filterBadges = [
    ...(filters.search ? [{ label: filters.search, type: 'search' }] : []),
    ...(filters.categories || []).map(cat => ({ label: cat, type: 'category' })),
    ...(filters.startDate ? [{ label: `From: ${filters.startDate.toLocaleDateString()}`, type: 'date' }] : []),
    ...(filters.endDate ? [{ label: `To: ${filters.endDate.toLocaleDateString()}`, type: 'date' }] : []),
    ...(filters.location ? [{ label: filters.location, type: 'location' }] : [])
  ];

  // Function to remove a specific filter
  const removeFilter = (type: string, value: string) => {
    if (type === 'search') {
      setFilters({ ...filters, search: '' });
    } else if (type === 'category') {
      setFilters({ ...filters, categories: filters.categories.filter(c => c !== value) });
    } else if (type === 'date' && value.startsWith('From:')) {
      setFilters({ ...filters, startDate: null });
    } else if (type === 'date' && value.startsWith('To:')) {
      setFilters({ ...filters, endDate: null });
    } else if (type === 'location') {
      setFilters({ ...filters, location: null });
    }
  };

  // Sort the events based on the selected sort option
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const sortedList = [...events];

    switch (sortBy) {
      case 'date-asc':
        return sortedList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'date-desc':
        return sortedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'price-asc':
        return sortedList.sort((a, b) => {
          const aMinPrice = Math.min(...a.ticketTypes.map(t => t.price));
          const bMinPrice = Math.min(...b.ticketTypes.map(t => t.price));
          return aMinPrice - bMinPrice;
        });
      case 'price-desc':
        return sortedList.sort((a, b) => {
          const aMaxPrice = Math.max(...a.ticketTypes.map(t => t.price));
          const bMaxPrice = Math.max(...b.ticketTypes.map(t => t.price));
          return bMaxPrice - aMaxPrice;
        });
      case 'featured':
        return sortedList.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      default:
        return sortedList;
    }
  }, [events, sortBy]);

  // Convert categories data to string array for FilterBar
  const categoryOptions = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map((category: Category) => category.name);
  }, [categoriesData]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{t('events.title')}</h1>
                <p className="text-muted-foreground">{t('events.subtitle')}</p>
              </div>

              <div className="flex items-center gap-2">
                <EventSort value={sortBy} onChange={handleSortChange} />
                <LanguageSwitcher />
              </div>
            </div>

            <FilterBar
              onFilterChange={handleFilterChange}
              categories={categoryOptions}
              activeFilters={{
                searchTerm: filters.search,
                categories: filters.categories,
                dateRange: filters.startDate && filters.endDate ? {
                  from: filters.startDate,
                  to: filters.endDate
                } : undefined,
                location: filters.location,
                useCurrentLocation: filters.useCurrentLocation
              }}
            />

            {filterBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">{t('events.activeFilters')}:</span>
                {filterBadges.map((badge, index) => (
                  <Badge
                    key={`${badge.type}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {badge.type === 'search' && <Search className="h-3 w-3" />}
                    {badge.type === 'category' && <Tag className="h-3 w-3" />}
                    {badge.type === 'date' && <Calendar className="h-3 w-3" />}
                    {badge.type === 'location' && <MapPin className="h-3 w-3" />}

                    {badge.label}

                    <button
                      onClick={() => removeFilter(badge.type, badge.label)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {filterBadges.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-7 text-xs"
                  >
                    {t('events.clearAll')}
                  </Button>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : isError ? (
              <Alert variant="destructive" className="my-8">
                <AlertTitle>Error loading events</AlertTitle>
                <AlertDescription>
                  We couldn't load the events at this time. Please try again later or contact support if the problem persists.
                </AlertDescription>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </Alert>
            ) : sortedEvents.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-semibold mb-2">{t('events.noEventsFound')}</h3>
                <p className="text-muted-foreground mb-6">{t('events.tryDifferentFilters')}</p>
                <Button onClick={handleResetFilters}>
                  {t('events.clearFilters')}
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {sortedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      date: event.date,
                      time: event.time,
                      venue: event.venue,
                      image: event.image || event.posterImage || '',
                      category: event.category,
                      ticketPrice: event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map(t => t.price)) : 0,
                      featured: event.featured,
                      discount: event.discount
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Events;
