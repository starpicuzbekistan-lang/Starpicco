// STARPIC service worker: caches only the same-origin static app shell.
// This does NOT support editing or authenticating offline.
const CACHE_NAME = 'starpic-shell-v2-20261113';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Never cache Supabase API or auth responses.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
      }
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  if (ASSETS.includes(url.pathname)) event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
