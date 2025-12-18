import React, { useState } from 'react';
import { MatchLayoutResponse, LayoutStandSummary } from '../../services/api/matchLayoutApi';

interface StadiumMapProps {
  layout: MatchLayoutResponse;
  onStandClick: (stand: LayoutStandSummary) => void;
}

const StadiumMap: React.FC<StadiumMapProps> = ({ layout, onStandClick }) => {
  const { stadium, stands } = layout;

  const [tooltip, setTooltip] = useState<{
    stand: LayoutStandSummary;
    x: number;
    y: number;
  } | null>(null);

  const getStandColor = (status: LayoutStandSummary['status'], minPrice: number | null) => {
    if (status === 'SOLD_OUT') return '#D1D5DB'; // Grey (sold out)

    // BookMyShow-like: color by price bucket (status affects label, not the fill)
    if (minPrice === null) return '#22C55E'; // Green
    if (minPrice >= 5000) return '#F59E0B'; // Gold
    if (minPrice >= 2500) return '#8B5CF6'; // Purple
    if (minPrice >= 1500) return '#3B82F6'; // Blue
    return '#22C55E'; // Green
  };

  const formatPrice = (value: number | null) => (value === null ? '—' : `₹${value.toLocaleString('en-IN')}`);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 w-full h-full bg-white rounded-lg shadow-inner overflow-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Select a Stand</h2>
        <p className="text-sm text-gray-500">Hover to see prices, click to zoom in</p>
      </div>

      <div className="relative w-full max-w-4xl aspect-square lg:aspect-video">
        <svg 
          viewBox={stadium.viewBox || "0 0 1000 1000"} 
          className="w-full h-full drop-shadow-md"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background / Field Placeholder if needed */}
          <circle cx="500" cy="500" r="150" fill="#4ADE80" opacity="0.2" />
          
          {stands.map((stand) => (
            <g 
              key={stand.id} 
              className={stand.status === 'SOLD_OUT' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
              onClick={() => stand.status !== 'SOLD_OUT' && onStandClick(stand)}
              onMouseEnter={(e) => setTooltip({ stand, x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))}
              onMouseLeave={() => setTooltip(null)}
            >
              <path
                d={stand.svgPath}
                fill={getStandColor(stand.status, stand.minPrice)}
                stroke={stand.status === 'FAST_FILLING' ? '#F97316' : '#FFFFFF'}
                strokeWidth={stand.status === 'FAST_FILLING' ? 3 : 2}
                className="stand-polygon transition-[filter,opacity] duration-150 hover:opacity-90"
              />
              
              <title>
                {`${stand.name} | ${stand.status === 'SOLD_OUT' ? 'Sold Out' : `Starts at ${formatPrice(stand.minPrice)} | Available`}`}
              </title>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur p-3 rounded-md shadow text-xs space-y-2 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white"></div>
            <span>Fast filling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span>₹5000+ (VIP)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>₹2500+ (Premium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>₹1500+ (Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Under ₹1500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Sold Out</span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          role="tooltip"
        >
          <div className="font-semibold text-gray-900">{tooltip.stand.name}</div>
          <div className="text-gray-600">
            Price: {formatPrice(tooltip.stand.minPrice)}{' '}
            <span className="text-gray-300">|</span>{' '}
            {tooltip.stand.status === 'SOLD_OUT' ? 'Sold Out' : 'Available'}
          </div>
        </div>
      )}
    </div>
  );
};

export default StadiumMap;
