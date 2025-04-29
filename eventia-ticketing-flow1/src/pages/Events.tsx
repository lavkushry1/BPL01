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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/events/EventCard';
import { FilterBar, FilterOptions } from '@/components/events/FilterBar';
import { events as mockEvents, Event as LocalEvent } from '@/data/eventsData';
import { getEvents, getEventCategories, Event as ApiEvent, EventFilters, EventListResponse } from '@/services/api/eventApi';
import { ArrowUpDown, Calendar, Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define Category type locally since it's not exported from eventApi
interface Category {
  id: string;
  name: string;
}

// Function to map API event to our local event model
const mapApiToLocalEvent = (apiEvent: any): LocalEvent => {
  // Check if it's an IPL match with teams property
  const isIplMatch = !!apiEvent.teams;
  
  return {
    id: apiEvent.id,
    title: isIplMatch 
      ? `${apiEvent.teams.team1.name} vs ${apiEvent.teams.team2.name}`
      : apiEvent.title,
    description: apiEvent.description || '',
    date: apiEvent.date || apiEvent.startDate || '',
    time: apiEvent.time || (new Date(apiEvent.date || apiEvent.startDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    venue: apiEvent.venue || apiEvent.location || '',
    category: apiEvent.category || 'Event',
    duration: apiEvent.duration || '2-3 hours',
    image: apiEvent.imageUrl || apiEvent.image || '',
    posterImage: apiEvent.posterImage || apiEvent.imageUrl || apiEvent.image || '',
    ticketTypes: isIplMatch 
      ? apiEvent.ticketTypes.map((tt: any) => ({
          category: tt.category,
          price: tt.price,
          available: tt.available,
          capacity: tt.capacity || tt.available * 2
        }))
      : (apiEvent.ticketCategories || []).map((tc: any) => ({
          category: tc.name,
          price: tc.price,
          available: tc.availableQuantity || 0,
          capacity: tc.totalCapacity || tc.availableQuantity * 2 || 0
        })),
    featured: apiEvent.featured || false,
    discount: apiEvent.discount || null
  };
};

const Events = () => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<string>('date-asc');
  const [filters, setFilters] = useState<FilterOptions>({
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
      category: filters.categories.length ? filters.categories.join(',') : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: 1,
      limit: 50
    };
  };
  
  // Fetch events from API
  const { data: eventsData, isLoading, isError, error } = useQuery({
    queryKey: ['events', getApiFilters()],
    queryFn: () => getEvents(getApiFilters()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Fetch event categories
  const { data: categoriesData } = useQuery({
    queryKey: ['eventCategories'],
    queryFn: getEventCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });
  
  // Use API data, fallback to mock data if needed
  const events = eventsData?.events.map(mapApiToLocalEvent) || mockEvents;
  
  // Get all unique categories from events data
  const categories = categoriesData?.map((cat: Category) => cat.name) || 
    [...new Set(events.map(event => event.category))];

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Filter events based on search term, category, venue, and date
  const filteredEvents = events.filter(event => {
    // Filter by search term
    const matchesSearch = !filters.search || 
      event.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      (event.description && event.description.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Filter by category
    const matchesCategory = filters.categories.length === 0 || 
      filters.categories.includes(event.category);
    
    // Filter by date range
    let matchesDateRange = true;
    const eventDate = new Date(event.date);
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      matchesDateRange = matchesDateRange && eventDate >= startDate;
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      matchesDateRange = matchesDateRange && eventDate <= endDate;
    }
    
    // Filter by location (simplified for demo)
    const matchesLocation = !filters.location || 
      event.venue.toLowerCase().includes(filters.location.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesDateRange && matchesLocation;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'price-asc':
        return Math.min(...a.ticketTypes.map(t => t.price)) - Math.min(...b.ticketTypes.map(t => t.price));
      case 'price-desc':
        return Math.min(...b.ticketTypes.map(t => t.price)) - Math.min(...a.ticketTypes.map(t => t.price));
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="flex-grow pt-16 pb-20 md:pb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white py-16">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl md:text-5xl font-bold">{t('events.title', 'Events')}</h1>
                <LanguageSwitcher />
              </div>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                {t('events.subtitle', 'Browse and book tickets for upcoming events')}
              </p>
            </div>
          </div>
          
          {/* Search and Filter Section */}
          <div className="bg-white shadow-md py-6 sticky top-16 z-10">
            <div className="container mx-auto px-4">
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events, venues, or keywords..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              
              {/* Category Pills */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-3">Filter by Category:</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant={filters.categories.length === 0 ? 'default' : 'outline'} 
                    className="cursor-pointer py-1.5 px-3 text-sm font-medium"
                    onClick={() => setFilters({...filters, categories: []})}
                  >
                    All Categories
                  </Badge>
                  
                  {categories.map(category => (
                    <Badge 
                      key={category}
                      variant={filters.categories.includes(category) ? 'default' : 'outline'} 
                      className="cursor-pointer py-1.5 px-3 text-sm font-medium"
                      onClick={() => {
                        if (filters.categories.includes(category)) {
                          setFilters({
                            ...filters,
                            categories: filters.categories.filter(c => c !== category)
                          });
                        } else {
                          setFilters({
                            ...filters,
                            categories: [...filters.categories, category]
                          });
                        }
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Sort Controls */}
              <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-700">
                  Showing {sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'}
                  {filters.search && <span className="ml-1">for "{filters.search}"</span>}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] h-9 border-gray-300">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-asc">Date (Nearest first)</SelectItem>
                      <SelectItem value="date-desc">Date (Furthest first)</SelectItem>
                      <SelectItem value="price-asc">Price (Low to high)</SelectItem>
                      <SelectItem value="price-desc">Price (High to low)</SelectItem>
                      <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Events Grid */}
          <div className="py-12">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : isError ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                  <div className="text-6xl mb-6">⚠️</div>
                  <h2 className="text-2xl font-bold mb-3 text-gray-800">Error loading events</h2>
                  <p className="text-gray-600 text-lg">
                    We couldn't load the events. Please try again later.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-primary text-white hover:bg-primary/90"
                  >
                    Refresh Page
                  </Button>
                </div>
              ) : sortedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sortedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                  <div className="text-6xl mb-6">🎭</div>
                  <h2 className="text-2xl font-bold mb-3 text-gray-800">No events found</h2>
                  <p className="text-gray-600 text-lg">
                    Try adjusting your filters or search for something else.
                  </p>
                  <Button 
                    onClick={() => setFilters({
                      search: '',
                      categories: [],
                      startDate: null,
                      endDate: null,
                      location: null,
                      useCurrentLocation: false
                    })}
                    className="mt-6 px-6 py-2 text-primary hover:bg-blue-50"
                    variant="outline"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Events;
