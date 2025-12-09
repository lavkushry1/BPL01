import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface EventImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export const EventImageGallery: React.FC<EventImageGalleryProps> = ({
  images,
  alt = 'Event image',
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  
  // If no images provided, display placeholder
  if (!images || images.length === 0) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-gray-100 aspect-[16/9]", className)}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Image className="w-12 h-12 opacity-30" />
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main image */}
      <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-gray-100">
        <img 
          src={images[currentIndex]} 
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Fullscreen button */}
        <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon"
              className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 border-0 text-white rounded-full"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl p-0 bg-black border-0">
            <div className="relative h-[80vh] flex items-center justify-center p-4">
              <img 
                src={images[currentIndex]} 
                alt={`${alt} ${currentIndex + 1} (fullscreen)`}
                className="max-h-full max-w-full object-contain"
              />
              
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setFullscreenOpen(false)}
              >
                ✕
              </Button>
              
              {images.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Navigation arrows (only show if there are multiple images) */}
        {images.length > 1 && (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
      
      {/* Thumbnails (only show if there are multiple images) */}
      {images.length > 1 && (
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                "h-16 w-16 rounded overflow-hidden flex-shrink-0 border-2",
                index === currentIndex 
                  ? "border-primary" 
                  : "border-transparent hover:border-gray-300"
              )}
              onClick={() => setCurrentIndex(index)}
            >
              <img 
                src={image} 
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 