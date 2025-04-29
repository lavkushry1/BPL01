import React, { useState, useRef, useEffect } from 'react';
import { getLoadingStrategy, getImageQuality } from '@/utils/network';
import useNetwork from '@/hooks/useNetwork';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  blurPlaceholder?: string;
  sizes?: string;
  lazy?: boolean;
}

/**
 * OptimizedImage component using <picture> element with AVIF/WEBP formats and fallbacks
 * Automatically handles responsive images and optimizes based on network conditions
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  blurPlaceholder,
  sizes = '100vw',
  lazy,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { isConnectionFast, saveData } = useNetwork();
  
  // Parse image path and extension
  const getImagePathInfo = (imagePath: string) => {
    const lastDotIndex = imagePath.lastIndexOf('.');
    const imageName = imagePath.substring(0, lastDotIndex);
    const imageExt = imagePath.substring(lastDotIndex + 1);
    return { imageName, imageExt };
  };
  
  const { imageName, imageExt } = getImagePathInfo(src);
  
  // Determine if the image should be lazy loaded
  const shouldLazyLoad = lazy !== undefined ? lazy : getLoadingStrategy() === 'lazy';
  
  // Determine quality based on connection
  const quality = getImageQuality();
  
  // Handle intersection observer for lazy loading
  useEffect(() => {
    if (!shouldLazyLoad || !imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const sources = img.parentElement?.querySelectorAll('source');
            
            // Add the real src to both the image and source elements
            if (sources) {
              sources.forEach((source) => {
                if (source.dataset.src) {
                  source.srcset = source.dataset.src;
                }
              });
            }
            
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '200px' } // Start loading when within 200px of viewport
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [shouldLazyLoad]);
  
  // Get adjusted resolution based on connection speed
  const getResolution = () => {
    if (saveData) {
      return 'low';
    }
    
    if (!isConnectionFast) {
      return 'medium';
    }
    
    return 'high';
  };
  
  // Create srcset for different resolutions
  const getSourceSet = (format: string) => {
    const resolution = getResolution();
    
    if (resolution === 'low') {
      return `${imageName}.${format}?q=${quality}&w=480 480w`;
    }
    
    if (resolution === 'medium') {
      return `${imageName}.${format}?q=${quality}&w=768 768w, ${imageName}.${format}?q=${quality}&w=1080 1080w`;
    }
    
    return `${imageName}.${format}?q=${quality}&w=480 480w, ${imageName}.${format}?q=${quality}&w=768 768w, ${imageName}.${format}?q=${quality}&w=1080 1080w, ${imageName}.${format}?q=${quality}&w=1920 1920w`;
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {blurPlaceholder && !loaded && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-xl transform scale-110" 
          style={{ backgroundImage: `url(${blurPlaceholder})`, opacity: 0.7 }}
        />
      )}
      
      <picture>
        {/* AVIF format - best compression, modern browsers */}
        <source
          data-src={shouldLazyLoad ? getSourceSet('avif') : undefined}
          srcSet={!shouldLazyLoad ? getSourceSet('avif') : undefined}
          type="image/avif"
          sizes={sizes}
        />
        
        {/* WebP format - good compression, wide support */}
        <source
          data-src={shouldLazyLoad ? getSourceSet('webp') : undefined}
          srcSet={!shouldLazyLoad ? getSourceSet('webp') : undefined}
          type="image/webp"
          sizes={sizes}
        />
        
        {/* Original format as fallback */}
        <img
          ref={imgRef}
          data-src={shouldLazyLoad ? src : undefined}
          src={!shouldLazyLoad ? src : blurPlaceholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
          alt={alt}
          width={width}
          height={height}
          loading={shouldLazyLoad ? 'lazy' : 'eager'}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage; 