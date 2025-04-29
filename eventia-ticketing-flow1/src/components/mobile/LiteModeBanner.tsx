import React, { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useNetwork from '@/hooks/useNetwork';

interface Navigator {
  userAgent: string;
  deviceMemory?: number;
  hardwareConcurrency: number;
}

/**
 * LiteModeBanner component detects low-end devices or poor connections
 * and offers users a switch to lite mode for better performance
 */
const LiteModeBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const { isConnectionFast, effectiveType, downlink } = useNetwork();
  
  // Determine if we should display the banner based on device and connection
  useEffect(() => {
    // Check if banner has been dismissed recently
    const hasDismissed = localStorage.getItem('liteBannerDismissed');
    if (hasDismissed && Date.now() - parseInt(hasDismissed, 10) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }
    
    // Check if already in lite mode
    const liteMode = localStorage.getItem('liteMode') === 'true';
    setIsLiteMode(liteMode);
    
    // Don't show banner if already in lite mode
    if (liteMode) {
      return;
    }
    
    // Detect if we should offer lite mode
    const shouldOfferLiteMode = () => {
      // Check if connection is poor
      const isPoorConnection = !isConnectionFast || 
                              effectiveType === '2g' || 
                              effectiveType === 'slow-2g' ||
                              downlink < 1.0;
      
      // Check if device is low-end
      const isLowEndDevice = () => {
        const nav = navigator as Navigator;
        
        // Check available memory if possible
        if ('deviceMemory' in nav) {
          return nav.deviceMemory! < 4;
        }
        
        // Use concurrency as a fallback for device power
        if ('hardwareConcurrency' in nav) {
          return nav.hardwareConcurrency <= 2;
        }
        
        // Fallback to user agent sniffing for older/low-end devices
        const ua = window.navigator.userAgent;
        return /Android 4/.test(ua) || 
               /Android 5/.test(ua) || 
               /iPhone OS (8|9)/.test(ua) || 
               /(237|239|240)x320/.test(ua);
      };
      
      return isPoorConnection || isLowEndDevice();
    };
    
    // Set banner visibility after a delay to avoid flashing during load
    const timer = setTimeout(() => {
      setIsVisible(shouldOfferLiteMode() && !dismissed);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isConnectionFast, effectiveType, downlink, dismissed]);
  
  // Handle banner dismissal
  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('liteBannerDismissed', Date.now().toString());
  };
  
  // Switch to lite mode
  const enableLiteMode = () => {
    localStorage.setItem('liteMode', 'true');
    setIsLiteMode(true);
    setIsVisible(false);
    
    // Reload page to apply lite mode settings
    window.location.href = '/lite';
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:max-w-sm bg-card p-4 rounded-lg shadow-lg border border-border z-50 animate-in slide-in-from-bottom">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start space-x-3">
        <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Experiencing slow performance?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Try our lite version for faster loading and reduced data usage on slow connections.
          </p>
          <Button 
            onClick={enableLiteMode} 
            size="sm" 
            className="w-full"
            variant="default"
          >
            Switch to Lite Mode
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiteModeBanner; 