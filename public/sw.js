// Kifayat Connect Auto-Updating Service Worker (Zero-Reinstall OTA Updates + Offline Resilience)
const BUILD_STAMP = '__KC_SW_BUILD_ID__';
const CACHE_NAME = `kifayat-connect-ota-${BUILD_STAMP}`;
const STATIC_ASSETS = [
  './manifest.json',
  './kc-emblem.svg',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event && event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.skipWaiting())
        .then(() => self.clients.claim())
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never intercept or cache Firebase, Google APIs, EmailJS, live version manifests, or API routes
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit') ||
    url.origin.includes('googleapis.com') ||
    url.origin.includes('emailjs.com') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.includes('/api/')
  ) {
    return;
  }

  // Always network-first with no-store for HTML navigations so latest UI loads without APK reinstall
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin static assets (JS/CSS/icons/manifest): network-first with no-store for instant OTA updates, cache offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
