import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Type, 
  Wand2, 
  Sparkles, 
  Moon, 
  X, 
  ScreenShare,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import useReducedMotion from '@/hooks/useReducedMotion';
import useHapticFeedback from '@/hooks/useHapticFeedback';

interface AccessibilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AccessibilitySettings component provides user controls for various accessibility features
 * Includes font size, reduced motion, screen reader optimization, contrast settings, etc.
 */
export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { prefersReducedMotion, setReducedMotion } = useReducedMotion();
  const { isHapticSupported, triggerHaptic } = useHapticFeedback();
  
  // State for various accessibility settings
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const savedSize = localStorage.getItem('a11y-fontSize');
      return savedSize ? parseInt(savedSize, 10) : 100;
    } catch (e) {
      return 100;
    }
  });
  
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('a11y-highContrast') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const [screenReaderMode, setScreenReaderMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('useScreenReader') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('a11y-soundEnabled') !== 'false'; // Default to true
    } catch (e) {
      return true;
    }
  });
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('a11y-fontSize', fontSize.toString());
    localStorage.setItem('a11y-highContrast', highContrast.toString());
    localStorage.setItem('useScreenReader', screenReaderMode.toString());
    localStorage.setItem('a11y-soundEnabled', soundEnabled.toString());
    
    // Apply font size to root element
    document.documentElement.style.fontSize = `${fontSize}%`;
    
    // Apply high contrast mode
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply screen reader optimizations
    if (screenReaderMode) {
      document.body.classList.add('sr-optimized');
    } else {
      document.body.classList.remove('sr-optimized');
    }
  }, [fontSize, highContrast, screenReaderMode, soundEnabled]);
  
  // Reset settings to defaults
  const resetSettings = () => {
    setFontSize(100);
    setHighContrast(false);
    setReducedMotion(false);
    setScreenReaderMode(false);
    setSoundEnabled(true);
    
    if (isHapticSupported) {
      triggerHaptic('medium');
    }
  };
  
  // Handle font size change with haptic feedback
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    if (isHapticSupported) {
      triggerHaptic('light');
    }
  };
  
  // Handle toggle change with haptic feedback
  const handleToggleChange = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    value: boolean
  ) => {
    setter(value);
    if (isHapticSupported) {
      triggerHaptic('light');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-auto w-[90vw] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Accessibility Settings</SheetTitle>
          <SheetDescription>
            Customize your experience to improve accessibility.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-8">
          {/* Font Size Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Type className="h-5 w-5" />
                <Label htmlFor="font-size">Text Size</Label>
              </div>
              <span className="text-sm text-muted-foreground">{fontSize}%</span>
            </div>
            
            <Slider
              id="font-size"
              min={75}
              max={200}
              step={5}
              value={[fontSize]}
              onValueChange={(values) => handleFontSizeChange(values[0])}
              aria-label="Adjust font size"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Smaller</span>
              <span>Default</span>
              <span>Larger</span>
            </div>
          </div>
          
          {/* Motion Reduction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <Label htmlFor="reduced-motion">Reduce Animations</Label>
            </div>
            <Switch
              id="reduced-motion"
              checked={prefersReducedMotion}
              onCheckedChange={(checked) => setReducedMotion(checked)}
              aria-label="Toggle reduced motion"
            />
          </div>
          
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Moon className="h-5 w-5" />
              <Label htmlFor="high-contrast">High Contrast</Label>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={(checked) => handleToggleChange(setHighContrast, checked)}
              aria-label="Toggle high contrast mode"
            />
          </div>
          
          {/* Screen Reader Optimization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ScreenShare className="h-5 w-5" />
              <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReaderMode}
              onCheckedChange={(checked) => handleToggleChange(setScreenReaderMode, checked)}
              aria-label="Toggle screen reader optimizations"
            />
          </div>
          
          {/* Sound Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
              <Label htmlFor="sound-enabled">Enable Sounds</Label>
            </div>
            <Switch
              id="sound-enabled"
              checked={soundEnabled}
              onCheckedChange={(checked) => handleToggleChange(setSoundEnabled, checked)}
              aria-label="Toggle sound effects"
            />
          </div>
          
          <SheetFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={resetSettings}
              className="w-full sm:w-auto"
            >
              Reset to Defaults
            </Button>
            <SheetClose asChild>
              <Button className="w-full sm:w-auto">Done</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AccessibilitySettings; 