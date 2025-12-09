import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading Skeleton Component
 * Renders placeholder UI while the seat map is loading
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <div className="flex gap-1">
              {Array(10).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <Skeleton className="h-16 w-full" />
    </div>
  );
};

export default LoadingSkeleton; 