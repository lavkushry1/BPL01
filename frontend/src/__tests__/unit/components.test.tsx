import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import StadiumMap from '../../features/seat-selection/StadiumMap';
import SeatGrid from '../../features/seat-selection/SeatGrid';
import SeatCart from '../../features/seat-selection/SeatCart';
import { LayoutStandSummary, ZoneSeatDetail } from '../../services/api/matchLayoutApi';

describe('Seat Selection Components', () => {
  
  describe('StadiumMap', () => {
    const mockLayout = {
      stadium: { id: 's1', name: 'Test Stadium', viewBox: '0 0 100 100' },
      stands: [
        { id: '1', name: 'North', code: 'N', svgPath: 'M0 0', status: 'AVAILABLE', minPrice: 500, maxPrice: 1000, availableSeats: 100, totalSeats: 200 },
        { id: '2', name: 'South', code: 'S', svgPath: 'M10 10', status: 'SOLD_OUT', minPrice: 500, maxPrice: 1000, availableSeats: 0, totalSeats: 200 },
        { id: '3', name: 'East', code: 'E', svgPath: 'M20 20', status: 'FAST_FILLING', minPrice: 2500, maxPrice: 3000, availableSeats: 10, totalSeats: 200 },
      ] as LayoutStandSummary[]
    };
    const onStandClick = vi.fn();

    it('should render all stands with correct colors based on status and price', () => {
      render(<StadiumMap layout={mockLayout} onStandClick={onStandClick} />);
      
      const stands = document.querySelectorAll('path.stand-polygon');
      expect(stands).toHaveLength(3);

      // Check Available (Standard Green)
      expect(stands[0]).toHaveAttribute('fill', '#22C55E'); 
      
      // Check Sold Out (Gray)
      expect(stands[1]).toHaveAttribute('fill', '#D1D5DB');

      // Check Fast Filling (price bucket fill + orange border)
      expect(stands[2]).toHaveAttribute('fill', '#8B5CF6');
      expect(stands[2]).toHaveAttribute('stroke', '#F97316');
    });

    it('should handle click events on stands', () => {
      render(<StadiumMap layout={mockLayout} onStandClick={onStandClick} />);
      const stand = document.querySelectorAll('path.stand-polygon')[0];
      
      // We need to trigger click on the group <g> usually, but in the component onClick is on the group.
      // Testing library usually clicks the element found by text/role.
      // Since SVG doesn't expose roles easily without aria, let's try finding by title text.
      // Note: title element inside SVG might not be clickable directly in JSDOM the same way.
      // Let's use the container or selector.
      
      fireEvent.click(stand);
      expect(onStandClick).toHaveBeenCalledWith(mockLayout.stands[0]);
    });

    it('should display correct tooltips/titles', () => {
      render(<StadiumMap layout={mockLayout} onStandClick={onStandClick} />);
      expect(screen.getByText('North | Starts at ₹500 | Available')).toBeInTheDocument();
      expect(screen.getByText('South | Sold Out')).toBeInTheDocument();
    });
  });

  describe('SeatGrid', () => {
    const mockSeats: ZoneSeatDetail[] = [
      { id: 's1', seatNumber: '1', rowLabel: 'A', status: 'AVAILABLE', price: 500, type: 'STD', grid: { row: 1, col: 1 } },
      { id: 's2', seatNumber: '2', rowLabel: 'A', status: 'BOOKED', price: 500, type: 'STD', grid: { row: 1, col: 2 } },
      { id: 's3', seatNumber: '3', rowLabel: 'A', status: 'LOCKED', price: 500, type: 'STD', grid: { row: 1, col: 3 } },
      { id: 's4', seatNumber: '1', rowLabel: 'B', status: 'AVAILABLE', price: 500, type: 'STD', grid: { row: 2, col: 1 } },
    ];
    const mockStand = { name: 'North Stand' } as any;
    const onSeatClick = vi.fn();

    it('should render loading state', () => {
      render(<SeatGrid seats={[]} selectedStand={null} cart={[]} onSeatClick={onSeatClick} loading={true} />);
      expect(screen.getByText('Loading seat map...')).toBeInTheDocument();
    });

    it('should render seats grouped by rows', () => {
      render(<SeatGrid seats={mockSeats} selectedStand={mockStand} cart={[]} onSeatClick={onSeatClick} loading={false} />);
      expect(screen.getByText('North Stand')).toBeInTheDocument();
      expect(screen.getByText('2 seats available')).toBeInTheDocument(); // A1 and B1 are available
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should apply correct styling based on status and cart selection', () => {
      const cart = [mockSeats[3]]; // B1 is selected
      render(<SeatGrid seats={mockSeats} selectedStand={mockStand} cart={cart} onSeatClick={onSeatClick} loading={false} />);
      
      const buttons = screen.getAllByRole('button');
      // Total 4 seats
      
      // A1 (Available) -> White/Blue hover
      expect(buttons[0]).toHaveClass('bg-white'); 
      
      // A2 (Booked) -> Gray, Disabled
      expect(buttons[1]).toBeDisabled();
      expect(buttons[1]).toHaveClass('bg-gray-200');

      // A3 (Locked) -> Red, Disabled (via class logic check, button disabled prop might differ if logic says so)
      // Logic in component: disabled={seat.status !== 'AVAILABLE'} -> Locked is not available.
      expect(buttons[2]).toBeDisabled();
      expect(buttons[2]).toHaveClass('bg-red-100');

      // B1 (Selected) -> Green
      expect(buttons[3]).toHaveClass('bg-green-500');
    });

    it('should trigger click for available seats', () => {
      render(<SeatGrid seats={mockSeats} selectedStand={mockStand} cart={[]} onSeatClick={onSeatClick} loading={false} />);
      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]); // A1
      expect(onSeatClick).toHaveBeenCalledWith(mockSeats[0]);
    });
  });

  describe('SeatCart', () => {
    const mockCart: ZoneSeatDetail[] = [
      { id: 's1', seatNumber: '1', rowLabel: 'A', status: 'AVAILABLE', price: 500, type: 'STD', grid: { row: 1, col: 1 } },
      { id: 's2', seatNumber: '2', rowLabel: 'A', status: 'AVAILABLE', price: 1000, type: 'VIP', grid: { row: 1, col: 2 } },
    ];
    const onProceed = vi.fn();

    it('should display correct total count and price', () => {
      render(<SeatCart cart={mockCart} onProceed={onProceed} />);
      expect(screen.getByText('2 Seats')).toBeInTheDocument();
      expect(screen.getByText('₹1,500')).toBeInTheDocument(); // 500 + 1000
    });

    it('should list seat labels', () => {
      render(<SeatCart cart={mockCart} onProceed={onProceed} />);
      expect(screen.getByText('A-1, A-2')).toBeInTheDocument();
    });

    it('should trigger proceed action', () => {
      render(<SeatCart cart={mockCart} onProceed={onProceed} />);
      fireEvent.click(screen.getByText(/Proceed to Pay/i));
      expect(onProceed).toHaveBeenCalled();
    });
  });
});
