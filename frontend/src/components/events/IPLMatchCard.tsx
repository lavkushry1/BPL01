import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
  startingPrice,
  featured = false,
  teams,
  altText
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

  // Return null if ID is missing to prevent broken links
  if (!id) {
    console.error("Match with missing ID:", title);
    return null;
  }

  return (
    <motion.div
      className="group relative h-full flex flex-col overflow-hidden rounded-3xl bg-slate-900/60 border border-white/10 shadow-lg backdrop-blur-sm hover:border-white/20 transition-all duration-300"
      whileHover={{ y: -5 }}
    >
      {/* Featured Ribbon - Modern Glass Style */}
      {featured && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 border-none text-white font-bold shadow-lg shadow-orange-500/20">
            {t('events.hot', 'HOT')}
          </Badge>
        </div>
      )}

      {/* Poster Image Area */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-90" />
        <img
          src={imgError ? fallbackImg : posterUrl}
          alt={getAltText()}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Teams VS Badge Floating */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-max max-w-[90%]">
          <div className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-xl">
            <img src={teams.team1.logo} alt={teams.team1.name} className="w-8 h-8 object-contain" />
            <span className="text-slate-400 font-bold text-xs">VS</span>
            <img src={teams.team2.logo} alt={teams.team2.name} className="w-8 h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6 pt-2">
        {/* Date & Location */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            <span>{formattedDate}</span>
            </div>
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            <span className="truncate max-w-[100px]">{venue.split(',')[0]}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {teams.team1.shortName} vs {teams.team2.shortName}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-1 mb-6">{title}</p>

        {/* Price and Action */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Tickets from</p>
            <p className="text-xl font-bold text-white">₹{startingPrice.toLocaleString('en-IN')}</p>
          </div>

          <Link to={`/events/${id}`} onClick={handleErrorIfNoId}>
            <Button
              size="sm"
              className="rounded-full bg-white text-slate-950 hover:bg-blue-500 hover:text-white font-bold transition-all px-6"
            >
              Book
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(IPLMatchCard);
