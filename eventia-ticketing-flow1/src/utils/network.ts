/**
 * Network utilities for handling network status and providing network-aware loading strategies
 */

// Network connection types
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

// Interface for connection information
export interface ConnectionInfo {
  downlink: number;       // Mbps
  effectiveType: ConnectionType;
  rtt: number;           // Round trip time in ms
  saveData: boolean;      // Data saver mode enabled
  isOnline: boolean;      // Device is online
  isConnectionFast: boolean; // Is this a fast connection
}

// Get static default connection info
const getDefaultConnectionInfo = (): ConnectionInfo => ({
  downlink: 10,
  effectiveType: '4g',
  rtt: 50,
  saveData: false,
  isOnline: true,
  isConnectionFast: true,
});

// Get information about the current network connection
export const getConnectionInfo = (): ConnectionInfo => {
  const navigator = window.navigator;
  const connection = 'connection' in navigator 
    ? (navigator as any).connection 
    : null;
  
  if (!connection) {
    return {
      ...getDefaultConnectionInfo(),
      isOnline: navigator.onLine,
    };
  }
  
  const { downlink, effectiveType, rtt, saveData } = connection;
  
  // Determine if connection is "fast" based on effective type
  const isConnectionFast = 
    effectiveType === '4g' || 
    (effectiveType === '3g' && downlink >= 1.5);
  
  return {
    downlink,
    effectiveType: effectiveType as ConnectionType,
    rtt,
    saveData,
    isOnline: navigator.onLine,
    isConnectionFast,
  };
};

// Determine image quality based on connection type
export const getImageQuality = (defaultQuality = 80): number => {
  const { effectiveType, saveData } = getConnectionInfo();
  
  // If data saver is enabled, reduce quality
  if (saveData) {
    return 50;
  }
  
  // Adjust quality based on connection type
  switch (effectiveType) {
    case 'slow-2g':
      return 30;
    case '2g':
      return 40;
    case '3g':
      return 60;
    case '4g':
      return defaultQuality;
    default:
      return defaultQuality;
  }
};

// Get image size based on connection type
export const getImageSize = (
  sizes: { sm: number; md: number; lg: number; xl: number }
): number => {
  const { effectiveType, saveData } = getConnectionInfo();
  
  // If data saver is enabled, always use smallest size
  if (saveData) {
    return sizes.sm;
  }
  
  // Adjust size based on connection type
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return sizes.sm;
    case '3g':
      return sizes.md;
    case '4g':
      return sizes.lg;
    default:
      return sizes.lg;
  }
};

// Function to determine loading strategy
export const getLoadingStrategy = (): 'eager' | 'lazy' => {
  const { isConnectionFast, saveData } = getConnectionInfo();
  
  // If connection is slow or data saver is enabled, lazy load
  if (!isConnectionFast || saveData) {
    return 'lazy';
  }
  
  return 'eager';
};

// Listen for network status changes
export const listenForNetworkChanges = (
  callback: (info: ConnectionInfo) => void
): () => void => {
  const handleOnlineStatusChange = () => {
    callback(getConnectionInfo());
  };
  
  window.addEventListener('online', handleOnlineStatusChange);
  window.addEventListener('offline', handleOnlineStatusChange);
  
  const connection = 'connection' in navigator 
    ? (navigator as any).connection 
    : null;
  
  if (connection) {
    connection.addEventListener('change', handleOnlineStatusChange);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnlineStatusChange);
    window.removeEventListener('offline', handleOnlineStatusChange);
    
    if (connection) {
      connection.removeEventListener('change', handleOnlineStatusChange);
    }
  };
}; 