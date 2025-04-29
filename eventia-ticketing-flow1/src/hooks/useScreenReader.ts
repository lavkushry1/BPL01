import { useState, useEffect } from 'react';

/**
 * Hook to detect whether a screen reader is likely being used
 * Uses detection methods based on various screen reader signals
 * @returns Boolean indicating if a screen reader is likely active
 */
const useScreenReader = (): boolean => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState<boolean>(false);

  useEffect(() => {
    // Check for screen reader through various detection methods
    const detectScreenReader = (): boolean => {
      // Common screen reader detection methods
      
      // Method 1: Check for voiceOver on macOS/iOS and Safari
      const isVoiceOverActive = () => {
        return (
          // @ts-ignore - Non-standard Safari API
          typeof window.speechSynthesis !== 'undefined' && 
          window.speechSynthesis.pending !== undefined
        );
      };
      
      // Method 2: Check for NVDA or JAWS on Windows
      const isNVDAorJAWSActive = () => {
        // NVDA or JAWS often expose specific objects
        // @ts-ignore - Non-standard property
        return (document && document.documentElement && document.documentElement.getAttribute('role') === 'application');
      };
      
      // Method 3: Check if forced colors are active (high contrast mode)
      // Often used alongside screen readers
      const isForcedColorsActive = () => {
        return window.matchMedia('(forced-colors: active)').matches;
      };
      
      // Method 4: Check if user has explicitly enabled a preference for accessibility features
      const hasAccessibilityPreferences = () => {
        try {
          return localStorage.getItem('useScreenReader') === 'true';
        } catch {
          return false;
        }
      };
      
      // Method 5: Check reduction-motion preference
      // Users with screen readers often have this enabled
      const hasReducedMotionPreference = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };
      
      // Consider a screen reader active if any of these are true
      // Note: This is not foolproof but provides a reasonable guess
      return (
        isVoiceOverActive() || 
        isNVDAorJAWSActive() || 
        isForcedColorsActive() || 
        hasAccessibilityPreferences() ||
        hasReducedMotionPreference()
      );
    };

    // Set initial detection
    setIsScreenReaderActive(detectScreenReader());
    
    // Detect changes when CSS animations are enabled/disabled
    // which might indicate screen reader toggling
    const handleAnimationChange = () => {
      setIsScreenReaderActive(detectScreenReader());
    };
    
    // Some screen readers impact animation preferences
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Add event listener to track changes
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleAnimationChange);
    } else {
      // Fallback for older browsers
      reducedMotionQuery.addListener(handleAnimationChange);
    }
    
    // Cleanup function
    return () => {
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener('change', handleAnimationChange);
      } else {
        // Fallback for older browsers
        reducedMotionQuery.removeListener(handleAnimationChange);
      }
    };
  }, []);

  return isScreenReaderActive;
};

export default useScreenReader; 