const CACHE_NAME = 'rts-plastics-v2';
const STATIC_CACHE = 'rts-static-v2';
const API_CACHE = 'rts-api-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.json'
];

// Install — pre-cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (!validCaches.includes(key)) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

// Fetch — smart caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests (POST/PUT/DELETE handled by offlineApi.js)
    if (request.method !== 'GET') return;

    // API requests — Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(request, API_CACHE));
        return;
    }

    // Navigation requests — return cached index.html for SPA routing
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest index.html
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put('/index.html', clone));
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Static assets (JS, CSS, images, fonts) — Stale-while-revalidate
    if (isStaticAsset(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // Everything else — network first with cache fallback
    event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// ===== CACHING STRATEGIES =====

// Network first, fall back to cache
async function networkFirstWithCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Return offline JSON for API requests
        if (request.url.includes('/api/')) {
            return new Response(
                JSON.stringify({ message: 'Offline - using cached data', offline: true }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return caches.match('/index.html');
    }
}

// Return cache immediately, update cache in background
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => null);

    return cached || fetchPromise;
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)
        || pathname.startsWith('/assets/');
}
