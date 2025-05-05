import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, ArrowRight, Star, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export interface IPLMatchCardProps {
  id: string;
  title: string;
  posterUrl: string;
  date: string; // ISO string
  time: string;
  venue: string;
  startingPrice: number; // in INR
  featured?: boolean;
  teams: {
    team1: {
      name: string;
      shortName: string;
      logo: string;
    };
    team2: {
      name: string;
      shortName: string;
      logo: string;
    };
  };
  altText?: string;
  dataSource?: 'admin' | 'api' | 'mock' | string;
}

const IPLMatchCard = ({ 
  id, 
  title, 
  posterUrl, 
  date, 
  time,
  venue, 
  startingPrice, 
  featured = false,
  teams,
  altText,
  dataSource = 'unknown'
}: IPLMatchCardProps) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const fallbackImg = '/placeholder.svg';
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle navigation error if ID is missing
  const handleErrorIfNoId = (e: React.MouseEvent) => {
    if (!id) {
      e.preventDefault();
      console.error("Match ID is missing");
      toast({
        title: "Error",
        description: "Cannot navigate to match details: Match ID is missing.",
        variant: "destructive"
      });
      return true;
    }
    return false;
  };

  // Generate accessible alt text
  const getAltText = () => {
    if (altText) return altText;
    return `IPL Match: ${teams.team1.name} vs ${teams.team2.name} poster`;
  };
  
  // Get badge color and text for data source
  const getDataSourceBadge = () => {
    switch(dataSource) {
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
      case 'real_mock':
        return { 
          label: 'Real Data',
          className: 'bg-purple-100 text-purple-800 border-purple-300' 
        };
      default:
        return null;
    }
  };
  
  const sourceInfo = getDataSourceBadge();

  // Return null if ID is missing to prevent broken links
  if (!id) {
    console.error("Match with missing ID:", title);
    return null;
  }

  return (
    <motion.div 
      className="relative h-full flex flex-col overflow-hidden rounded-2xl shadow-md 
                hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      {/* Featured Ribbon */}
      {featured && (
        <div className="absolute top-0 right-0 z-10">
          <div className="w-20 h-20 overflow-hidden">
            <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-red-500 
                           text-white font-bold py-1 right-[-30px] top-[8px] w-[100px] text-center text-sm shadow-lg">
              {t('events.hot', 'HOT')}
            </div>
          </div>
        </div>
      )}

      {/* Data Source Badge - top left corner */}
      <div className="absolute top-2 left-2 z-10">
        {sourceInfo && (
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 ${sourceInfo.className}`}
          >
            <Database className="h-3 w-3" />
            <span className="text-xs">{sourceInfo.label}</span>
          </Badge>
        )}
      </div>

      {/* Poster Image */}
      <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
        <img 
          src={imgError ? fallbackImg : posterUrl}
          alt={getAltText()}
          className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        
        {/* Overlay Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 text-white z-[1]">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate max-w-[120px]">{venue.split(',')[0]}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-grow p-4 bg-white">
        {/* Teams */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
              <img 
                src={teams.team1.logo} 
                alt={teams.team1.name} 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImg;
                }}
              />
            </div>
            <span className="font-bold text-sm">{teams.team1.shortName}</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-500">VS</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
              <img 
                src={teams.team2.logo} 
                alt={teams.team2.name} 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImg;
                }}
              />
            </div>
            <span className="font-bold text-sm">{teams.team2.shortName}</span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-4">
          {title}
        </h3>
        
        {/* Price and Availability */}
        <div className="flex items-center justify-between mt-auto mb-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">{t('payment.startingFrom', 'Starting from')}</span>
            <div className="font-bold text-xl text-primary">
              ₹{startingPrice.toLocaleString('en-IN')}
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
            {t('ipl.ticketsAvailable', 'Tickets Available')}
          </Badge>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-auto">
          <Link 
            to={`/events/${id}`}
            onClick={handleErrorIfNoId}
            className="w-full focus:outline-none" // Removed outline as we use ring on parent
          >
            <Button 
              className="w-full h-11 rounded-lg font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600
                        hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md
                        hover:shadow-lg transition-all duration-300"
            >
              {t('common.bookNow', 'Book Now')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          
          <Link 
            to={`/events/${id}`}
            onClick={handleErrorIfNoId}
            className="w-full focus:outline-none" // Removed outline as we use ring on parent
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
    </motion.div>
  );
};

export default React.memo(IPLMatchCard); 