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
    // In a real application, fetch the event from an API
    // For now, we'll simulate a fetch with a timeout
    setLoading(true);
    setTimeout(() => {
      // Mock data - would be replaced with API call
      const mockEvent: Event = {
        id: eventId,
        title: "Annual Tech Conference 2023",
        subtitle: "Exploring the Future of Technology",
        description: "Join us for three days of inspiring talks, workshops, and networking opportunities with leading experts in the technology industry. Learn about the latest trends, innovations, and challenges in various technology domains.",
        bannerImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3",
        startDate: "2023-10-15T09:00:00Z",
        endDate: "2023-10-17T18:00:00Z",
        venue: {
          id: "venue1",
          name: "Tech Convention Center",
          address: "123 Innovation Street",
          city: "San Francisco",
          state: "CA", // This is now required
          zipCode: "94103",
          country: "USA",
          location: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        },
        organizer: {
          id: "org1",
          name: "TechEvents Inc.",
          description: "TechEvents Inc. organizes premium technology conferences worldwide.", // This is now required
          logoUrl: "https://via.placeholder.com/150",
          socialLinks: {
            website: "https://techeventsinc.com",
            twitter: "https://twitter.com/techeventsinc",
            facebook: "https://facebook.com/techeventsinc",
            instagram: "https://instagram.com/techeventsinc"
          }
        },
        schedule: [
          {
            id: "s1",
            title: "Opening Keynote",
            description: "Welcome address and keynote speech by our CEO", // This is now required
            startTime: "2023-10-15T09:30:00Z",
            endTime: "2023-10-15T10:30:00Z",
            speakers: ["Jane Smith"],
            location: "Main Hall"
          },
          {
            id: "s2",
            title: "The Future of AI",
            description: "Panel discussion on artificial intelligence trends", // This is now required
            startTime: "2023-10-15T11:00:00Z",
            endTime: "2023-10-15T12:30:00Z",
            speakers: ["Dr. Alan Johnson", "Prof. Lisa Chen"],
            location: "Room A"
          },
          {
            id: "s3",
            title: "Workshop: Building Cloud-Native Applications",
            description: "Hands-on workshop for developers", // This is now required
            startTime: "2023-10-15T14:00:00Z",
            endTime: "2023-10-15T16:00:00Z",
            speakers: ["Carlos Mendez"],
            location: "Workshop Room 1"
          },
          {
            id: "s4",
            title: "Cybersecurity Challenges in 2023",
            description: "Expert talk on emerging security threats", // This is now required
            startTime: "2023-10-16T10:00:00Z",
            endTime: "2023-10-16T11:30:00Z",
            speakers: ["Sarah Johnson"],
            location: "Room B"
          },
          {
            id: "s5",
            title: "Closing Remarks",
            description: "Summary of the event and future announcements", // This is now required
            startTime: "2023-10-17T17:00:00Z",
            endTime: "2023-10-17T18:00:00Z",
            speakers: ["Mike Thompson"],
            location: "Main Hall"
          }
        ],
        ticketTypes: [
          {
            id: "ticket1",
            name: "General Admission",
            description: "Access to all talks and exhibition area",
            price: 199,
            currency: "USD",
            availableQuantity: 200,
            maxPerOrder: 10
          },
          {
            id: "ticket2",
            name: "VIP Pass",
            description: "General admission plus access to exclusive networking events and VIP lounge",
            price: 499,
            currency: "USD",
            availableQuantity: 50,
            maxPerOrder: 5
          },
          {
            id: "ticket3",
            name: "Workshop Pass",
            description: "Add-on for workshop access (requires general admission)",
            price: 99,
            currency: "USD",
            availableQuantity: 100,
            maxPerOrder: 5
          },
          {
            id: "ticket4",
            name: "Student Pass",
            description: "Discounted pass for students with valid ID",
            price: 79,
            currency: "USD",
            availableQuantity: 100,
            maxPerOrder: 1
          }
        ]
      };
      
      setEvent(mockEvent);
      setLoading(false);
    }, 1000);
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