const CACHE_NAME = 'recepcion-fiorentini-v4';

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
   ACTUALIZAR CACHE EN SEGUNDO PLANO
========================================= */

async function actualizarCache(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-cache'
    });

    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);

      await cache.put(
        request,
        response.clone()
      );
    }

  } catch (error) {
    // No bloquea la apertura de la aplicación
  }
}


/* =========================================
   FETCH
========================================= */

self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  const request = event.request;


  /* -----------------------------------------
     NAVEGACIÓN PRINCIPAL
     ABRE INDEX.HTML DIRECTAMENTE DESDE CACHE
  ----------------------------------------- */

  if (request.mode === 'navigate') {

    event.respondWith(
      caches.match('./index.html')
        .then(cached => {

          if (cached) {

            event.waitUntil(
              actualizarCache('./index.html')
            );

            return cached;
          }


          return fetch(request)
            .then(response => {

              const copia = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put('./index.html', copia);
                });

              return response;
            });

        })
    );

    return;
  }


  /* -----------------------------------------
     ARCHIVOS INTERNOS
  ----------------------------------------- */

  event.respondWith(
    caches.match(request)
      .then(cached => {

        if (cached) {

          event.waitUntil(
            actualizarCache(request)
          );

          return cached;
        }


        return fetch(request)
          .then(response => {

            if (response && response.ok) {

              const copia = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, copia);
                });

            }

            return response;
          });

      })
  );

});
