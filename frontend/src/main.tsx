import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { initServiceWorker } from './utils/serviceWorker';
import { toast } from './hooks/use-toast';
import { QueryClient } from '@tanstack/react-query';
import CombinedProviders from './contexts/CombinedProviders';

// Import error tracker to initialize it
import './utils/errorTracker';

// Import performance monitoring
import performanceMonitor from './utils/performanceMonitoring';

// Create a React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Initialize Service Worker for PWA capabilities
initServiceWorker(() => {
  // Show update notification when a new version is available
  toast({
    title: "Update Available",
    description: "A new version of Eventia is available. Reload for the latest features.",
    variant: "default",
    action: (
      <button
        onClick={() => window.location.reload()}
        className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
      >
        Update
      </button>
    ),
    duration: 0, // Persist until dismissed
  });
});

// Initialize mobile performance monitoring for mobile devices
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  performanceMonitor.start();
  console.log('Mobile performance monitoring started');
}

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
    <CombinedProviders queryClient={queryClient}>
      <App />
    </CombinedProviders>
  </React.StrictMode>
);
