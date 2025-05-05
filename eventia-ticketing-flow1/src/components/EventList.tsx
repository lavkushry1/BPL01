import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLoading, useNotifications } from '@/contexts/AppStateContext';
import { useApiGet } from '@/hooks/api/useApiQuery';
import usePagination from '@/hooks/usePagination';
import { memo, createPropsComparator } from '@/utils/memoization';

// Types for the data
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  venue: string;
  price: number;
  category: string;
}

interface EventsResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Extracted into separate memoized components for better performance

// Event Card Component - memoized to prevent re-rendering when parent changes
interface EventCardProps {
  event: Event;
}

const EventCard = memo<EventCardProps>(({ event }) => (
  <Link
    to={`/events/${event.id}`}
    className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
  >
    <div className="h-48 overflow-hidden">
      <img
        src={event.imageUrl}
        alt={event.title}
        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{event.title}</h2>
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
          {event.category}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <span className="text-primary font-bold">₹{event.price}</span>
      </div>
    </div>
  </Link>
));

// Pagination Component - extracted and memoized
interface PaginationControlsProps {
  pagination: ReturnType<typeof usePagination>;
}

const PaginationControls = memo<PaginationControlsProps>(({ pagination }) => {
  if (pagination.totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center mt-8">
      <nav className="inline-flex rounded-md shadow">
        <button
          onClick={pagination.previousPage}
          disabled={!pagination.hasPreviousPage}
          className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${
            pagination.hasPreviousPage
              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Previous
        </button>

        {pagination.pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => pagination.goToPage(page)}
            className={`relative inline-flex items-center px-4 py-2 border ${
              page === pagination.currentPage
                ? 'z-10 bg-primary border-primary text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={pagination.nextPage}
          disabled={!pagination.hasNextPage}
          className={`relative inline-flex items-center px-4 py-2 rounded-r-md border ${
            pagination.hasNextPage
              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </nav>
    </div>
  );
}, createPropsComparator<PaginationControlsProps>(['pagination']));

// Main EventList component
const EventList: React.FC = () => {
  const { isLoading: isGlobalLoading, showLoader, hideLoader } = useLoading();
  const { addNotification } = useNotifications();
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');

  // Create query key that changes when filters change
  const queryKey = useMemo(() => ['events', category, sortBy], [category, sortBy]);
  
  // Create API URL based on filters
  const apiUrl = useMemo(() => {
    return `/events${category ? `?category=${category}` : ''}${sortBy ? `${category ? '&' : '?'}sort=${sortBy}` : ''}`;
  }, [category, sortBy]);

  // Fetch events using React Query
  const {
    data: eventsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useApiGet<EventsResponse>(queryKey, apiUrl);

  // Setup pagination with the usePagination hook
  const pagination = usePagination({
    totalItems: eventsResponse?.total || 0,
    initialPageSize: 9,
  });

  // Show loader based on loading state
  useEffect(() => {
    if (isLoading) {
      showLoader();
    } else {
      hideLoader();
    }
    
    // Show error notifications
    if (isError && error) {
      addNotification({
        message: `Failed to load events: ${error.message}`,
        type: 'error',
      });
    }
  }, [isLoading, isError, error, showLoader, hideLoader, addNotification]);

  // Handle category filter change - memoized to prevent recreation on every render
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategory(value === 'all' ? null : value);
  }, []);

  // Handle sort change - memoized to prevent recreation on every render
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'date' | 'price');
  }, []);

  // Handle refresh button click - memoized
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Filter out events based on pagination
  const paginatedEvents = useMemo(() => {
    return eventsResponse ? pagination.paginatedItems(eventsResponse.data) : [];
  }, [eventsResponse, pagination]);

  // Render loading skeletons when data is loading
  const renderSkeletons = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-gray-100 animate-pulse rounded-lg overflow-hidden h-96"></div>
      ))}
    </div>
  ), []);

  // Render event cards when data is available
  const renderEventCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  ), [paginatedEvents]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Upcoming Events</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              value={category || 'all'}
              onChange={handleCategoryChange}
            >
              <option value="all">All Categories</option>
              <option value="concert">Concerts</option>
              <option value="sports">Sports</option>
              <option value="theater">Theater</option>
              <option value="comedy">Comedy</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>Error loading events. Please try again later.</p>
          <p className="text-sm">{error?.message}</p>
        </div>
      )}

      {isLoading && !paginatedEvents.length ? renderSkeletons : (
        <>
          {paginatedEvents.length > 0 ? renderEventCards : (
            <div className="text-center py-12">
              <h3 className="text-xl text-gray-600">No events found.</h3>
              <p className="mt-2 text-gray-500">Try changing your filters or check back later.</p>
            </div>
          )}
        </>
      )}

      {/* Pagination controls */}
      <PaginationControls pagination={pagination} />
    </div>
  );
};

export default memo(EventList); 