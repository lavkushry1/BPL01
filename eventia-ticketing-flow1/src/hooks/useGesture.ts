import { useState, useRef, useEffect, RefObject } from 'react';

type Direction = 'left' | 'right' | 'up' | 'down';

interface GestureCallbacks {
  onSwipe?: (direction: Direction, distance: number, velocity: number) => void;
  onSwipeLeft?: (distance: number, velocity: number) => void;
  onSwipeRight?: (distance: number, velocity: number) => void;
  onSwipeUp?: (distance: number, velocity: number) => void;
  onSwipeDown?: (distance: number, velocity: number) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPinchStart?: () => void;
  onPinchEnd?: (scale: number) => void;
  onTap?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
}

interface GestureOptions {
  swipeThreshold?: number;
  swipeTimeThreshold?: number;
  preventDefaultTouchMove?: boolean;
  passive?: boolean;
  doubleTapDelay?: number;
}

interface GestureState {
  isGesturing: boolean;
  isPinching: boolean;
  currentScale: number;
}

/**
 * Custom hook for handling mobile touch gestures
 * Supports swipe, pinch, tap, and double-tap
 */
const useGesture = <T extends HTMLElement>(
  elementRef: RefObject<T>,
  callbacks: GestureCallbacks,
  options: GestureOptions = {}
): GestureState => {
  const {
    swipeThreshold = 50,
    swipeTimeThreshold = 300,
    preventDefaultTouchMove = false,
    passive = true,
    doubleTapDelay = 300,
  } = options;
  
  const [isGesturing, setIsGesturing] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  
  // Refs to store gesture state
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  
  const touchEndRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  
  const initialTouchDistanceRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  
  // Calculate distance between two touch points
  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    
    const [touch1, touch2] = [touches[0], touches[1]];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // Calculate center point between two touches
  const getCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      return { x: touches[0]?.clientX || 0, y: touches[0]?.clientY || 0 };
    }
    
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - potential swipe or tap
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      } else if (e.touches.length === 2) {
        // Two touches - potential pinch
        initialTouchDistanceRef.current = getDistance(e.touches);
        setIsPinching(true);
        callbacks.onPinchStart?.();
      }
      
      setIsGesturing(true);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }
      
      if (e.touches.length === 2 && callbacks.onPinch) {
        // Handle pinch gesture
        const currentDistance = getDistance(e.touches);
        const initialDistance = initialTouchDistanceRef.current;
        
        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          setCurrentScale(scale);
          callbacks.onPinch(scale, getCenter(e.touches));
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      setIsGesturing(false);
      
      if (isPinching) {
        setIsPinching(false);
        callbacks.onPinchEnd?.(currentScale);
        initialTouchDistanceRef.current = 0;
        setCurrentScale(1);
        return;
      }
      
      // Handle tap and double tap
      if (
        touchStartRef.current &&
        Math.abs(touchStartRef.current.x - (e.changedTouches[0]?.clientX || 0)) < 10 &&
        Math.abs(touchStartRef.current.y - (e.changedTouches[0]?.clientY || 0)) < 10
      ) {
        const position = {
          x: e.changedTouches[0]?.clientX || 0,
          y: e.changedTouches[0]?.clientY || 0,
        };
        
        const now = Date.now();
        const lastTap = lastTapTimeRef.current;
        
        if (now - lastTap < doubleTapDelay) {
          // Double tap detected
          callbacks.onDoubleTap?.(position);
          lastTapTimeRef.current = 0; // Reset to prevent triple tap
        } else {
          // Single tap detected
          callbacks.onTap?.(position);
          lastTapTimeRef.current = now;
        }
        
        return;
      }
      
      // Handle swipe
      if (!touchStartRef.current) return;
      
      const touchStart = touchStartRef.current;
      touchEndRef.current = {
        x: e.changedTouches[0]?.clientX || 0,
        y: e.changedTouches[0]?.clientY || 0,
        time: Date.now(),
      };
      
      const touchEnd = touchEndRef.current;
      
      // Calculate swipe direction and distance
      const xDiff = touchStart.x - touchEnd.x;
      const yDiff = touchStart.y - touchEnd.y;
      const timeDiff = touchEnd.time - touchStart.time;
      
      if (timeDiff <= swipeTimeThreshold) {
        const isHorizontal = Math.abs(xDiff) > Math.abs(yDiff);
        
        if (isHorizontal && Math.abs(xDiff) > swipeThreshold) {
          // Horizontal swipe
          const direction: Direction = xDiff > 0 ? 'left' : 'right';
          const distance = Math.abs(xDiff);
          const velocity = distance / timeDiff;
          
          callbacks.onSwipe?.(direction, distance, velocity);
          
          if (direction === 'left') {
            callbacks.onSwipeLeft?.(distance, velocity);
          } else {
            callbacks.onSwipeRight?.(distance, velocity);
          }
        } else if (!isHorizontal && Math.abs(yDiff) > swipeThreshold) {
          // Vertical swipe
          const direction: Direction = yDiff > 0 ? 'up' : 'down';
          const distance = Math.abs(yDiff);
          const velocity = distance / timeDiff;
          
          callbacks.onSwipe?.(direction, distance, velocity);
          
          if (direction === 'up') {
            callbacks.onSwipeUp?.(distance, velocity);
          } else {
            callbacks.onSwipeDown?.(distance, velocity);
          }
        }
      }
      
      // Reset touch state
      touchStartRef.current = null;
      touchEndRef.current = null;
    };
    
    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive });
    
    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    callbacks,
    elementRef,
    swipeThreshold,
    swipeTimeThreshold,
    preventDefaultTouchMove,
    passive,
    doubleTapDelay,
    isPinching,
    currentScale,
  ]);
  
  return {
    isGesturing,
    isPinching,
    currentScale,
  };
};

export default useGesture; 