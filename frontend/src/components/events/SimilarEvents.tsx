import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  image?: string;
  date: string;
  venue: string;
  category: string;
}

interface SimilarEventsProps {
  currentEventId: string;
  category: string;
  events: Event[];
  isLoading?: boolean;
  className?: string;
}

export const SimilarEvents: React.FC<SimilarEventsProps> = ({
  currentEventId,
  category,
  events,
  isLoading = false,
  className
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Filter out the current event and limit to 4 similar events
  const similarEvents = events
    .filter(event => event.id !== currentEventId && event.category === category)
    .slice(0, 4);
  
  // If we don't have similar events in the same category, show others
  const otherEvents = events
    .filter(event => event.id !== currentEventId && event.category !== category)
    .slice(0, 4);
  
  const displayEvents = similarEvents.length > 0 ? similarEvents : otherEvents;
  
  if (isLoading) {
    return (
      <div className={cn("mt-12", className)}>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg overflow-hidden shadow-sm bg-white">
              <Skeleton className="h-36 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (displayEvents.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("mt-12", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {similarEvents.length > 0 
            ? t('eventDetails.similarEvents', 'Similar Events')
            : t('eventDetails.otherEvents', 'You Might Also Like')}
        </h2>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary/80"
          onClick={() => navigate('/events')}
        >
          {t('common.viewAll', 'View All')}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {displayEvents.map(event => (
          <div 
            key={event.id}
            className="rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <div className="h-36 overflow-hidden">
              <img 
                src={event.image || '/assets/default-event.jpg'} 
                alt={event.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
              <div className="text-sm text-gray-600 mb-1">📅 {event.date}</div>
              <div className="text-sm text-gray-600">📍 {event.venue}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 