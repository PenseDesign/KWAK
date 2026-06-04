const CACHE_NAME = 'lepoincitoyen-cache-v2';
const RUNTIME_CACHE = 'lepoincitoyen-runtime-v1';

// Assets to cache during install
const urlsToCache = [
  '/',
  '/icon-512.png',
  '/logo.jpeg',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Cache First for static assets (images, fonts, etc.)
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff|woff2)$/i)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: Network First for API calls and HTML
  if (request.destination === 'document' || 
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Strategy 3: Stale While Revalidate for other requests
  event.respondWith(staleWhileRevalidate(request));
});

// Cache First: Serve from cache, fallback to network
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Cache First failed:', error);
    throw error;
  }
}

// Network First: Try network, fallback to cache
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate: Serve cache, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  
  // Fetch in background and update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}
