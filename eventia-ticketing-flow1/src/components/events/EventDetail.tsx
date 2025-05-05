import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventInfo } from './EventInfo';
import { TicketSelector, TicketType, SelectedTicket } from './TicketSelector';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string; // Required in the interface
  zipCode: string;
  country: string;
  location?: {
    latitude: number;
    longitude: number;
  }
}

export interface Organizer {
  id: string;
  name: string;
  description: string; // Required in the interface
  logoUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  }
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string; // Required in the interface
  startTime: string;
  endTime: string; // Changed to required
  speaker?: string;
  speakers?: string[];
  location?: string;
}

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  bannerImageUrl: string;
  startDate: string;
  endDate?: string;
  venue: Venue;
  organizer: Organizer;
  schedule?: ScheduleItem[];
  ticketTypes: TicketType[];
}

interface EventDetailProps {
  eventId: string;
  onAddToCart?: (eventId: string, selectedTickets: SelectedTicket[]) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onAddToCart
}) => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  
  useEffect(() => {
    setLoading(true);
    fetch(`/api/events/${eventId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }
        return response.json();
      })
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [eventId]);
  
  const handleTicketSelectionChange = (selectedTickets: SelectedTicket[]) => {
    setSelectedTickets(selectedTickets);
  };
  
  const handleAddToCart = () => {
    if (onAddToCart && event && selectedTickets.length > 0) {
      onAddToCart(event.id, selectedTickets);
    }
  };
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
      }}>
        <p>Loading event details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: 'var(--color-danger-600)',
      }}>
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
      }}>
        <p>Event not found</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Banner Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '300px',
        overflow: 'hidden',
        marginBottom: 'var(--spacing-6)',
      }}>
        <img 
          src={event.bannerImageUrl} 
          alt={event.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
          padding: 'var(--spacing-6) var(--spacing-6) var(--spacing-4)',
          color: 'white',
        }}>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: '0 0 var(--spacing-1) 0',
          }}>
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{
              fontSize: 'var(--font-size-lg)',
              margin: 0,
            }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: 'var(--spacing-6)',
        padding: '0 var(--spacing-6) var(--spacing-6)',
      }}>
        {/* Left Content - Event Details */}
        <div>
          <EventInfo 
            description={event.description}
            organizer={event.organizer}
            schedule={event.schedule || []}
            venue={event.venue}
            startDate={event.startDate}
            endDate={event.endDate || event.startDate}
          />
        </div>
        
        {/* Right Content - Ticket Selection and Purchase */}
        <div>
          <div style={{ position: 'sticky', top: 'var(--spacing-4)' }}>
            <TicketSelector 
              ticketTypes={event.ticketTypes}
              selectedTickets={[]}
              onTicketChange={(ticketId, quantity) => {
                const updatedTickets = selectedTickets.filter(t => t.id !== ticketId);
                if (quantity > 0) {
                  updatedTickets.push({ id: ticketId, quantity });
                }
                setSelectedTickets(updatedTickets);
                handleTicketSelectionChange(updatedTickets);
              }}
            />
            
            {selectedTickets.length > 0 && (
              <>
                <button
                  onClick={handleAddToCart}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    backgroundColor: 'var(--color-primary-600)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    marginTop: 'var(--spacing-4)',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }}
                >
                  Add to Cart
                </button>
                
                <button
                  onClick={() => {
                    if (onAddToCart && event && selectedTickets.length > 0) {
                      onAddToCart(event.id, selectedTickets);
                      navigate(`/checkout?eventId=${event.id}`);
                    }
                  }}
                  disabled={selectedTickets.length === 0}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    backgroundColor: 'var(--color-secondary-600)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: selectedTickets.length > 0 ? 'pointer' : 'not-allowed',
                    marginTop: 'var(--spacing-3)',
                    transition: 'background-color 0.2s',
                    opacity: selectedTickets.length > 0 ? 1 : 0.7,
                  }}
                  onMouseOver={(e) => {
                    if (selectedTickets.length > 0) {
                      e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
                  }}
                >
                  Book Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};