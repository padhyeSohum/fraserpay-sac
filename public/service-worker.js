
// Cache names
const CACHE_NAME = 'fraser-pay-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation completed');
      return self.clients.claim();
    })
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
