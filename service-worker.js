const CACHE_NAME = 'recepcion-fiorentini-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest'
];

/* =========================================
   INSTALACIÓN
========================================= */

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
  );
});


/* =========================================
   ACTIVACIÓN
========================================= */

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});


/* =========================================
   FETCH
   - La app abre desde caché inmediatamente
   - Luego actualiza el caché en segundo plano
========================================= */

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const request = event.request;

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {

        const networkFetch = fetch(request)
          .then(networkResponse => {

            if (
              networkResponse &&
              networkResponse.ok
            ) {
              const copy = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, copy);
                });
            }

            return networkResponse;
          })
          .catch(() => null);


        // Si existe caché, abre inmediatamente
        if (cachedResponse) {

          // Actualiza en segundo plano
          event.waitUntil(networkFetch);

          return cachedResponse;
        }


        // Si no existe caché, usa red
        return networkFetch.then(response => {

          if (response) {
            return response;
          }

          return caches.match('./index.html');
        });

      })
  );
});
