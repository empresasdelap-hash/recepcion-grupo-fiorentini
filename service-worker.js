const CACHE_NAME = 'recepcion-fiorentini-v1';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache.addAll(ARCHIVOS)
      )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(
              key =>
                key !== CACHE_NAME
            )
            .map(
              key =>
                caches.delete(key)
            )
        )
      )
      .then(() =>
        self.clients.claim()
      )
  );
});

self.addEventListener('fetch', event => {

  event.respondWith(
    fetch(event.request)
      .then(response => {

        const copia =
          response.clone();

        caches
          .open(CACHE_NAME)
          .then(cache =>
            cache.put(
              event.request,
              copia
            )
          );

        return response;

      })
      .catch(() =>
        caches.match(
          event.request
        )
      )
  );

});
