import React from 'react';
import { MatchLayoutResponse, LayoutStandSummary } from '../../services/api/matchLayoutApi';

interface StadiumMapProps {
  layout: MatchLayoutResponse;
  onStandClick: (stand: LayoutStandSummary) => void;
}

const StadiumMap: React.FC<StadiumMapProps> = ({ layout, onStandClick }) => {
  const { stadium, stands } = layout;

  const getStandColor = (status: string, minPrice: number | null) => {
    if (status === 'SOLD_OUT') return '#D1D5DB'; // Gray
    if (status === 'FAST_FILLING') return '#FCD34D'; // Yellow/Amber
    
    // Color code based on price range (example logic)
    if (!minPrice) return '#10B981'; // Green
    if (minPrice > 2000) return '#6366F1'; // Indigo (Premium)
    if (minPrice > 1000) return '#3B82F6'; // Blue
    return '#10B981'; // Green (Standard)
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-white rounded-lg shadow-inner overflow-auto">
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
              className="cursor-pointer transition-all duration-200 hover:brightness-90 group"
              onClick={() => onStandClick(stand)}
            >
              <path
                d={stand.svgPath}
                fill={getStandColor(stand.status, stand.minPrice)}
                stroke="#fff"
                strokeWidth="2"
                className="stand-polygon"
              />
              
              {/* Tooltip implementation via title (native) or custom overlay */}
              <title>
                {`${stand.name} | ${stand.status === 'SOLD_OUT' ? 'Sold Out' : `Starts at ₹${stand.minPrice}`}`}
              </title>

              {/* Visual label on hover (optional enhancement) */}
              <text
                 x="50%" y="50%" // This needs actual centroids to be accurate, simplified for now
                 textAnchor="middle"
                 className="hidden group-hover:block pointer-events-none fill-white font-bold text-xs"
                 style={{ fontSize: '12px' }}
              >
                {stand.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur p-3 rounded-md shadow text-xs space-y-2 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span>Fast Filling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Sold Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StadiumMap;
