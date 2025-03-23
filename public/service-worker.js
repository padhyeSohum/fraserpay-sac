
// Cache names
const CACHE_NAME = 'fraser-pay-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first strategy for API requests, cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Skip navigation requests to let the SPA router handle them
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to return cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For API or dynamic requests, use network-first strategy
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') || 
      event.request.method !== 'GET') {
    
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('Fetch failed:', error);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests (static assets), check cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Always try to get a fresh version from the network
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update the cache with the fresh version
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // Fall back to cached version if network fails
          
        // Return the cached response immediately if available, 
        // otherwise wait for the network response
        return cachedResponse || fetchPromise;
      })
  );
});

// Add message event listener to handle cache clearing requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Notify clients that cache has been cleared
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
});
