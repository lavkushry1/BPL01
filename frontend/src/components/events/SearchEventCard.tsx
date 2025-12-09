import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export interface SearchEventCardProps {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  imageUrl?: string;
  category: string;
}

const SearchEventCard: React.FC<SearchEventCardProps> = ({
  id,
  title,
  description,
  date,
  location,
  price,
  imageUrl,
  category
}) => {
  // Format date
  const formattedDate = format(date, 'EEE, MMM d, yyyy • h:mm a');
  
  // Truncate description for cards
  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        {/* Event image */}
        <img
          src={imageUrl || `https://picsum.photos/seed/${id}/400/225`}
          alt={title}
          className="w-full h-48 object-cover"
        />
        
        {/* Category badge */}
        <Badge className="absolute top-3 right-3 bg-primary/80 hover:bg-primary">
          {category}
        </Badge>
      </div>
      
      <CardHeader className="pb-2">
        <h3 className="text-lg font-bold line-clamp-2">{title}</h3>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm mb-4">
          {truncateDescription(description)}
        </p>
        
        <div className="space-y-2 mt-auto">
          {/* Date */}
          <div className="flex items-start text-sm">
            <Calendar className="h-4 w-4 mr-2 mt-0.5 text-primary" />
            <span>{formattedDate}</span>
          </div>
          
          {/* Location */}
          <div className="flex items-start text-sm">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary" />
            <span>{location}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2 pb-4">
        <div className="font-bold">₹{price.toLocaleString()}</div>
        <Link to={`/events/${id}`}>
          <Button>View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default SearchEventCard; 