import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SeatSelectionContainer from '../../features/seat-selection/SeatSelectionContainer';
import matchLayoutApi from '../../services/api/matchLayoutApi';
import { BrowserRouter } from 'react-router-dom';

// Mock API
vi.mock('../../services/api/matchLayoutApi', () => ({
  default: {
    getMatchLayout: vi.fn(),
    getZoneSeats: vi.fn()
  }
}));

// Mock Child Components to simplify test and isolate container logic
vi.mock('../../features/seat-selection/StadiumMap', () => ({
  default: ({ onStandClick }: any) => (
    <div data-testid="stadium-map">
      <button onClick={() => onStandClick({ id: 'stand-1', status: 'AVAILABLE' })}>Select Stand</button>
      <button onClick={() => onStandClick({ id: 'stand-sold', status: 'SOLD_OUT' })}>Select Sold Out Stand</button>
    </div>
  )
}));

vi.mock('../../features/seat-selection/SeatGrid', () => ({
  default: ({ onSeatClick, cart }: any) => (
    <div data-testid="seat-grid">
      <button onClick={() => onSeatClick({ id: 'seat-1', status: 'AVAILABLE', price: 500 })}>Select Seat 1</button>
      <button onClick={() => onSeatClick({ id: 'seat-2', status: 'AVAILABLE', price: 500 })}>Select Seat 2</button>
      <button onClick={() => onSeatClick({ id: 'seat-3', status: 'AVAILABLE', price: 500 })}>Select Seat 3</button>
      <button onClick={() => onSeatClick({ id: 'seat-4', status: 'AVAILABLE', price: 500 })}>Select Seat 4</button>
      <button onClick={() => onSeatClick({ id: 'seat-5', status: 'AVAILABLE', price: 500 })}>Select Seat 5</button>
      <button onClick={() => onSeatClick({ id: 'seat-booked', status: 'BOOKED', price: 500 })}>Select Booked Seat</button>
      <div data-testid="cart-count">{cart.length}</div>
    </div>
  )
}));

vi.mock('../../features/seat-selection/SeatCart', () => ({
  default: ({ onProceed }: any) => (
    <div data-testid="seat-cart">
      <button onClick={onProceed}>Proceed</button>
    </div>
  )
}));

// Wrapper for Router context
const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SeatSelectionContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success mock
    (matchLayoutApi.getMatchLayout as any).mockResolvedValue({
      stadium: { name: 'Test Stadium' },
      stands: []
    });
  });

  it('should render loading state initially', () => {
    renderWithRouter(<SeatSelectionContainer />);
    expect(screen.getByText(/Loading Stadium/i)).toBeInTheDocument();
  });

  it('should handle API error for layout', async () => {
    (matchLayoutApi.getMatchLayout as any).mockRejectedValue(new Error('Failed'));
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load stadium layout')).toBeInTheDocument();
    });
  });

  it('should prevent clicking sold out stands', async () => {
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    
    fireEvent.click(screen.getByText('Select Sold Out Stand'));
    
    // Should NOT fetch zone seats or switch view
    expect(matchLayoutApi.getZoneSeats).not.toHaveBeenCalled();
    expect(screen.queryByTestId('seat-grid')).not.toBeInTheDocument();
  });

  it('should handle API error for zone seats gracefully (revert to map)', async () => {
    (matchLayoutApi.getZoneSeats as any).mockRejectedValue(new Error('Failed'));
    
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    
    fireEvent.click(screen.getByText('Select Stand'));
    
    // Should try to fetch
    expect(matchLayoutApi.getZoneSeats).toHaveBeenCalled();
    
    // Should stay on map (or revert to it)
    await waitFor(() => {
        expect(screen.getByTestId('stadium-map')).toBeInTheDocument();
    });
  });

  it('should handle back to map navigation', async () => {
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    
    fireEvent.click(screen.getByText('Select Stand'));
    await waitFor(() => screen.getByTestId('seat-grid'));
    
    fireEvent.click(screen.getByText('← Back to Stadium'));
    expect(screen.getByTestId('stadium-map')).toBeInTheDocument();
  });

  it('should add and remove seats from cart', async () => {
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    fireEvent.click(screen.getByText('Select Stand'));
    await waitFor(() => screen.getByTestId('seat-grid'));

    // Select Seat 1
    fireEvent.click(screen.getByText('Select Seat 1'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('seat-cart')).toBeInTheDocument();

    // Deselect Seat 1
    fireEvent.click(screen.getByText('Select Seat 1'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.queryByTestId('seat-cart')).not.toBeInTheDocument();
  });

  it('should not allow selecting booked seats', async () => {
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    fireEvent.click(screen.getByText('Select Stand'));
    await waitFor(() => screen.getByTestId('seat-grid'));

    fireEvent.click(screen.getByText('Select Booked Seat'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should enforce max seat limit (4)', async () => {
    // Mock alert
    window.alert = vi.fn();
    
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    fireEvent.click(screen.getByText('Select Stand'));
    await waitFor(() => screen.getByTestId('seat-grid'));

    // Select 4 seats
    fireEvent.click(screen.getByText('Select Seat 1'));
    fireEvent.click(screen.getByText('Select Seat 2'));
    fireEvent.click(screen.getByText('Select Seat 3'));
    fireEvent.click(screen.getByText('Select Seat 4'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('4');

    // Try 5th
    fireEvent.click(screen.getByText('Select Seat 5'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('4');
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('only select up to 4'));
  });

  it('should handle proceed action', async () => {
    window.alert = vi.fn();
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);
    renderWithRouter(<SeatSelectionContainer />);
    await waitFor(() => screen.getByTestId('stadium-map'));
    fireEvent.click(screen.getByText('Select Stand'));
    await waitFor(() => screen.getByTestId('seat-grid'));
    
    fireEvent.click(screen.getByText('Select Seat 1'));
    fireEvent.click(screen.getByText('Proceed'));
    
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Proceeding to checkout'));
  });
});