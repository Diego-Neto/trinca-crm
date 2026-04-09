// ═══════════════════════════════════════════════════
// TRINCA DA CERTEZA 4.0 — Service Worker (PWA)
// Network-first: sempre busca versão nova, cache como fallback offline
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'trinca-v9.1';
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

// Install: cache assets + força ativação imediata
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpa TODOS os caches antigos + toma controle imediato
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK-FIRST para tudo local, cache só como fallback offline
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls (Supabase, OpenRouter, etc.) — sempre rede
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Assets locais — NETWORK FIRST, cache como fallback offline
  e.respondWith(
    fetch(e.request).then(response => {
      // Atualiza o cache com a versão nova
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return response;
    }).catch(() => {
      // Sem internet: usa cache
      return caches.match(e.request);
    })
  );
});
