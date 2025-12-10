/**
 * CricketStadiumSeatMap Component
 *
 * Interactive SVG-based cricket stadium seat selection with:
 * - Oval stadium layout matching cricket venues
 * - Named sections: Pavilion, East Stand, West Stand, North Stand, South Stand
 * - Click-to-select sections with zoom
 * - Visual price categories with colors
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Ticket, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useCallback, useState } from 'react';

// Stadium section price categories
export interface StadiumSection {
  id: string;
  name: string;
  shortName: string;
  capacity: number;
  availableSeats: number;
  priceCategory: 'premium' | 'gold' | 'silver' | 'general';
  basePrice: number;
  color: string;
  path: string; // SVG path for the section
}

// Default cricket stadium sections
const defaultStadiumSections: StadiumSection[] = [
  {
    id: 'pavilion',
    name: 'Pavilion Stand',
    shortName: 'Pavilion',
    capacity: 5000,
    availableSeats: 3200,
    priceCategory: 'premium',
    basePrice: 15000,
    color: '#6366f1', // Indigo
    path: 'M 200 50 Q 250 30 300 50 L 300 80 Q 250 60 200 80 Z'
  },
  {
    id: 'north-a',
    name: 'North Stand A',
    shortName: 'North A',
    capacity: 6000,
    availableSeats: 4500,
    priceCategory: 'gold',
    basePrice: 8000,
    color: '#f59e0b', // Amber
    path: 'M 310 50 Q 360 30 410 60 L 400 90 Q 355 65 310 80 Z'
  },
  {
    id: 'north-b',
    name: 'North Stand B',
    shortName: 'North B',
    capacity: 6000,
    availableSeats: 5100,
    priceCategory: 'gold',
    basePrice: 8000,
    color: '#f59e0b',
    path: 'M 90 60 Q 140 30 190 50 L 190 80 Q 145 65 100 90 Z'
  },
  {
    id: 'east',
    name: 'East Stand',
    shortName: 'East',
    capacity: 10000,
    availableSeats: 7200,
    priceCategory: 'silver',
    basePrice: 4000,
    color: '#10b981', // Emerald
    path: 'M 410 70 Q 480 120 480 200 Q 480 280 410 330 L 390 310 Q 450 265 450 200 Q 450 135 390 90 Z'
  },
  {
    id: 'west',
    name: 'West Stand',
    shortName: 'West',
    capacity: 10000,
    availableSeats: 6800,
    priceCategory: 'silver',
    basePrice: 4000,
    color: '#10b981',
    path: 'M 90 70 Q 20 120 20 200 Q 20 280 90 330 L 110 310 Q 50 265 50 200 Q 50 135 110 90 Z'
  },
  {
    id: 'south-a',
    name: 'South Stand A',
    shortName: 'South A',
    capacity: 7000,
    availableSeats: 5600,
    priceCategory: 'general',
    basePrice: 2000,
    color: '#8b5cf6', // Violet
    path: 'M 100 340 Q 145 365 190 350 L 190 320 Q 150 335 110 310 Z'
  },
  {
    id: 'south-b',
    name: 'South Stand B',
    shortName: 'South B',
    capacity: 7000,
    availableSeats: 5900,
    priceCategory: 'general',
    basePrice: 2000,
    color: '#8b5cf6',
    path: 'M 310 350 Q 355 365 400 340 L 390 310 Q 350 335 310 320 Z'
  },
  {
    id: 'ground',
    name: 'Ground Level',
    shortName: 'Ground',
    capacity: 3000,
    availableSeats: 800,
    priceCategory: 'premium',
    basePrice: 25000,
    color: '#ef4444', // Red
    path: 'M 200 350 Q 250 370 300 350 L 300 320 Q 250 340 200 320 Z'
  }
];

interface CricketStadiumSeatMapProps {
  venueId?: string;
  venueName?: string;
  sections?: StadiumSection[];
  selectedSection: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  priceMultiplier?: number;
  teamColors?: { primary: string; secondary: string };
}

export const CricketStadiumSeatMap: React.FC<CricketStadiumSeatMapProps> = ({
  venueId,
  venueName = 'Cricket Stadium',
  sections = defaultStadiumSections,
  selectedSection,
  onSectionSelect,
  priceMultiplier = 1,
  teamColors
}) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleSectionClick = useCallback((sectionId: string) => {
    if (selectedSection === sectionId) {
      onSectionSelect(null);
    } else {
      onSectionSelect(sectionId);
    }
  }, [selectedSection, onSectionSelect]);

  const selectedSectionData = sections.find(s => s.id === selectedSection);

  // Price category badge colors
  const priceCategoryColors = {
    premium: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-amber-100 text-amber-800 border-amber-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    general: 'bg-green-100 text-green-800 border-green-300'
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {venueName}
            </h3>
            <p className="text-sm text-gray-500">
              Click on a section to view available seats
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stadium SVG */}
      <div className="relative p-4 bg-gradient-to-b from-green-900 to-green-800 overflow-auto">
        <div
          className="flex items-center justify-center min-h-[400px]"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <svg viewBox="0 0 500 400" className="w-full max-w-2xl">
            {/* Pitch in center */}
            <ellipse
              cx="250"
              cy="200"
              rx="180"
              ry="150"
              fill="#4ade80"
              stroke="#22c55e"
              strokeWidth="3"
              className="drop-shadow-md"
            />

            {/* Cricket pitch rectangle */}
            <rect
              x="220"
              y="130"
              width="60"
              height="140"
              fill="#d4b896"
              rx="4"
              className="drop-shadow-sm"
            />

            {/* Crease lines */}
            <line x1="230" y1="145" x2="270" y2="145" stroke="white" strokeWidth="2" />
            <line x1="230" y1="255" x2="270" y2="255" stroke="white" strokeWidth="2" />

            {/* Stadium sections */}
            {sections.map((section) => {
              const isHovered = hoveredSection === section.id;
              const isSelected = selectedSection === section.id;
              const fillOpacity = isSelected ? 1 : isHovered ? 0.9 : 0.75;

              return (
                <motion.path
                  key={section.id}
                  d={section.path}
                  fill={section.color}
                  fillOpacity={fillOpacity}
                  stroke={isSelected ? '#fff' : '#1f2937'}
                  strokeWidth={isSelected ? 3 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => handleSectionClick(section.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                />
              );
            })}

            {/* Section labels */}
            {sections.map((section) => {
              // Calculate label position based on section path
              const pathMatch = section.path.match(/M\s*([\d.]+)\s*([\d.]+)/);
              if (!pathMatch) return null;
              const x = parseFloat(pathMatch[1]) + 20;
              const y = parseFloat(pathMatch[2]) + 15;

              return (
                <text
                  key={`label-${section.id}`}
                  x={x}
                  y={y}
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-md"
                >
                  {section.shortName}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Price Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-600" />
            <span className="text-sm">Premium (₹15,000+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-sm">Gold (₹8,000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-sm">Silver (₹4,000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-violet-500" />
            <span className="text-sm">General (₹2,000)</span>
          </div>
        </div>
      </div>

      {/* Selected Section Details */}
      <AnimatePresence>
        {selectedSectionData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 bg-white dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold">{selectedSectionData.name}</h4>
                    <Badge className={cn(priceCategoryColors[selectedSectionData.priceCategory])}>
                      {selectedSectionData.priceCategory.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Available:</span>{' '}
                      {selectedSectionData.availableSeats.toLocaleString()} / {selectedSectionData.capacity.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>{' '}
                      ₹{Math.round(selectedSectionData.basePrice * priceMultiplier).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: teamColors?.primary || selectedSectionData.color
                  }}
                >
                  <Ticket className="w-4 h-4" />
                  Select Seats
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CricketStadiumSeatMap;
