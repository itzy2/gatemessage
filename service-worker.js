const CACHE_NAME = "gate-message-pwa-v1";
const APP_ROOT = "/gatemessage/";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        APP_ROOT,
        APP_ROOT + "index.html",
        APP_ROOT + "manifest.json",
        APP_ROOT + "icon-192.png",
        APP_ROOT + "icon-512.png"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(APP_ROOT)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(APP_ROOT + "index.html", copy)
          );
          return response;
        })
        .catch(async () => {
          return await caches.match(request) ||
            await caches.match(APP_ROOT + "index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }
        return response;
      });

      return cached || network;
    })
  );
});
