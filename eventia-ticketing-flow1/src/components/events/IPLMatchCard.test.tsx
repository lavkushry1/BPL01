import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IPLMatchCard from './IPLMatchCard';
import { vi } from 'vitest';

// Mock the translations
vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string, fallback: string) => fallback,
    };
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockProps = {
  id: 'ipl1',
  title: 'IPL 2025: Opening Match',
  posterUrl: '/test-image.jpg',
  date: '2025-03-28',
  time: '19:30',
  venue: 'Wankhede Stadium, Mumbai',
  startingPrice: 1000,
  featured: false,
  teams: {
    team1: {
      name: 'Mumbai Indians',
      shortName: 'MI',
      logo: '/mi-logo.png',
    },
    team2: {
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      logo: '/csk-logo.png',
    },
  },
};

// Helper to render with BrowserRouter
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('IPLMatchCard', () => {
  // Basic rendering test
  test('renders card with correct match information', () => {
    renderWithRouter(<IPLMatchCard {...mockProps} />);
    
    // Check title
    expect(screen.getByText('IPL 2025: Opening Match')).toBeInTheDocument();
    
    // Check team information
    expect(screen.getByText('MI')).toBeInTheDocument();
    expect(screen.getByText('CSK')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    
    // Check price
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    
    // Check that venue is displayed
    expect(screen.getByText('Wankhede Stadium')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Book Now')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  // Test featured ribbon display
  test('displays featured ribbon when featured prop is true', () => {
    renderWithRouter(<IPLMatchCard {...mockProps} featured={true} />);
    expect(screen.getByText('HOT')).toBeInTheDocument();
  });

  // Test missing ID handling
  test('returns null when id is missing', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderWithRouter(<IPLMatchCard {...mockProps} id="" />);
    
    expect(container.firstChild).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  // Test image error handling
  test('displays fallback image when image fails to load', () => {
    renderWithRouter(<IPLMatchCard {...mockProps} />);
    
    const posterImage = screen.getByAltText(/IPL Match: Mumbai Indians vs Chennai Super Kings poster/i);
    fireEvent.error(posterImage);
    
    // Check if the image src has been changed to fallback
    expect(posterImage.getAttribute('src')).toBe('/placeholder.svg');
  });

  // Test custom alt text
  test('uses custom alt text when provided', () => {
    renderWithRouter(<IPLMatchCard {...mockProps} altText="Custom alt text" />);
    
    expect(screen.getByAltText('Custom alt text')).toBeInTheDocument();
  });

  // Test price formatting
  test('formats price correctly', () => {
    renderWithRouter(<IPLMatchCard {...mockProps} startingPrice={12345} />);
    
    expect(screen.getByText('₹12,345')).toBeInTheDocument();
  });

  // Test venue truncation
  test('truncates venue name correctly', () => {
    renderWithRouter(
      <IPLMatchCard 
        {...mockProps} 
        venue="Extremely Long Venue Name That Should Be Truncated, City, State"
      />
    );
    
    // Should only display the first part before the comma
    expect(screen.getByText('Extremely Long Venue Name That Should Be Truncated')).toBeInTheDocument();
  });
}); 