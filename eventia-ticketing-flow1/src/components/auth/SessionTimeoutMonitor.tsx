import { useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// 30 minutes of inactivity before logout (in milliseconds)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

/**
 * Component that monitors user activity and logs out after a period of inactivity
 * Only active when user is authenticated and shown to all pages that require authentication
 */
const SessionTimeoutMonitor: React.FC = () => {
  const { isAuthenticated, logout, persist } = useAuth();
  
  useEffect(() => {
    // Only monitor session if authenticated
    if (!isAuthenticated) return;
    
    // Don't monitor session timeout if user has chosen to persist their session
    if (persist) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        toast({
          title: "Session expired",
          description: "You have been logged out due to inactivity",
          variant: "default"
        });
      }, INACTIVITY_TIMEOUT);
    };
    
    // Event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimeout));
    
    // Initial setup
    resetTimeout();
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimeout));
    };
  }, [isAuthenticated, logout, persist]);
  
  return null;
};

export default SessionTimeoutMonitor; 