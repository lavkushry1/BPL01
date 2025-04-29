import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { events } from '@/data/eventsData';
import { iplMatches } from '@/data/iplData';
import EventCard from '@/components/events/EventCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  price: string;
  category?: string;
}

interface FeaturedEventsProps {
  events?: Event[];
  isLoading?: boolean;
}

export const FeaturedEvents: React.FC<FeaturedEventsProps> = ({ 
  events = [], 
  isLoading = false 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get featured events
  const featuredEvents = events.filter(event => event.featured).slice(0, 3);
  
  // Get first 2 IPL matches
  const featuredMatches = iplMatches.slice(0, 2);

  // Default events for demo purposes
  const defaultEvents: Event[] = [
    {
      id: '1',
      title: 'Mumbai Indians vs Chennai Super Kings',
      imageUrl: '/assets/events/mi-csk.jpg',
      date: '15 May 2023, 7:30 PM',
      location: 'Wankhede Stadium, Mumbai',
      price: '₹1,500',
      category: 'IPL'
    },
    {
      id: '2',
      title: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
      imageUrl: '/assets/events/rcb-kkr.jpg',
      date: '18 May 2023, 7:30 PM',
      location: 'M. Chinnaswamy Stadium, Bangalore',
      price: '₹1,200',
      category: 'IPL'
    },
    {
      id: '3',
      title: 'Delhi Capitals vs Rajasthan Royals',
      imageUrl: '/assets/events/dc-rr.jpg',
      date: '20 May 2023, 3:30 PM',
      location: 'Arun Jaitley Stadium, Delhi',
      price: '₹1,000',
      category: 'IPL'
    },
    {
      id: '4',
      title: 'Punjab Kings vs Sunrisers Hyderabad',
      imageUrl: '/assets/events/pbks-srh.jpg',
      date: '22 May 2023, 7:30 PM',
      location: 'IS Bindra Stadium, Mohali',
      price: '₹900',
      category: 'IPL'
    },
    {
      id: '5',
      title: 'Gujarat Titans vs Lucknow Super Giants',
      imageUrl: '/assets/events/gt-lsg.jpg',
      date: '25 May 2023, 7:30 PM',
      location: 'Narendra Modi Stadium, Ahmedabad',
      price: '₹1,100',
      category: 'IPL'
    },
  ];

  // Use provided events or defaults
  const displayEvents = events.length > 0 ? events : defaultEvents;

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  const handleEventClick = (eventId: string) => {
    if (!isLoading) {
      if (!eventId) {
        console.error("Event ID is missing");
        // Show toast if available
        try {
          const toast = require('@/hooks/use-toast').toast;
          toast({
            title: "Error",
            description: "Cannot navigate to event details: Event ID is missing.",
            variant: "destructive"
          });
        } catch (e) {
          alert("Cannot navigate to event details: Event ID is missing.");
        }
        return;
      }
      console.log(`Navigating to event: /events/${eventId}`);
      navigate(`/events/${eventId}`);
    }
  };

  const navigateToAllEvents = () => {
    navigate('/events');
  };

  if (isLoading) {
    return (
      <div className="featured-events-skeleton" style={{
        padding: 'var(--spacing-8) 0',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-6)'
        }}>
          <div style={{
            width: '200px',
            height: '32px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-md)'
          }}></div>
          <div style={{
            width: '100px',
            height: '24px',
            backgroundColor: 'var(--color-neutral-200)',
            borderRadius: 'var(--border-radius-md)'
          }}></div>
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-4)',
          overflowX: 'hidden'
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              minWidth: '280px',
              height: '380px',
              backgroundColor: 'var(--color-neutral-200)',
              borderRadius: 'var(--border-radius-lg)',
              flexShrink: 0
            }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="featured-events" style={{
      padding: 'var(--spacing-8) 0',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-6)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-neutral-800)'
        }}>
          Featured Events
        </h2>
        <Button 
          variant="text"
          onClick={navigateToAllEvents}
        >
          See all featured
        </Button>
      </div>

      <div style={{
        position: 'relative'
      }}>
        <div 
          ref={scrollContainerRef}
          className="events-scroll-container"
          style={{
            display: 'flex',
            gap: 'var(--spacing-4)',
            overflowX: 'auto',
            scrollbarWidth: 'none', // Hide scrollbar for Firefox
            msOverflowStyle: 'none', // Hide scrollbar for IE/Edge
            paddingBottom: 'var(--spacing-4)'
          }}
        >
          {/* Hide scrollbar for Chrome/Safari */}
          <style>
            {`
              .events-scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {displayEvents.map((event) => (
            <div 
              key={event.id}
              className="event-card"
              style={{
                minWidth: '280px',
                borderRadius: 'var(--border-radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: 'var(--color-neutral-white)',
                flexShrink: 0,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => handleEventClick(event.id)}
            >
              <div style={{
                height: '180px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 'var(--spacing-3)',
                  right: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-neutral-white)',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  borderRadius: 'var(--border-radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)'
                }}>
                  {event.price}
                </div>
              </div>
              <div style={{
                padding: 'var(--spacing-4)'
              }}>
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--spacing-2)',
                  color: 'var(--color-neutral-800)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  height: '3em'
                }}>
                  {event.title}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-neutral-600)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  <span style={{
                    marginRight: 'var(--spacing-1)'
                  }}>📆</span>
                  {event.date}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-neutral-600)',
                  marginBottom: 'var(--spacing-4)'
                }}>
                  <span style={{
                    marginRight: 'var(--spacing-1)'
                  }}>📍</span>
                  {event.location}
                </div>
                <Button 
                  variant="primary"
                  style={{
                    width: '100%'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event.id);
                  }}
                >
                  Book Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll control buttons */}
        <button
          aria-label="Scroll left"
          style={{
            position: 'absolute',
            top: '40%',
            left: '-16px',
            transform: 'translateY(-50%)',
            zIndex: 2,
            backgroundColor: 'var(--color-neutral-white)',
            color: 'var(--color-neutral-700)',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--border-radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer'
          }}
          onClick={handleScrollLeft}
        >
          ◀
        </button>
        <button
          aria-label="Scroll right"
          style={{
            position: 'absolute',
            top: '40%',
            right: '-16px',
            transform: 'translateY(-50%)',
            zIndex: 2,
            backgroundColor: 'var(--color-neutral-white)',
            color: 'var(--color-neutral-700)',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--border-radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer'
          }}
          onClick={handleScrollRight}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default FeaturedEvents;
