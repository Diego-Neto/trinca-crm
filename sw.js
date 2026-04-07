// ═══════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — Service Worker (PWA)
// Cache-first para assets, network-first para API
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'trinca-v4.2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './logic.js',
  './state.js',
  './ai.js',
  './playbook.js',
  './supabase-sync.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets, network-first para API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls (Supabase, OpenRouter, etc.) — sempre rede
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Assets locais — cache first, fallback para rede
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
