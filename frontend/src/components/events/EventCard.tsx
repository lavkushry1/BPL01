import fallbackEventImg from '@/assets/fallback-event.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar, Database, MapPin } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

// Define the Event interface
interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  venue: string;
  location?: string;
  ticketTypes: Array<{
    category: string;
    price: number;
    available: number;
    capacity: number;
  }>;
}

// Extend the Event interface to include source
interface ExtendedEvent extends Event {
  source?: 'admin' | 'api' | 'mock' | string;
}

interface EventCardProps {
  event: ExtendedEvent;
  showActions?: boolean;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  showActions = true,
  aspectRatio = 'landscape',
  size = 'md',
  className
}) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  // Format date
  const formattedDate = format(new Date(event.date), 'EEE, MMM d, yyyy • h:mm a');

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
    if (!event.ticketTypes || event.ticketTypes.length === 0) return false;
    const totalAvailable = event.ticketTypes.reduce((sum: number, ticket: any) => sum + ticket.available, 0);
    const totalCapacity = event.ticketTypes.reduce((sum: number, ticket: any) => sum + ticket.capacity, 0);
    return totalCapacity > 0 && (totalAvailable / totalCapacity) < 0.2 && totalAvailable > 0;
  };

  // Check if the event is sold out (no available tickets)
  const isSoldOut = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) return false;
    const totalAvailable = event.ticketTypes.reduce((sum: number, ticket: any) => sum + ticket.available, 0);
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

  // Get badge color and text for data source
  const getDataSourceBadge = () => {
    switch (event.source) {
      case 'admin':
        return {
          label: 'Admin',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'api':
        return {
          label: 'API',
          className: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'mock':
        return {
          label: 'Mock',
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      default:
        return null;
    }
  };

  const sourceInfo = getDataSourceBadge();

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

  // Truncate description for cards
  const truncateDescription = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <Card className={cn("overflow-hidden flex flex-col h-full district-panel border-[var(--district-border)] text-[var(--district-text)] shadow-xl transition-all duration-300 hover:shadow-2xl", className)}>
      <div className="relative">
        {/* Event image */}
        <img
          src={imgError || !event.image ? fallbackEventImg : event.image}
          alt={event.title}
          className={cn("w-full object-cover", getImageHeight())}
          onError={() => setImgError(true)}
          loading="lazy"
          srcSet={`${imgError || !event.image ? fallbackEventImg : event.image} 1x, ${imgError || !event.image ? fallbackEventImg : event.image} 2x`}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />

        {/* Category badge */}
        <Badge className="absolute top-3 right-3 bg-white/10 border border-[var(--district-border)] text-[var(--district-text)] backdrop-blur-sm">
          {t(`categories.${event.category.toLowerCase().replace(/ & /g, 'And')}`, event.category)}
        </Badge>

        {/* Source badge (if admin or mock) */}
        {sourceInfo && ['admin', 'mock'].includes(event.source || '') && (
          <Badge className={cn("absolute top-3 left-3 border border-[var(--district-border)] bg-white/10 text-[var(--district-text)]", sourceInfo.className)}>
            {sourceInfo.label === 'Admin' ? 'Admin Event' : sourceInfo.label}
          </Badge>
        )}

        {/* Status badges */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {isUpcoming() && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-300/40">
              Upcoming
            </Badge>
          )}

          {isSellingFast() && !soldOut && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-100 border-orange-300/40">
              Selling Fast
            </Badge>
          )}

          {soldOut && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-100 border-red-300/40">
              Sold Out
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-black line-clamp-2">{event.title}</h3>
          {event.source === 'admin' && (
            <div className="flex items-center text-xs text-amber-300 ml-2">
              <Database className="h-3 w-3 mr-1" />
              Admin
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm mb-4 text-[var(--district-muted)]">
          {truncateDescription(event.description)}
        </p>

        <div className="space-y-2 mt-auto">
          {/* Date */}
          <div className="flex items-start text-sm">
            <Calendar className="h-4 w-4 mr-2 mt-0.5 text-[var(--district-accent)]" />
            <span>{formattedDate}</span>
          </div>

          {/* Location */}
          <div className="flex items-start text-sm">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-[var(--district-accent)]" />
            <span>{event.venue}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-2 pb-4">
        <div className="font-extrabold text-lg">₹{minPrice?.toLocaleString()}</div>
        <div className="flex gap-2">
          <Link to={`/events/${event.id}`} onClick={showErrorIfNoId}>
            <Button variant="outline" className="district-chip !rounded-full !border-[var(--district-border)]">View Details</Button>
          </Link>
          {!soldOut && (
            <Link to={`/events/${event.id}`} onClick={showErrorIfNoId}>
              <Button className="district-button-primary !rounded-full">Book Now</Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
