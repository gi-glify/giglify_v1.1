const CACHE_NAME = 'giglify-public-v2';
const PUBLIC_FILES = new Set(['/giglify.svg', '/manifest.webmanifest']);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('giglify-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Never intercept navigations, API responses, authorization, or other origins.
  if (request.method !== 'GET' || request.mode === 'navigate' || request.headers.has('authorization') || url.origin !== self.location.origin || url.search) return;
  const asset = url.pathname.startsWith('/assets/') && /\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico)$/.test(url.pathname);
  if (!asset && !PUBLIC_FILES.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = asset ? await cache.match(request) : null;
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic' && !response.headers.get('cache-control')?.includes('no-store')) {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - 100)).map(key => cache.delete(key)));
    }
    return response;
  })());
});
