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
  altText,
  venue,
  dataSource
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


  // Return null if ID is missing to prevent broken links
  if (!id) {
    console.error("Match with missing ID:", title);
    return null;
  }

  return (
    <motion.div
      className="group relative h-full flex flex-col overflow-hidden rounded-3xl district-panel border-[var(--district-border)] shadow-2xl backdrop-blur-sm hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />
        <img
          src={imgError ? fallbackImg : posterUrl}
          alt={getAltText()}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Teams VS Badge Floating */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-max max-w-[90%]">
          <div className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-md px-6 py-2 rounded-full border border-[var(--district-border)] shadow-xl">
            <img src={teams.team1.logo} alt={teams.team1.name} className="w-8 h-8 object-contain" />
            <span className="text-slate-400 font-bold text-xs">VS</span>
            <img src={teams.team2.logo} alt={teams.team2.name} className="w-8 h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6 pt-2 text-[var(--district-text)]">
        {/* Date & Location */}
        <div className="flex items-center justify-between text-xs font-medium text-[var(--district-muted)] mb-3">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-[var(--district-accent)]" />
            <span>{formattedDate}</span>
            </div>
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-[var(--district-accent-strong)]" />
            <span className="truncate max-w-[100px]">{venue.split(',')[0]}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black mb-1 line-clamp-1 group-hover:text-[var(--district-accent)] transition-colors">
          {teams.team1.shortName} vs {teams.team2.shortName}
        </h3>
        <p className="text-sm text-[var(--district-muted)] line-clamp-1 mb-6">{title}</p>

        {/* Price and Action */}
        <div className="mt-auto pt-4 border-t border-[var(--district-border)] flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--district-muted)] mb-0.5">Tickets from</p>
            <p className="text-xl font-extrabold">₹{startingPrice.toLocaleString('en-IN')}</p>
          </div>

          <Link to={`/matches/${id}`} onClick={handleErrorIfNoId}>
            <Button
              size="sm"
              className="district-button-primary !rounded-full px-6 py-2"
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
