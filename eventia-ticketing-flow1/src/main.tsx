import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Import error tracker to initialize it
import './utils/errorTracker';

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    
    // Only send errors in production
    enabled: import.meta.env.PROD,
    
    // Capture environment
    environment: import.meta.env.MODE,
    
    // Capture release version
    release: import.meta.env.VITE_APP_VERSION || 'development',
    
    // Set max breadcrumbs
    maxBreadcrumbs: 50,
    
    // Capture unhandled promise rejections
    beforeSend(event, hint) {
      // Check if it is an exception, and if so, log it
      if (event.exception) {
        console.error(`[Sentry] Captured error: ${hint?.originalException || event.exception}`);
      }
      return event;
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
