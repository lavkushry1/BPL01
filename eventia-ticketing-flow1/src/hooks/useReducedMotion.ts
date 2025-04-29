import { useState, useEffect } from 'react';

/**
 * Hook for detecting and responding to the user's motion preference
 * Tracks the prefers-reduced-motion media query to respect user's system preferences
 * @returns Boolean indicating if reduced motion is preferred
 */
export const useReducedMotion = (): {
  prefersReducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
} => {
  // Check for user's saved preference from localStorage first (overrides system preference)
  const getSavedPreference = (): boolean | null => {
    try {
      const saved = localStorage.getItem('reducedMotion');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  // Get initial state - check user settings first, then system preference
  const getInitialState = (): boolean => {
    const savedPreference = getSavedPreference();
    
    // If user has explicitly set a preference, use that
    if (savedPreference !== null) {
      return savedPreference;
    }
    
    // Otherwise check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    // Default to false if running during SSR
    return false;
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialState);

  // Allow explicitly setting the motion preference (overrides system)
  const setReducedMotion = (value: boolean): void => {
    setPrefersReducedMotion(value);
    localStorage.setItem('reducedMotion', JSON.stringify(value));
  };

  // Listen for changes to the prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Only update if user hasn't set an explicit preference
    const handleChange = (event: MediaQueryListEvent): void => {
      if (getSavedPreference() === null) {
        setPrefersReducedMotion(event.matches);
      }
    };
    
    // Add event listener using the appropriate method
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return { prefersReducedMotion, setReducedMotion };
};

export default useReducedMotion; 