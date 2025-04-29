import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import useRefreshToken from '@/hooks/useRefreshToken';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Component that handles persistent login by refreshing the access token on page load
 * Only attempts to refresh if the persist flag is true (user chose "Trust this device")
 */
const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken, persist } = useAuth();
  const refresh = useRefreshToken();
  
  useEffect(() => {
    // Define an IIFE to handle the async refresh
    let isMounted = true;
    
    const verifyRefreshToken = async () => {
      try {
        await refresh();
      } catch (err) {
        console.error('Refresh token error:', err);
      } finally {
        // Only update state if component is still mounted
        if (isMounted) setIsLoading(false);
      }
    };

    // Only try to refresh if we don't have a token and persist is enabled
    if (!accessToken && persist) {
      verifyRefreshToken();
    } else {
      setIsLoading(false);
    }

    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [accessToken, persist, refresh]);

  return (
    <>
      {!persist 
        ? <Outlet /> // Don't try to refresh if persist is false
        : isLoading
          ? <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          : <Outlet />
      }
    </>
  );
};

export default PersistLogin; 