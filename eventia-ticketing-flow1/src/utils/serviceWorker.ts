/**
 * Service Worker registration and management
 */

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('Service worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

// Update the service worker when available
export const updateServiceWorker = async (
  registration: ServiceWorkerRegistration,
  onUpdate?: () => void
): Promise<void> => {
  const refreshing = false;

  // When the user asks to refresh the page, we need to reload the current page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    window.location.reload();
  });

  try {
    // First check if there's already a waiting worker
    if (registration.waiting) {
      if (onUpdate) {
        onUpdate();
      }
      
      // Send a message to the waiting service worker to activate it
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    
    // Otherwise try to update
    await registration.update();
    
    // After update, check again if there's a waiting worker
    if (registration.waiting) {
      if (onUpdate) {
        onUpdate();
      }
      
      // Send a message to the waiting service worker to activate it
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (error) {
    console.error('Service worker update failed:', error);
  }
};

// Check for service worker updates
export const checkForServiceWorkerUpdates = (
  onUpdate?: () => void
): void => {
  if (!isServiceWorkerSupported()) return;

  // Check for updates every 60 minutes (adjust as needed)
  setInterval(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await updateServiceWorker(registration, onUpdate);
    }
  }, 60 * 60 * 1000);
};

// Unregister all service workers and clear caches
export const unregisterServiceWorkers = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    await Promise.all(
      registrations.map(async (registration) => {
        const unregistered = await registration.unregister();
        return unregistered;
      })
    );
    
    // Clear caches
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(async (key) => {
          await caches.delete(key);
        })
      );
    }
    
    return true;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
};

// Initialize service worker - call this once on app startup
export const initServiceWorker = (
  onUpdate?: () => void
): void => {
  if (!isServiceWorkerSupported()) return;

  // Register service worker
  registerServiceWorker().then((registration) => {
    if (registration) {
      // Set up update checker
      checkForServiceWorkerUpdates(onUpdate);
    }
  });

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type } = event.data;
    
    // Handle any custom messages from service worker
    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache has been updated with new content');
        break;
      case 'OFFLINE_MODE':
        console.log('Application is now in offline mode');
        break;
      // Add more message handlers as needed
    }
  });
}; 