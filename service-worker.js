/* Solo archivos estaticos propios. Nunca interceptar ni almacenar APIs,
 * claves, escrituras o respuestas autenticadas. */
const CACHE_NAME = 'recepcion-fiorentini-v6-prueba-20261027';
const CACHE_PREFIX = 'recepcion-fiorentini-';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest'];
const BASE = new URL('./', self.registration.scope);
const ESTATICOS = new Set(ARCHIVOS.concat(['./icon-192.png','./icon-512.png']).map(p=>new URL(p,BASE).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ARCHIVOS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request,url=new URL(request.url);
  // Apps Script, JSONP y toda otra API usan la red del navegador directamente.
  if(request.method!=='GET'||url.origin!==BASE.origin||!ESTATICOS.has(url.pathname))return;
  const ruta=request.mode==='navigate'?new URL('./index.html',BASE).href:request.url;
  event.respondWith(fetch(ruta,{cache:'no-store'}).then(response=>{
    if(response.ok&&response.type==='basic'){
      const copia=response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(ruta,copia)).catch(()=>{}));
    }
    return response;
  }).catch(async()=>{
    const cache=await caches.open(CACHE_NAME),guardada=await cache.match(ruta);
    if(guardada)return guardada;
    throw Error('Sin conexion y sin archivo estatico guardado');
  }));
});
