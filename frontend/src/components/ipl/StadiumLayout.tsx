import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState } from 'react';

// Interfaces based on our new Schema
interface IplStand {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  priceDefault: number;
  svgPath: string; // The "d" attribute or points
  viewBox?: string;
}

interface StadiumLayoutProps {
  venueName: string;
  stands: IplStand[];
  onStandSelect: (stand: IplStand) => void;
  selectedStandId?: string | null;
  pricing?: Record<string, number>; // Map stand code to current price
  isLoading?: boolean;
}

const StadiumLayout = ({
  venueName,
  stands,
  onStandSelect,
  selectedStandId,
  pricing = {},
  isLoading = false
}: StadiumLayoutProps) => {
  const [hoveredStand, setHoveredStand] = useState<IplStand | null>(null);

  // Helper to determine fill color based on price or type
  const getStandColor = (stand: IplStand) => {
    const isSelected = selectedStandId === stand.id;
    const isHovered = hoveredStand?.id === stand.id;

    // Base colors
    if (isSelected) return '#22c55e'; // Green-500
    if (stand.type === 'HOSPITALITY') return '#a855f7'; // Purple-500

    // Price based logic
    const price = pricing[stand.code] || stand.priceDefault || 1000;
    if (price < 1000) return '#3b82f6'; // Blue-500 (Cheap)
    if (price < 2500) return '#f59e0b'; // Amber-500 (Mid)
    return '#f43f5e'; // Rose-500 (Expensive)
  };

  // Helper to get opacity
  const getStandOpacity = (stand: IplStand) => {
    if (selectedStandId === stand.id) return 0.9;
    if (hoveredStand?.id === stand.id) return 0.8;
    return 0.5; // Default transparency
  };

  if (isLoading) {
    return <div className="w-full h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl">
      <Skeleton className="w-[80%] h-[80%] rounded-full opacity-20" />
    </div>;
  }

  // Calculate generic viewBox if not provided. Wankhede snippet used 0 0 800 600
  const viewBox = stands.length > 0 && stands[0].viewBox ? stands[0].viewBox : "0 0 800 600";

  return (
    <Card className="p-4 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Badge variant="outline" className="bg-background/80 backdrop-blur">
          <Info className="w-3 h-3 mr-1" />
          {venueName}
        </Badge>
      </div>

      <div className="flex items-center justify-center w-full min-h-[400px] md:min-h-[500px]">
        <TooltipProvider delayDuration={100}>
          <svg
            viewBox={viewBox}
            className="w-full h-full max-h-[600px] drop-shadow-xl select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Stadium Grass/Field Background (Center) */}
            <circle cx="400" cy="300" r="120" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
            <rect x="380" y="240" width="40" height="120" fill="#eab308" fillOpacity="0.3" rx="4" /> {/* Pitch */}

            {/* Stands */}
            {stands.map((stand) => (
              <Tooltip key={stand.id} open={hoveredStand?.id === stand.id}>
                <TooltipTrigger asChild>
                  <motion.path
                    d={stand.svgPath}
                    fill={getStandColor(stand)}
                    fillOpacity={getStandOpacity(stand)}
                    stroke="white"
                    strokeWidth={selectedStandId === stand.id ? 3 : 1}
                    className="cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStandSelect(stand)}
                    onMouseEnter={() => setHoveredStand(stand)}
                    onMouseLeave={() => setHoveredStand(null)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-slate-700">
                  <div className="text-center p-1">
                    <p className="font-bold text-sm">{stand.name}</p>
                    <p className="text-xs text-slate-300">{stand.type}</p>
                    <p className="text-sm font-semibold text-green-400 mt-1">
                      ₹{(pricing[stand.code] || stand.priceDefault || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Click to select seats</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </svg>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#3b82f6] opacity-50"></div>Economy</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#f59e0b] opacity-50"></div>Standard</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#f43f5e] opacity-50"></div>Premium</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#a855f7] opacity-50"></div>Hospitality</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#22c55e] opacity-90 border border-white"></div>Selected</div>
      </div>
    </Card>
  );
};

export default StadiumLayout;
