import React from 'react';
import { Plus, Minus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Zoom Controls Component
 * Provides UI for zooming, panning and view resetting
 */
interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onARView?: () => void;
  showARButton: boolean;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  onZoomIn, 
  onZoomOut, 
  onResetView, 
  onARView, 
  showARButton 
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <Button size="icon" variant="outline" onClick={onZoomIn}>
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onZoomOut}>
        <Minus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" onClick={onResetView}>
        <MapPin className="h-4 w-4" />
      </Button>
      {showARButton && onARView && (
        <Button size="icon" variant="outline" onClick={onARView}>
          <span className="font-bold">AR</span>
        </Button>
      )}
    </div>
  );
};

export default ZoomControls; 