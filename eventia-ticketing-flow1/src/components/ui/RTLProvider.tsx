import React, { useEffect, createContext, useContext, ReactNode } from 'react';

// List of RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'dv', 'ha', 'ku', 'ps', 'sd', 'ug', 'yi'];

// RTL context type
interface RTLContextType {
  isRTL: boolean;
  setRTL: (isRTL: boolean) => void;
}

// Create context with default values
const RTLContext = createContext<RTLContextType>({ 
  isRTL: false, 
  setRTL: () => {} 
});

interface RTLProviderProps {
  children: ReactNode;
  currentLanguage: string;
}

/**
 * RTLProvider component handles RTL language direction setup
 * Automatically sets the document direction based on the current language
 */
export const RTLProvider: React.FC<RTLProviderProps> = ({ children, currentLanguage }) => {
  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  // Update document direction when RTL status changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', currentLanguage);
    document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    // Add or remove RTL class on body
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Update CSS variables for RTL spacing and positioning
    if (isRTL) {
      document.documentElement.style.setProperty('--start-direction', 'right');
      document.documentElement.style.setProperty('--end-direction', 'left');
    } else {
      document.documentElement.style.setProperty('--start-direction', 'left');
      document.documentElement.style.setProperty('--end-direction', 'right');
    }
  }, [isRTL, currentLanguage]);
  
  // Force manual RTL mode (for testing or user preference)
  const setRTL = (rtl: boolean) => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    
    if (rtl) {
      document.body.classList.add('rtl');
      document.documentElement.style.setProperty('--start-direction', 'right');
      document.documentElement.style.setProperty('--end-direction', 'left');
    } else {
      document.body.classList.remove('rtl');
      document.documentElement.style.setProperty('--start-direction', 'left');
      document.documentElement.style.setProperty('--end-direction', 'right');
    }
  };

  return (
    <RTLContext.Provider value={{ isRTL, setRTL }}>
      {children}
    </RTLContext.Provider>
  );
};

// Custom hook to access RTL context
export const useRTL = (): RTLContextType => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

export default RTLProvider; 