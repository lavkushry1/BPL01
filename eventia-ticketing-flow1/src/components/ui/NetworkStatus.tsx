import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, Zap } from 'lucide-react';
import useNetwork from '@/hooks/useNetwork';
import { ConnectionType } from '@/utils/network';
import { toast } from '@/hooks/use-toast';

interface NetworkStatusProps {
  showToast?: boolean;
  className?: string;
}

/**
 * Component that displays network status and shows appropriate indicators
 */
const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showToast = true,
  className = '',
}) => {
  const networkInfo = useNetwork();
  const { isOnline, effectiveType, saveData } = networkInfo;
  
  // Track previous online status for toast notifications
  const [prevOnlineStatus, setPrevOnlineStatus] = useState<boolean | null>(null);
  
  // Show toast notifications when network status changes
  useEffect(() => {
    // Skip first render
    if (prevOnlineStatus === null) {
      setPrevOnlineStatus(isOnline);
      return;
    }
    
    // Only show toast if the status has changed and toast option is enabled
    if (showToast && prevOnlineStatus !== isOnline) {
      if (isOnline) {
        toast({
          title: "You're back online",
          description: "Your connection has been restored",
          variant: "default",
        });
      } else {
        toast({
          title: "You're offline",
          description: "Some features may be unavailable until you're back online",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
    
    setPrevOnlineStatus(isOnline);
  }, [isOnline, showToast, prevOnlineStatus]);
  
  // Get appropriate icon based on network status
  const getConnectionIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (saveData) {
      return <Zap className="h-4 w-4" />;
    }
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };
  
  // Get appropriate label based on network status
  const getConnectionLabel = () => {
    if (!isOnline) {
      return 'Offline';
    }
    
    if (saveData) {
      return 'Data Saver';
    }
    
    switch (effectiveType as ConnectionType) {
      case 'slow-2g':
      case '2g':
        return '2G (Slow)';
      case '3g':
        return '3G';
      case '4g':
        return '4G';
      default:
        return 'Online';
    }
  };
  
  // Get appropriate status color based on network status
  const getStatusColor = () => {
    if (!isOnline) {
      return 'bg-red-500';
    }
    
    if (saveData) {
      return 'bg-yellow-500';
    }
    
    switch (effectiveType as ConnectionType) {
      case 'slow-2g':
      case '2g':
        return 'bg-yellow-500';
      case '3g':
        return 'bg-blue-500';
      case '4g':
        return 'bg-green-500';
      default:
        return 'bg-green-500';
    }
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <div className="flex items-center gap-1">
        {getConnectionIcon()}
        <span className="text-sm">{getConnectionLabel()}</span>
      </div>
    </div>
  );
};

export default NetworkStatus; 