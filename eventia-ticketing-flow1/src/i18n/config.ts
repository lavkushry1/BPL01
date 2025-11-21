import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';

// Initialize i18next
i18n
  .use(Backend) // Load translations via HTTP (supports lazy loading)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    // Translations resources
    resources: {
      en: {
        translation: enTranslation
      },
      hi: {
        translation: hiTranslation
      }
    },
    // Default language
    lng: 'en',
    // Fallback language
    fallbackLng: 'en',
    // Detect user language settings
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language detection
      caches: ['localStorage'],
      // HTML attributes to look for
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    // Interpolation options
    interpolation: {
      escapeValue: false // Not needed for React as it escapes by default
    },
    // Enable debugging in development
    debug: import.meta.env.DEV,
    // Other options
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'a'],
    },
    // Don't load namespaces automatically
    partialBundledLanguages: true,
    // Cache
    load: 'currentOnly',
    // Preload languages
    preload: ['en', 'hi'],
  });

export default i18n;
