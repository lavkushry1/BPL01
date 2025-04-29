import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Users, Tag, ArrowRight } from 'lucide-react';
import { Event } from '@/data/eventsData';
import { Badge } from '@/components/ui/badge';
import fallbackEventImg from '@/assets/fallback-event.jpg';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = React.useState(false);
  
  // Format date
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate if the event is upcoming (within 7 days)
  const isUpcoming = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const diffTime = Math.abs(eventDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return eventDate >= today && diffDays <= 7;
  };

  // Calculate if the event is selling fast (less than 20% tickets available)
  const isSellingFast = () => {
    const totalAvailable = event.ticketTypes.reduce((sum, ticket) => sum + ticket.available, 0);
    const totalCapacity = event.ticketTypes.reduce((sum, ticket) => sum + ticket.capacity, 0);
    return (totalAvailable / totalCapacity) < 0.2;
  };

  // Display error message if event ID is missing
  const showErrorIfNoId = (e: React.MouseEvent) => {
    if (!event.id) {
      e.preventDefault();
      console.error("Event ID is missing");
      toast({
        title: "Error",
        description: "Cannot navigate to event details: Event ID is missing.",
        variant: "destructive"
      });
      return true;
    }
    return false;
  };

  // Return null if event ID is missing to prevent broken links
  if (!event.id) {
    console.error("Event with missing ID:", event);
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col">
      <div className="h-48 bg-blue-50 relative">
        <img 
          src={imgError || !event.image ? fallbackEventImg : event.image}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Event category badge */}
        <div className="absolute top-0 left-0 p-4">
          <Badge className="bg-white/90 text-primary hover:bg-white">
            {t(`categories.${event.category.toLowerCase().replace(/ & /g, 'And')}`, event.category)}
          </Badge>
        </div>
        
        {/* Event badges */}
        <div className="absolute top-0 right-0 p-4 flex gap-2">
          {isUpcoming() && (
            <Badge className="bg-green-500 text-white hover:bg-green-600">
              {t('events.upcoming', 'Upcoming')}
            </Badge>
          )}
          {isSellingFast() && (
            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
              {t('events.sellingFast', 'Selling Fast')}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
          {event.description}
        </p>
        
        <div className="p-3 bg-blue-50 rounded-lg space-y-2.5 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-3 text-blue-600" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Clock className="h-4 w-4 mr-3 text-blue-600" />
            <span className="font-medium">{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-3 text-blue-600" />
            <span className="font-medium">{event.venue}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Tag className="h-4 w-4 mr-3 text-blue-600" />
            <span className="font-medium">{event.duration}</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-600">{t('payment.startingFrom', 'Starting from')}</span>
              <div className="font-bold text-xl text-primary flex items-center gap-2">
                ₹{Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString('en-IN')}
                {event.discount && (
                  <Badge className="bg-green-100 text-green-800">
                    {event.discount.type === 'percent'
                      ? `-${event.discount.value}%`
                      : `-₹${event.discount.value}`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link 
              to={`/events/${event.id}`}
              onClick={showErrorIfNoId}
              className="w-full"
            >
              <Button 
                className="w-full h-11 rounded-lg font-bold text-base bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {t('common.bookNow', 'Book Now')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link 
              to={`/events/${event.id}`}
              onClick={showErrorIfNoId}
              className="w-full"
            >
              <Button 
                variant="outline" 
                className="w-full hover:bg-gray-100 border-gray-300"
              >
                <span className="font-medium">{t('common.viewDetails', 'View Details')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
