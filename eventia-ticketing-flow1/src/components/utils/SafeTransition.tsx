import { ReactNode, useState, useEffect } from 'react';
import PageTransition from '../ui/page-transition';

interface SafeTransitionProps {
  children: ReactNode;
}

const SafeTransition = ({ children }: SafeTransitionProps) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is related to transitions or animations
      const errorMessage = event.error?.message || '';
      if (
        errorMessage.includes('transition') || 
        errorMessage.includes('animation') ||
        errorMessage.includes('framer') ||
        errorMessage.includes('motion')
      ) {
        console.error('Animation error caught:', event.error);
        setHasError(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there was a transition error, render children without transition effects
  if (hasError) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  // Otherwise use normal page transition
  return <PageTransition>{children}</PageTransition>;
};

export default SafeTransition; 