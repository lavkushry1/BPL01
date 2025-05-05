/**
 * @file useEvents.ts
 * @description Custom React hooks for event-related API calls
 * Provides typed React Query hooks for fetching and managing events
 */

import { 
  useQuery, 
  useMutation, 
  UseQueryOptions, 
  UseMutationOptions,
  QueryClient,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
  useSuspenseQuery
} from '@tanstack/react-query';
import { eventService } from '@/services/api/eventService';
import { 
  Event, 
  EventFilters, 
  EventInput, 
  IPLMatch,
  Category
} from '@/types/events';
import { PaginatedResponse } from '@/types/api';
import { AxiosError } from 'axios';
import apiClient from '@/lib/api-client';

/**
 * Constants for query keys
 */
export const EVENTS_QUERY_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: EventFilters) => [...EVENTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...EVENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENTS_QUERY_KEYS.details(), id] as const,
  ipl: () => [...EVENTS_QUERY_KEYS.all, 'ipl'] as const,
  categories: () => [...EVENTS_QUERY_KEYS.all, 'categories'] as const,
};

/**
 * Fetch events with optional filtering
 */
export const fetchEvents = async (filters?: EventFilters): Promise<Event[]> => {
  // Build query params
  const queryParams = new URLSearchParams();
  if (filters) {
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
  }

  const response = await apiClient.get(`/events?${queryParams.toString()}`);
  return response.data.data.events || [];
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (eventId: string): Promise<Event> => {
  const response = await apiClient.get(`/events/${eventId}`);
  return response.data.data;
};

/**
 * Fetch IPL matches specifically
 */
export const fetchIPLMatches = async (): Promise<IPLMatch[]> => {
  const response = await apiClient.get('/events?category=Cricket,IPL&status=published');
  return response.data.data.events
    .filter((event: any) => event.teams || 
      (event.category && ['ipl', 'cricket'].includes(event.category.toLowerCase())) ||
      (event.title && event.title.toLowerCase().includes('ipl')));
};

/**
 * Fetch event categories
 */
export const fetchEventCategories = async () => {
  const response = await apiClient.get('/events/categories');
  return response.data.data;
};

/**
 * Hook for fetching events with filtering
 */
export function useEvents(
  filters?: EventFilters, 
  options?: UseQueryOptions<Event[], Error, Event[], ReturnType<typeof EVENTS_QUERY_KEYS.list>>
) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.list(filters || {}),
    queryFn: () => fetchEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
    retry: (failureCount, error) => {
      // Don't retry on 404, 401, 403 responses
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 404 || status === 401 || status === 403) return false;
      }
      // Only retry twice for other errors
      return failureCount < 2;
    },
    ...options,
  });
}

/**
 * Hook for fetching events with Suspense support (React 18+)
 */
export function useSuspenseEvents(
  filters?: EventFilters, 
  options?: Omit<UseQueryOptions<Event[], Error, Event[], ReturnType<typeof EVENTS_QUERY_KEYS.list>>, 'suspense'>
) {
  return useSuspenseQuery({
    queryKey: EVENTS_QUERY_KEYS.list(filters || {}),
    queryFn: () => fetchEvents(filters),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook for prefetching events (useful for pagination or anticipated navigation)
 */
export function usePrefetchEvents() {
  const queryClient = useQueryClient();
  
  return {
    prefetchEvents: async (filters?: EventFilters) => {
      await queryClient.prefetchQuery({
        queryKey: EVENTS_QUERY_KEYS.list(filters || {}),
        queryFn: () => fetchEvents(filters),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchEvent: async (eventId: string) => {
      await queryClient.prefetchQuery({
        queryKey: EVENTS_QUERY_KEYS.detail(eventId),
        queryFn: () => fetchEventById(eventId),
        staleTime: 5 * 60 * 1000,
      });
    }
  };
}

/**
 * Hook for fetching a single event
 */
export function useEvent(
  eventId: string,
  options?: UseQueryOptions<Event, Error, Event, ReturnType<typeof EVENTS_QUERY_KEYS.detail>>
) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.detail(eventId),
    queryFn: () => fetchEventById(eventId),
    enabled: !!eventId, // Only run the query if we have an eventId
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching IPL matches
 */
export function useIPLMatches(
  options?: UseQueryOptions<IPLMatch[], Error, IPLMatch[], ReturnType<typeof EVENTS_QUERY_KEYS.ipl>>
) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.ipl(),
    queryFn: fetchIPLMatches,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching event categories
 */
export function useEventCategories(
  options?: UseQueryOptions<any, Error, any, ReturnType<typeof EVENTS_QUERY_KEYS.categories>>
) {
  return useQuery({
    queryKey: EVENTS_QUERY_KEYS.categories(),
    queryFn: fetchEventCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories change less frequently
    ...options,
  });
}

/**
 * Hook for infinite scrolling events list
 */
export function useInfiniteEvents(
  filters?: Omit<EventFilters, 'page'>,
  options?: Omit<UseQueryOptions<Event[], Error>, 'queryKey' | 'queryFn' | 'getNextPageParam'>
) {
  return useInfiniteQuery({
    queryKey: [...EVENTS_QUERY_KEYS.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchEvents({ 
      ...filters, 
      page: pageParam as number, 
      limit: 10 
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Event[], allPages) => {
      // If last page has events, return the next page number
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for creating a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: EventInput) => {
      const response = await apiClient.post('/events', eventData);
      return response.data.data;
    },
    onMutate: async (newEvent) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(EVENTS_QUERY_KEYS.lists());
      
      // Optimistically add the new event to the query cache
      queryClient.setQueryData(EVENTS_QUERY_KEYS.lists(), (old: any) => {
        // Create a fake ID for the optimistic event
        const optimisticEvent = {
          ...newEvent,
          id: 'temp-' + Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add other required fields for the UI
          isOptimistic: true
        };
        
        // If the old data is an array, add the new event
        if (Array.isArray(old)) {
          return [optimisticEvent, ...old];
        }
        
        // If it's not an array (possibly undefined), return a new array
        return [optimisticEvent];
      });
      
      // Return a context object with the snapshot
      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      // If the mutation fails, use the context we returned above
      if (context?.previousEvents) {
        queryClient.setQueryData(EVENTS_QUERY_KEYS.lists(), context.previousEvents);
      }
    },
    onSuccess: () => {
      // Invalidate events queries to refetch data
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for updating an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventInput> }) => {
      const response = await apiClient.put(`/events/${id}`, data);
      return response.data.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.detail(id) });
      
      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData(EVENTS_QUERY_KEYS.detail(id));
      
      // Optimistically update to the new value
      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(id), (old: any) => {
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });
      
      // Also update in lists if present
      queryClient.setQueriesData({ queryKey: EVENTS_QUERY_KEYS.lists() }, (oldData: any) => {
        // Skip if no old data
        if (!oldData) return oldData;
        
        // If it's an array, update the event in the list
        if (Array.isArray(oldData)) {
          return oldData.map(event => 
            event.id === id 
              ? { ...event, ...data, updatedAt: new Date().toISOString() } 
              : event
          );
        }
        
        return oldData;
      });
      
      // Return the snapshot
      return { previousEvent };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousEvent) {
        queryClient.setQueryData(
          EVENTS_QUERY_KEYS.detail(variables.id),
          context.previousEvent
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update specific event in cache
      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(variables.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
    },
    onSettled: (data, error, variables) => {
      // Always refetch the specific event after error or success
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.detail(variables.id) });
    },
  });
}

/**
 * Hook for deleting an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.delete(`/events/${eventId}`);
      return response.data;
    },
    onMutate: async (eventId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.detail(eventId) });
      await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
      
      // Snapshot the previous values
      const previousEvent = queryClient.getQueryData(EVENTS_QUERY_KEYS.detail(eventId));
      const previousEvents = queryClient.getQueryData(EVENTS_QUERY_KEYS.lists());
      
      // Optimistically remove the event from any lists
      queryClient.setQueriesData({ queryKey: EVENTS_QUERY_KEYS.lists() }, (old: any) => {
        if (Array.isArray(old)) {
          return old.filter(event => event.id !== eventId);
        }
        return old;
      });
      
      // Return the snapshots
      return { previousEvent, previousEvents };
    },
    onError: (err, eventId, context) => {
      // If the mutation fails, restore from snapshots
      if (context?.previousEvent) {
        queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(eventId), context.previousEvent);
      }
      if (context?.previousEvents) {
        queryClient.setQueryData(EVENTS_QUERY_KEYS.lists(), context.previousEvents);
      }
    },
    onSuccess: (_, eventId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(eventId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.lists() });
    },
  });
} 