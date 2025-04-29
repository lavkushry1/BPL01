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
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }
  
  return size;
}

// Helper function to maintain cache size limits using LRU policy
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const cacheSize = await getCacheSize(cacheName);
  
  if (cacheSize > maxSize) {
    // Sort by last accessed (oldest first)
    const keysWithTimestamps = await Promise.all(
      keys.map(async (request) => {
        const response = await cache.match(request);
        const headers = response.headers;
        const lastAccessed = headers.get('sw-accessed') || 0;
        return { request, lastAccessed: parseInt(lastAccessed, 10) };
      })
    );
    
    keysWithTimestamps.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Delete oldest cached items until we're under the size limit
    let currentSize = cacheSize;
    for (const { request } of keysWithTimestamps) {
      if (currentSize <= maxSize) break;
      
      const response = await cache.match(request);
      const blob = await response.blob();
      await cache.delete(request);
      currentSize -= blob.size;
    }
  }
}

// Helper for network-first strategy with fallback to cache
async function networkFirstWithFallback(request) {
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      
      // Add timestamp header for LRU caching policy
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-accessed', Date.now().toString());
      
      const modifiedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      cache.put(request, modifiedResponse);
      
      // Ensure we don't exceed our cache size limit
      await limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    // Network request failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Update the access timestamp for LRU
      const cache = await caches.open(CACHE_NAME);
      const headers = new Headers(cachedResponse.headers);
      headers.set('sw-accessed', Date.now().toString());
      
      const modifiedResponse = new Response(await cachedResponse.blob(), {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
      
      cache.put(request, modifiedResponse);
      
      return cachedResponse;
    }
    
    // No cached response, show offline page for HTML requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // Otherwise return a basic error
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Fetch event - handle network requests with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
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
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            limitCacheSize(CACHE_NAME, MAX_CACHE_SIZE);
          });
          
          return response;
        });
      })
    );
    return;
  }
  
  // Default: network-first with fallback to cache
  event.respondWith(networkFirstWithFallback(event.request));
}); 