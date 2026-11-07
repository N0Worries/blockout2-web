// Service worker for the installed (PWA) build of BlockOut II.
//
// Network-first, not cache-first: while this game is still being actively
// developed, a cache-first worker would keep serving a stale build after
// every rebuild. This always prefers a fresh network copy (and refreshes
// the cache with it), only falling back to the cache when there's no
// network at all - which is the one thing this worker exists for: letting
// an installed, already-visited copy still launch offline.
const CACHE_NAME = 'blockout2-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './index.js',
  './index.wasm',
  './index.data',
  './music.ogg',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // e.g. music.ogg missing in a dev build - not fatal
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
