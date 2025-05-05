import React from 'react';

/**
 * Component for displaying a legend explaining seat status colors
 */
const SeatLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-3 justify-center my-4">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-green-500 mr-2"></div>
        <span className="text-xs">Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-blue-500 mr-2"></div>
        <span className="text-xs">Selected</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-red-500 mr-2"></div>
        <span className="text-xs">Booked</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-yellow-500 mr-2"></div>
        <span className="text-xs">Reserved</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-orange-500 mr-2"></div>
        <span className="text-xs">Locked</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-sm bg-gray-400 mr-2"></div>
        <span className="text-xs">Blocked</span>
      </div>
    </div>
  );
};

export default SeatLegend; 