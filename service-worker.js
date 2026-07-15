/**
 * Money Tracker - Service Worker
 * Estratégia: cache-first para o app shell (funciona 100% offline depois da 1ª visita)
 * e stale-while-revalidate para as fontes do Google Fonts (evita depender da rede
 * pra renderizar a tipografia quando offline).
 */

const CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `mt-app-shell-${CACHE_VERSION}`;
const FONTS_CACHE = `mt-fonts-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './db.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== APP_SHELL_CACHE && key !== FONTS_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegação (ex: primeira carga, refresh) — cache-first com fallback pro app shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => cached || fetch(request))
    );
    return;
  }

  // Fontes do Google Fonts — stale-while-revalidate: responde do cache na hora se existir,
  // e atualiza o cache em segundo plano quando há rede.
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Assets do próprio app shell (mesma origem) — cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, responseClone));
        return response;
      }))
    );
    return;
  }
});
