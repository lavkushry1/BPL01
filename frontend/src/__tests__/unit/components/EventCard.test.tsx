import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { mockEvents } from '../../mocks/api';
import { EventCard } from '../../../components/EventCard';
import { formatDate } from '../../../utils/dateUtils';

describe('EventCard', () => {
  const event = mockEvents[0];
  
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };
  
  test('renders event title correctly', () => {
    renderWithRouter(<EventCard event={event} />);
    expect(screen.getByText(event.title)).toBeInTheDocument();
  });
  
  test('renders event date and location correctly', () => {
    renderWithRouter(<EventCard event={event} />);
    
    // Check if the formatted date is displayed
    const formattedDate = formatDate(new Date(event.startDate));
    expect(screen.getByText(new RegExp(formattedDate))).toBeInTheDocument();
    
    // Check if location is displayed
    expect(screen.getByText(event.location)).toBeInTheDocument();
  });
  
  test('renders event description with truncation if too long', () => {
    // Create an event with a very long description
    const longDescEvent = {
      ...event,
      description: 'This is a very long description that should be truncated when displayed on the event card to ensure that it does not take up too much space and maintains a clean design on the card layout.'
    };
    
    renderWithRouter(<EventCard event={longDescEvent} />);
    
    // The description should be truncated (not showing the full text)
    expect(screen.queryByText(longDescEvent.description)).not.toBeInTheDocument();
    
    // But should show part of it with ellipsis
    expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });
  
  test('renders event image if available', () => {
    renderWithRouter(<EventCard event={event} />);
    
    // Get the image element
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', event.images[0].url);
    expect(image).toHaveAttribute('alt', event.title);
  });
  
  test('renders default image if no event image available', () => {
    // Create an event without images
    const noImageEvent = {
      ...event,
      images: undefined
    };
    
    renderWithRouter(<EventCard event={noImageEvent} />);
    
    // Should render a default image
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('default-event'));
    expect(image).toHaveAttribute('alt', noImageEvent.title);
  });
  
  test('renders "Sold Out" badge if event is sold out', () => {
    // Create a sold out event
    const soldOutEvent = {
      ...event,
      isSoldOut: true
    };
    
    renderWithRouter(<EventCard event={soldOutEvent} />);
    
    // Should render a sold out badge
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument();
  });
  
  test('renders the lowest price from ticket categories', () => {
    renderWithRouter(<EventCard event={event} />);
    
    // The lowest price should be displayed from the ticket categories
    const lowestPrice = Math.min(...event.ticketCategories.map(tc => tc.price));
    expect(screen.getByText(new RegExp(`\\$${lowestPrice}`))).toBeInTheDocument();
  });
}); 