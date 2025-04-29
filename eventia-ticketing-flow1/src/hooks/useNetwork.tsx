import { useState, useEffect } from 'react';
import { getConnectionInfo, listenForNetworkChanges, ConnectionInfo } from '@/utils/network';

/**
 * Custom hook for accessing and monitoring network status
 * @returns Network connection information and status
 */
export const useNetwork = () => {
  const [networkInfo, setNetworkInfo] = useState<ConnectionInfo>(getConnectionInfo());
  
  useEffect(() => {
    // Set up listener for network changes
    const cleanup = listenForNetworkChanges((info) => {
      setNetworkInfo(info);
    });
    
    // Return cleanup function
    return cleanup;
  }, []);
  
  return networkInfo;
};

export default useNetwork; 