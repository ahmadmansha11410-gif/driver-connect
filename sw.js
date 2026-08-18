const CACHE_NAME = 'driver-connect-v3';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './bus.png',
  './admin-bg.jpg',
  './admin-logo.png',
  './admin-bus.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) { return name !== CACHE_NAME; })
                   .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Always go straight to the network for Apps Script API calls - never cache those.
  if (event.request.url.indexOf('script.google.com') !== -1) {
    return;
  }
  // Network-first for the app shell (index.html and page navigations), so a driver always gets
  // the latest update the moment it's published. Falls back to the last cached copy only if
  // there's no internet connection right now.
  var isPageRequest = event.request.mode === 'navigate' || event.request.url.indexOf('index.html') !== -1;
  if (isPageRequest) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }
  // Cache-first for everything else (icons, images, manifest) - these rarely change.
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
