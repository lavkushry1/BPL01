/**
 * Haptic feedback hook for providing tactile feedback on user interactions
 * Uses the Vibration API when available and gracefully degrades when not supported
 */

type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticFeedback {
  triggerHaptic: (intensity?: HapticIntensity) => void;
  isHapticSupported: boolean;
}

const useHapticFeedback = (): HapticFeedback => {
  // Check if vibration API is supported
  const isHapticSupported = 'vibrate' in navigator;
  
  // Get vibration pattern based on intensity
  const getVibrationPattern = (intensity: HapticIntensity): number | number[] => {
    switch (intensity) {
      case 'light':
        return 10; // 10ms vibration
      case 'medium':
        return 20; // 20ms vibration
      case 'heavy':
        return 30; // 30ms vibration
      case 'success':
        return [10, 30, 10]; // Short-pause-short pattern
      case 'warning':
        return [20, 20, 40]; // Medium-pause-long pattern
      case 'error':
        return [10, 10, 10, 10, 40]; // Three short pulses followed by a longer one
      default:
        return 20; // Default medium intensity
    }
  };
  
  // Trigger haptic feedback with specified intensity
  const triggerHaptic = (intensity: HapticIntensity = 'medium'): void => {
    if (!isHapticSupported) return;
    
    try {
      const pattern = getVibrationPattern(intensity);
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  };
  
  return {
    triggerHaptic,
    isHapticSupported,
  };
};

export default useHapticFeedback; 