// RA Guppy — Safe E-Commerce Progressive Web App Service Worker
// CAUTION: E-Commerce live inventory, unique specimens, customer orders, and admin controls
// MUST NEVER be aggressively cached to prevent ghost stock or security leaks.

const CACHE_NAME = 'ra-guppy-v2';

// Static, immutable app shell assets safe for caching
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpeg',
  '/favicon.svg',
  '/manifest.webmanifest'
];

// Paths and domains that MUST NEVER be served from cache (strictly network-only)
const EXCLUDED_PATHS = ['/admin', '/checkout', '/account', '/api/'];
const EXCLUDED_DOMAINS = ['supabase.co'];
const EXCLUDED_PATTERNS = [
  /supabase\.co/,
  /@vite/,
  /@fs/,
  /@react-refresh/
];

// Install Event: Precaches core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Safe, intelligent routing
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only intercept GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Strictly bypass Vite development HMR and websocket traffic
  if (url.pathname.includes('__vite') || url.pathname.includes('hot-update') || req.headers.get('Upgrade') === 'websocket') {
    return;
  }

  // 3. Strictly bypass sensitive paths: Admin, Checkout, Account, APIs, and Supabase
  for (const path of EXCLUDED_PATHS) {
    if (url.pathname.startsWith(path)) {
      return; // Fall through to standard direct network request
    }
  }
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(url.pathname) || pattern.test(url.hostname)) {
      return; // Fall through to standard direct network request
    }
  }

  // 4. Static assets (Vite assets, fonts, svg icons): Cache-first with background revalidation
  if (
    url.pathname.startsWith('/assets/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background for eventual consistency
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. HTML Navigation Requests: Network-first to always ensure real-time specimen stock and pricing
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is completely offline, fall back to cached shell
          return caches.match('/') || caches.match('/index.html');
        })
    );
  }
});
