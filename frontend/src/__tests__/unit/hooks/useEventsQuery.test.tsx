import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventsQuery } from '../../../hooks/useEventsQuery';
import { useEventsApi } from '../../../api/events';

// Mock the API module
vi.mock('../../../api/events', () => ({
  useEventsApi: vi.fn()
}));

describe('useEventsQuery Hook', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });
  
  it('should fetch events with cursor pagination', async () => {
    // Mock implementation
    const mockGetEvents = vi.fn().mockResolvedValue({
      events: [{ id: 'event1', title: 'Event 1' }],
      pagination: { 
        nextCursor: 'next-cursor',
        hasMore: true,
        limit: 10
      }
    });
    
    (useEventsApi as any).mockReturnValue({
      getEvents: mockGetEvents
    });
    
    // Render the hook
    const { result } = renderHook(() => useEventsQuery({
      limit: 10
    }), { wrapper });
    
    // Wait for the initial query to resolve
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Check results
    expect(result.current.data.events).toHaveLength(1);
    expect(result.current.data.events[0].title).toBe('Event 1');
    expect(result.current.data.pagination.nextCursor).toBe('next-cursor');
    
    // Test fetching next page
    await result.current.fetchNextPage();
    
    // Verify API was called with correct cursor
    expect(mockGetEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: 'next-cursor',
        limit: 10
      })
    );
  });
  
  it('should handle error states correctly', async () => {
    // Mock error
    const mockError = new Error('API Error');
    const mockGetEvents = vi.fn().mockRejectedValue(mockError);
    
    (useEventsApi as any).mockReturnValue({
      getEvents: mockGetEvents
    });
    
    // Render the hook
    const { result } = renderHook(() => useEventsQuery({
      limit: 10
    }), { wrapper });
    
    // Wait for error state
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    // Check error state
    expect(result.current.error).toBeDefined();
  });

  it('should refetch when filters change', async () => {
    const mockGetEvents = vi.fn().mockResolvedValue({
      events: [{ id: 'event1', title: 'Event 1' }],
      pagination: { 
        nextCursor: 'next-cursor',
        hasMore: true,
        limit: 10
      }
    });
    
    (useEventsApi as any).mockReturnValue({
      getEvents: mockGetEvents
    });
    
    // Render the hook with initial filters
    const { result, rerender } = renderHook(
      (props) => useEventsQuery(props), 
      { 
        wrapper, 
        initialProps: { limit: 10, category: 'sports' }
      }
    );
    
    // Wait for the initial query to resolve
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify initial API call
    expect(mockGetEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        category: 'sports'
      })
    );
    
    // Rerender with new filters
    rerender({ limit: 20, category: 'music' });
    
    // Wait for the query to resolve with new filters
    await waitFor(() => expect(mockGetEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        category: 'music'
      })
    ));
  });

  it('should handle empty results correctly', async () => {
    // Mock empty results
    const mockGetEvents = vi.fn().mockResolvedValue({
      events: [],
      pagination: { 
        nextCursor: null,
        hasMore: false,
        limit: 10
      }
    });
    
    (useEventsApi as any).mockReturnValue({
      getEvents: mockGetEvents
    });
    
    // Render the hook
    const { result } = renderHook(() => useEventsQuery({
      limit: 10
    }), { wrapper });
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Check empty results
    expect(result.current.data.events).toHaveLength(0);
    expect(result.current.data.pagination.hasMore).toBe(false);
    expect(result.current.data.pagination.nextCursor).toBeNull();
  });
}); 