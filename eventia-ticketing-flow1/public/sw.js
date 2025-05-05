// Service Worker for Eventia PWA
const CACHE_NAME = 'eventia-pwa-cache-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/styles/main.css',
  // Add key JS files here
];

// Maximum cache size (5MB)
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to check cache size
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  let size = 0;
  for (const request of keys) {
    const response = await cache.match(request);
    if (response && response.body !== null) {
      try {
        const blob = await response.clone().blob();
        size += blob.size;
      } catch (err) {
        console.warn('Error measuring response size:', err);
      }
    }
  }
  
  return size;
}

// Helper function to maintain cache size limits using LRU policy
async function limitCacheSize(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const cacheSize = await getCacheSize(cacheName);
    
    if (cacheSize > maxSize) {
      // Sort by last accessed (oldest first)
      const keysWithTimestamps = await Promise.all(
        keys.map(async (request) => {
          try {
            const response = await cache.match(request);
            if (!response) return { request, lastAccessed: 0 };
            
            const headers = response.headers;
            if (!headers) return { request, lastAccessed: 0 };
            
            const lastAccessed = headers.get('sw-accessed') || 0;
            return { request, lastAccessed: parseInt(lastAccessed, 10) };
          } catch (err) {
            console.warn('Error processing cache entry:', err);
            return { request, lastAccessed: 0 };
          }
        })
      );
      
      keysWithTimestamps.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // Delete oldest cached items until we're under the size limit
      let currentSize = cacheSize;
      for (const { request } of keysWithTimestamps) {
        if (currentSize <= maxSize) break;
        
        try {
          const response = await cache.match(request);
          if (response) {
            const responseClone = response.clone();
            try {
              const blob = await responseClone.blob();
              await cache.delete(request);
              currentSize -= blob.size;
            } catch (err) {
              await cache.delete(request);
              // If we can't measure the size, just delete and estimate
              currentSize -= 10000; // Assume 10KB
            }
          }
        } catch (err) {
          console.warn('Error removing cache entry:', err);
          await cache.delete(request);
        }
      }
    }
  } catch (err) {
    console.error('Error in cache size management:', err);
  }
}

// Helper for network-first strategy with fallback to cache
async function networkFirstWithFallback(request) {
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Clone the response before modifying it
        const responseToCache = networkResponse.clone();
        
        // Add timestamp header for LRU caching policy
        // We need to create a new response with the timestamp header
        const responseBlob = await responseToCache.blob();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-accessed', Date.now().toString());
        
        const modifiedResponse = new Response(responseBlob, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers
        });
        
        // Store in cache
        await cache.put(request, modifiedResponse);
        
        // Ensure we don't exceed our cache size limit
        // We do this in a non-awaited way to not block the response
        limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE)
          .catch(err => console.warn('Cache size limit check failed:', err));
      } catch (err) {
        console.warn('Failed to cache network response:', err);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Network request failed, try cache
    try {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        try {
          // Update the access timestamp for LRU
          const cache = await caches.open(CACHE_NAME);
          const cachedResponseClone = cachedResponse.clone();
          const cachedResponseBlob = await cachedResponseClone.blob();
          
          const headers = new Headers(cachedResponse.headers);
          headers.set('sw-accessed', Date.now().toString());
          
          const modifiedResponse = new Response(cachedResponseBlob, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers
          });
          
          // Store updated response (don't wait for it)
          cache.put(request, modifiedResponse)
            .catch(err => console.warn('Failed to update cached response:', err));
          
          return cachedResponse;
        } catch (err) {
          console.warn('Error updating cached response:', err);
          return cachedResponse;
        }
      }
      
      // No cached response, show offline page for HTML requests
      if (request.mode === 'navigate') {
        const offlineCache = await caches.open(CACHE_NAME);
        const offlineResponse = await offlineCache.match(OFFLINE_URL);
        return offlineResponse || new Response('Network error - No offline page available', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Otherwise return a basic error
      return new Response('Network error happened', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
      return new Response('Critical error in service worker', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}

// Fetch event - handle network requests with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip Vite development server requests
  if (event.request.url.includes('/@vite/') || 
      event.request.url.includes('?t=') || 
      event.request.url.includes('/@react-refresh')) {
    return; // Let the browser handle these requests normally
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Special handling for manifest.json to prevent body locked issue
  if (event.request.url.includes('manifest.json')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse.clone();
        }
        return fetch(event.request)
          .then((response) => {
            // Clone the response before caching it
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(error => {
            console.warn('Failed to fetch manifest:', error);
            return new Response(JSON.stringify({
              name: 'Eventia Ticketing',
              short_name: 'Eventia',
              start_url: '/',
              display: 'standalone',
              background_color: '#ffffff',
              theme_color: '#4f46e5',
              icons: []
            }), {
              headers: {'Content-Type': 'application/json'}
            });
          });
      })
    );
    return;
  }
  
  // For HTML navigation requests, use network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(event.request));
    return;
  }
  
  // For API requests, prefer network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For image and static assets, use cache-first strategy
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse.clone();
        }
        
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response before caching it and returning
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE);
            });
            
            return response;
          })
          .catch(error => {
            console.warn(`Failed to fetch ${event.request.url}:`, error);
            // Return a fallback response for images
            if (event.request.destination === 'image') {
              return new Response('', {
                status: 200,
                headers: {'Content-Type': 'image/svg+xml'}
              });
            }
            throw error;
          });
      })
    );
    return;
  }
  
  // Default: network-first with fallback to cache
  event.respondWith(networkFirstWithFallback(event.request));
}); 