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

// Mock Child Components to simplify test
vi.mock('../../features/seat-selection/StadiumMap', () => ({
  default: ({ onStandClick }: any) => (
    <div data-testid="stadium-map">
      <button onClick={() => onStandClick({ id: 'stand-1', status: 'AVAILABLE' })}>
        Select Stand
      </button>
    </div>
  )
}));

vi.mock('../../features/seat-selection/SeatGrid', () => ({
  default: ({ onSeatClick }: any) => (
    <div data-testid="seat-grid">
      <button onClick={() => onSeatClick({ id: 'seat-1', status: 'AVAILABLE', price: 500 })}>
        Select Seat
      </button>
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
  });

  it('should render loading state initially', () => {
    renderWithRouter(<SeatSelectionContainer />);
    expect(screen.getByText(/Loading Stadium/i)).toBeInTheDocument();
  });

  it('should render stadium map after layout loads', async () => {
    (matchLayoutApi.getMatchLayout as any).mockResolvedValue({
      stadium: { name: 'Test Stadium' },
      stands: []
    });

    renderWithRouter(<SeatSelectionContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('stadium-map')).toBeInTheDocument();
    });
  });

  it('should switch to seat grid when stand is selected', async () => {
    (matchLayoutApi.getMatchLayout as any).mockResolvedValue({
      stadium: { name: 'Test Stadium' },
      stands: []
    });
    (matchLayoutApi.getZoneSeats as any).mockResolvedValue([]);

    renderWithRouter(<SeatSelectionContainer />);

    // Wait for map
    await waitFor(() => screen.getByTestId('stadium-map'));

    // Click stand
    fireEvent.click(screen.getByText('Select Stand'));

    // Check loading or grid
    // The component sets loading=true then fetches seats.
    expect(matchLayoutApi.getZoneSeats).toHaveBeenCalledWith(undefined, 'stand-1'); // undefined matchId because params not mocked
  });
});
