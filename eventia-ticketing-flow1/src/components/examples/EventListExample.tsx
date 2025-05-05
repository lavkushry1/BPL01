/**
 * @file EventListExample.tsx
 * @description Example component demonstrating the new API architecture
 * Shows the usage of custom hooks and the new service-based approach
 */

import React, { useState } from 'react';
import { useEvents, useEventCategories } from '@/hooks/api/useEvents';
import { EventFilters } from '@/types/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example component that demonstrates the new API architecture
 */
const EventListExample: React.FC = () => {
  // State for filters
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 10,
    search: '',
    category: undefined
  });

  // Use custom hooks to fetch data
  const { 
    data: eventsData, 
    isLoading: isLoadingEvents, 
    error: eventsError 
  } = useEvents(filters);
  
  const { 
    data: categories, 
    isLoading: isLoadingCategories 
  } = useEventCategories();

  // Update filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle loading state
  if (isLoadingEvents && !eventsData) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Handle error state
  if (eventsError) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error loading events</h3>
        <p className="text-red-600">{(eventsError as Error).message}</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => setFilters(prev => ({ ...prev }))}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-muted-foreground">
          Browse upcoming events using our new API architecture
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        <div className="w-48">
          <Select 
            value={filters.category || ''} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories?.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {eventsData?.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No events found</p>
          </div>
        ) : (
          eventsData?.items.map(event => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {event.start_date || event.date}
                    </p>
                    <p className="text-sm">
                      {event.venue || event.location}
                    </p>
                  </div>
                  <div>
                    {event.ticket_types.length > 0 && (
                      <p className="font-medium">
                        From ₹{Math.min(...event.ticket_types.map(t => t.price))}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {eventsData && eventsData.totalPages > 1 && (
        <div className="flex justify-center gap-2 py-4">
          <Button
            variant="outline"
            disabled={filters.page === 1}
            onClick={() => handlePageChange(filters.page! - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={filters.page === eventsData.totalPages}
            onClick={() => handlePageChange(filters.page! + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventListExample; 