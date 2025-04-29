import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Users, Tag, ArrowRight, XCircle, Heart } from 'lucide-react';
import { Event } from '@/data/eventsData';
import { Badge } from '@/components/ui/badge';
import fallbackEventImg from '@/assets/fallback-event.jpg';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  showActions?: boolean;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EventCard = ({ 
  event, 
  showActions = true,
  aspectRatio = 'landscape',
  size = 'md',
  className 
}: EventCardProps) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);
  
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
    return (totalAvailable / totalCapacity) < 0.2 && totalAvailable > 0;
  };

  // Check if the event is sold out (no available tickets)
  const isSoldOut = () => {
    const totalAvailable = event.ticketTypes.reduce((sum, ticket) => sum + ticket.available, 0);
    return totalAvailable === 0;
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

  // Handle like button click
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked 
        ? `${event.title} has been removed from your favorites.`
        : `${event.title} has been added to your favorites.`,
      variant: "default"
    });
  };
  
  // Get minimum ticket price to display
  const getMinPrice = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) return null;
    
    const availableTickets = event.ticketTypes.filter(ticket => ticket.available > 0);
    if (availableTickets.length === 0) return null;
    
    const minPrice = Math.min(...availableTickets.map(ticket => ticket.price));
    return minPrice;
  };

  // Return null if event ID is missing to prevent broken links
  if (!event.id) {
    console.error("Event with missing ID:", event);
    return null;
  }

  const soldOut = isSoldOut();
  const minPrice = getMinPrice();
  
  // Determine image height based on size and aspect ratio
  const getImageHeight = () => {
    if (aspectRatio === 'portrait') return size === 'sm' ? 'h-40' : size === 'lg' ? 'h-72' : 'h-56';
    if (aspectRatio === 'square') return size === 'sm' ? 'h-36' : size === 'lg' ? 'h-64' : 'h-48';
    return size === 'sm' ? 'h-32' : size === 'lg' ? 'h-60' : 'h-48';
  };

  return (
    <motion.div 
      className={cn(
        "bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col",
        className
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link 
        to={`/events/${event.id}`}
        onClick={showErrorIfNoId}
        className="flex-grow flex flex-col"
      >
        <div className={cn("bg-blue-50 relative", getImageHeight())}>
          <img 
            src={imgError || !event.image ? fallbackEventImg : event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
          
          {/* Price tag */}
          {minPrice !== null && (
            <div className="absolute top-0 left-0 m-4">
              <Badge className="bg-white text-primary hover:bg-white font-semibold px-3 py-1">
                ₹{minPrice}
              </Badge>
            </div>
          )}
          
          {/* Event category badge */}
          <div className="absolute top-0 right-0 p-4">
            <Badge className="bg-white/90 text-primary hover:bg-white">
              {t(`categories.${event.category.toLowerCase().replace(/ & /g, 'And')}`, event.category)}
            </Badge>
          </div>
          
          {/* Event status badges */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            {soldOut && (
              <Badge className="bg-red-500 text-white hover:bg-red-600 font-bold">
                {t('events.soldOut', 'SOLD OUT')}
              </Badge>
            )}
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
          
          {/* Like button */}
          <button
            className="absolute top-3 right-3 z-10 text-white hover:text-red-500 focus:outline-none transition-colors duration-200"
            onClick={handleLikeClick}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-6 w-6", isLiked ? "fill-red-500 text-red-500" : "fill-transparent")} />
          </button>
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
              {event.title}
            </h3>
            
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
              {event.description}
            </p>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-700">
              <Calendar className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Clock className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              <span className="font-medium">{event.time}</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <MapPin className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              <span className="font-medium line-clamp-1">{event.venue}</span>
            </div>
          </div>
          
          {showActions && (
            <div className="mt-auto pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full hover:bg-gray-100 border-gray-300"
              >
                <span className="font-medium">{t('common.viewDetails', 'View Details')}</span>
              </Button>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;
