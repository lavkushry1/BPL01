import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import useRefreshToken from '@/hooks/useRefreshToken';
import { Loader2 } from 'lucide-react';

/**
 * Component that handles persistent login by refreshing the access token on page load
 * Only attempts to refresh if the persist flag is true (user chose "Remember me")
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
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Restoring your session...</p>
              </div>
            </div>
          : <Outlet />
      }
    </>
  );
};

export default PersistLogin; 