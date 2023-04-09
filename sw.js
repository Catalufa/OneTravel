const cacheName = 'onetravel-cache';

const filesToCache = [
  '/',
  '/index.html',
  '/script.js?v=0.0.7',
  '/style.css?v=0.0.2',
  'https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap',
  'https://fonts.gstatic.com/s/outfit/v10/QGYvz_MVcBeNP4NJtEtq.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});