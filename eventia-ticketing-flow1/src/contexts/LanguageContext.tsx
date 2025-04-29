import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';

// Available languages
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  // Add more languages as needed
];

// The shape of our language context
type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (code: string) => void;
  getCurrentLanguageName: () => string;
  isRTL: boolean;
};

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState(i18n.dir() === 'rtl');

  useEffect(() => {
    // Get saved language from localStorage or use browser settings
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && savedLang !== currentLanguage) {
      changeLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    // Update RTL state when language changes
    setIsRTL(i18n.dir() === 'rtl');
    // Update html lang attribute
    document.documentElement.lang = currentLanguage;
    // Update dir attribute for RTL languages
    document.documentElement.dir = i18n.dir();
    // Update body class for styling
    if (i18n.dir() === 'rtl') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [currentLanguage]);

  // Handle language change
  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setCurrentLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  // Get current language name in native format
  const getCurrentLanguageName = () => {
    const lang = languages.find(lang => lang.code === currentLanguage);
    return lang ? lang.nativeName : 'English';
  };

  // Context value
  const value = {
    currentLanguage,
    changeLanguage,
    getCurrentLanguageName,
    isRTL
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider; 