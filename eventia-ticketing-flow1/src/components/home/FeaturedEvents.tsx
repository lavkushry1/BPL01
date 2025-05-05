import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EventCard from '@/components/events/EventCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export const FeaturedEvents: React.FC<FeaturedEventsProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    fetch('/api/events/featured')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch featured events');
        }
        return response.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
      
      if (scrollIndex > 0) {
        setScrollIndex(scrollIndex - 1);
      }
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current && events.length > 0) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
      
      if (scrollIndex < events.length - 1) {
        setScrollIndex(scrollIndex + 1);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current && events.length > 0) {
      const cardWidth = 280 + 16; // card width + gap
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setScrollIndex(index);
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
      <div className="py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="w-48 h-8 bg-neutral-200 rounded-md animate-pulse"></div>
          <div className="w-24 h-6 bg-neutral-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-4 overflow-x-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] h-[380px] bg-neutral-200 rounded-lg flex-shrink-0 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">
          Featured Events
        </h2>
        <Button 
          variant="ghost"
          onClick={navigateToAllEvents}
          className="text-primary flex items-center gap-1 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          See all featured
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        {/* Left scroll button (hidden on mobile) */}
        <button 
          onClick={handleScrollLeft}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 hidden md:flex items-center justify-center focus:ring-2 focus:ring-primary focus:outline-none",
            scrollIndex === 0 && "opacity-50 cursor-not-allowed"
          )}
          disabled={scrollIndex === 0}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Hide scrollbar for Chrome/Safari */}
          <style>
            {`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            `}
          </style>

          {events.map((event, index) => (
            <div 
              key={event.id}
              className={cn(
                "min-w-[280px] rounded-lg overflow-hidden shadow-md hover:shadow-lg bg-white flex-shrink-0 transition-transform duration-200 cursor-pointer snap-start",
                "transform hover:scale-[1.02]"
              )}
              onClick={() => handleEventClick(event.id)}
            >
              <div className="h-[180px] overflow-hidden relative">
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  srcSet={`${event.imageUrl} 1x, ${event.imageUrl} 2x`}
                  sizes="(max-width: 640px) 280px, 280px"
                />
                <div className="absolute top-3 right-3 bg-primary-600 text-white px-2 py-1 rounded-md text-sm font-bold">
                  {event.price}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 text-neutral-800 line-clamp-2 h-14">
                  {event.title}
                </h3>
                <div className="flex items-center text-sm text-neutral-500 mb-3">
                  <span className="mr-3">{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.location}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event.id);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right scroll button (hidden on mobile) */}
        <button 
          onClick={handleScrollRight}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-2 hidden md:flex items-center justify-center focus:ring-2 focus:ring-primary focus:outline-none",
            scrollIndex === events.length - 1 && "opacity-50 cursor-not-allowed"
          )}
          disabled={scrollIndex === events.length - 1}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        {/* Scroll indicator dots for mobile */}
        <div className="flex justify-center mt-4 gap-2 md:hidden">
          {events.slice(0, Math.min(events.length, 5)).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary",
                index === scrollIndex ? "bg-primary" : "bg-neutral-300"
              )}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvents;
