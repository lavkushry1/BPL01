import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EventSeatingMap from '../../../components/booking/EventSeatingMap';
import { useSeatsQuery } from '../../../hooks/useSeatsQuery';
import { ticketReducer } from '../../../store/ticketSlice';

// Mock the hooks and API
vi.mock('../../../hooks/useSeatsQuery', () => ({
  useSeatsQuery: vi.fn()
}));

describe('EventSeatingMap Component', () => {
  // Setup store and providers
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  let store;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    store = configureStore({
      reducer: {
        tickets: ticketReducer
      }
    });
    
    // Default mock implementation
    (useSeatsQuery as any).mockReturnValue({
      data: {
        sections: ['Premium', 'General'],
        seats: {
          'Premium': [
            { id: 'seat-1', label: 'A-1', status: 'AVAILABLE', price: 100 },
            { id: 'seat-2', label: 'A-2', status: 'AVAILABLE', price: 100 },
            { id: 'seat-3', label: 'A-3', status: 'BOOKED', price: 100 }
          ],
          'General': [
            { id: 'seat-4', label: 'B-1', status: 'AVAILABLE', price: 50 }
          ]
        }
      },
      isLoading: false,
      isError: false,
      error: null
    });
  });
  
  it('should display sections and available seats', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Check if sections are rendered
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    
    // Check if seats are rendered
    expect(screen.getByText('A-1')).toBeInTheDocument();
    expect(screen.getByText('A-2')).toBeInTheDocument();
    expect(screen.getByText('A-3')).toBeInTheDocument();
    expect(screen.getByText('B-1')).toBeInTheDocument();
  });
  
  it('should allow selecting an available seat', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Click on an available seat
    fireEvent.click(screen.getByText('A-1'));
    
    // Verify the seat is marked as selected
    await waitFor(() => {
      // Check if seat appears in selected tickets display
      expect(screen.getByText('Selected: 1')).toBeInTheDocument();
      
      // Check if the ticket was added to Redux store
      const state = store.getState();
      expect(state.tickets.items).toHaveLength(1);
      expect(state.tickets.items[0].label).toBe('A-1');
    });
  });
  
  it('should not allow selecting a booked seat', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Click on a booked seat
    fireEvent.click(screen.getByText('A-3'));
    
    // Verify the seat was not added
    expect(store.getState().tickets.items).toHaveLength(0);
  });
  
  it('should display loading state', () => {
    // Override the default mock for this test
    (useSeatsQuery as any).mockReturnValue({
      isLoading: true,
      data: null,
      isError: false,
      error: null
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Check if loading indicator is displayed
    expect(screen.getByText('Loading seat map...')).toBeInTheDocument();
  });
  
  it('should display error state', () => {
    // Override the default mock for this test
    (useSeatsQuery as any).mockReturnValue({
      isLoading: false,
      data: null,
      isError: true,
      error: new Error('Failed to load seats')
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Check if error message is displayed
    expect(screen.getByText('Error loading seat map')).toBeInTheDocument();
  });
  
  it('should allow deselecting a selected seat', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // First select a seat
    fireEvent.click(screen.getByText('A-1'));
    
    // Wait for selection to update
    await waitFor(() => {
      expect(screen.getByText('Selected: 1')).toBeInTheDocument();
    });
    
    // Then deselect the same seat
    fireEvent.click(screen.getByText('A-1'));
    
    // Verify the seat was removed
    await waitFor(() => {
      expect(store.getState().tickets.items).toHaveLength(0);
    });
  });
  
  it('should show seat price and relevant information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <EventSeatingMap eventId="event-1" />
        </Provider>
      </QueryClientProvider>
    );
    
    // Check if price information is displayed
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('₹50')).toBeInTheDocument();
  });
}); 