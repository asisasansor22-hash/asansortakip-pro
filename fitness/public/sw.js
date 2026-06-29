// Fitbe service worker — ONLINE-ONLY.
// Offline cache YOK; sadece PWA kurulabilirliği için gerekli fetch handler'ı sağlar.
// Her istek doğrudan ağdan karşılanır.

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  // Network-only: hiçbir şey cache'lenmez, her zaman ağdan getir.
  event.respondWith(fetch(event.request));
});
