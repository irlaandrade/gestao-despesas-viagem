// service-worker.js
 
// Define o nome da sua cache
const CACHE_NAME = 'gestao-viagens-app-cache-v1';
 
// Lista de recursos a serem armazenados em cache
const urlsToCache = [
  './',
  './src/index.html',
  './css/style.css',
  './js/script.js',
  './image/icons/travel.png',  // Certifique-se de incluir o ícone na lista se ele for usado na sua PWA
];
 
// Evento de instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
          .catch((error) => {
            console.error('Failed to cache one or more resources:', error);
          });
      })
  );
});
 
 
// Evento de ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
 
// Evento fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});