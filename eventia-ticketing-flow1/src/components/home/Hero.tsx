import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/styles/ThemeProvider';

// Define types for the carousel events
interface CarouselEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
}

interface HeroProps {
  events?: CarouselEvent[];
  isLoading?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ 
  events = [], 
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Default placeholder events for demo purposes
  const defaultEvents: CarouselEvent[] = [
    {
      id: '1',
      title: 'Mumbai Indians vs Chennai Super Kings',
      description: 'Experience the intense rivalry at Wankhede Stadium!',
      imageUrl: '/assets/events/mi-csk.jpg',
      date: '2023-05-15',
    },
    {
      id: '2',
      title: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
      description: 'Watch the explosive batting display at Chinnaswamy Stadium!',
      imageUrl: '/assets/events/rcb-kkr.jpg',
      date: '2023-05-18',
    },
    {
      id: '3',
      title: 'Delhi Capitals vs Rajasthan Royals',
      description: 'Witness the clash of titans at Arun Jaitley Stadium!',
      imageUrl: '/assets/events/dc-rr.jpg',
      date: '2023-05-20',
    },
  ];

  // Use provided events or defaults
  const displayEvents = events.length > 0 ? events : defaultEvents;
  
  useEffect(() => {
    // Auto rotate carousel every 5 seconds
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeIndex, displayEvents.length]);

  const handleNextSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextIndex = (activeIndex + 1) % displayEvents.length;
    
    setTimeout(() => {
      setActiveIndex(nextIndex);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const prevIndex = (activeIndex - 1 + displayEvents.length) % displayEvents.length;
    
    setTimeout(() => {
      setActiveIndex(prevIndex);
      setIsTransitioning(false);
    }, 300);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning) return;
    setActiveIndex(index);
  };

  const handleExploreEvent = () => {
    const currentEvent = events[activeIndex];
    if (currentEvent && currentEvent.id) {
      console.log(`Navigating to event: /events/${currentEvent.id}`);
      navigate(`/events/${currentEvent.id}`);
    } else {
      console.error("Cannot navigate: Event ID is missing");
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
    }
  };

  const navigateToEvents = () => {
    navigate('/events');
  };

  if (isLoading) {
    return (
      <div className="hero-skeleton" style={{
        height: '500px',
        backgroundColor: 'var(--color-neutral-100)',
        borderRadius: 'var(--border-radius-lg)',
        margin: 'var(--spacing-4) 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="hero-container" style={{
      position: 'relative',
      width: '100%',
      height: '500px',
      overflow: 'hidden',
      borderRadius: 'var(--border-radius-lg)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Carousel */}
      <div className="carousel" style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}>
        {displayEvents.map((event, index) => (
          <div 
            key={event.id}
            className="carousel-slide"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === activeIndex ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${event.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="carousel-content" style={{
              position: 'absolute',
              bottom: 'var(--spacing-8)',
              left: 'var(--spacing-8)',
              right: 'var(--spacing-8)',
              color: 'var(--color-neutral-white)',
              zIndex: 1
            }}>
              <h1 style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--spacing-2)'
              }}>
                {event.title}
              </h1>
              <p style={{
                fontSize: 'var(--font-size-lg)',
                marginBottom: 'var(--spacing-4)'
              }}>
                {event.description}
              </p>
              <div className="cta-buttons" style={{
                display: 'flex',
                gap: 'var(--spacing-4)'
              }}>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => handleExploreEvent()}
                >
                  Book Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigateToEvents()}
                >
                  Browse Events
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="carousel-nav" style={{
        position: 'absolute',
        bottom: 'var(--spacing-4)',
        right: 'var(--spacing-8)',
        display: 'flex',
        gap: 'var(--spacing-2)',
        zIndex: 2
      }}>
        {displayEvents.map((_, index) => (
          <button
            key={index}
            aria-label={`Go to slide ${index + 1}`}
            className="carousel-dot"
            style={{
              width: 'var(--spacing-3)',
              height: 'var(--spacing-3)',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: index === activeIndex 
                ? 'var(--color-primary-600)' 
                : 'var(--color-neutral-300)',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        aria-label="Previous slide"
        className="carousel-arrow prev"
        style={{
          position: 'absolute',
          top: '50%',
          left: 'var(--spacing-4)',
          transform: 'translateY(-50%)',
          zIndex: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'var(--color-neutral-white)',
          fontSize: '2rem',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--border-radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={handlePrevSlide}
      >
        ‹
      </button>
      <button
        aria-label="Next slide"
        className="carousel-arrow next"
        style={{
          position: 'absolute',
          top: '50%',
          right: 'var(--spacing-4)',
          transform: 'translateY(-50%)',
          zIndex: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'var(--color-neutral-white)',
          fontSize: '2rem',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--border-radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={handleNextSlide}
      >
        ›
      </button>
    </div>
  );
};
