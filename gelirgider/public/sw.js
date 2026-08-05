// Servis çalışanı — uygulama kabuğunu önbelleğe alır, böylece çevrimdışı açılır.
// Yer tutucular derleme sırasında vite.config.js tarafından doldurulur.

const KABUK = /*__KABUK__*/[];
const DERLEME = /*__DERLEME__*/"";
const ONBELLEK = "gelirgider-" + DERLEME;

self.addEventListener("install", function (olay) {
  olay.waitUntil(
    caches.open(ONBELLEK).then(function (c) { return c.addAll(KABUK); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (olay) {
  olay.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(adlar.map(function (ad) {
        return ad === ONBELLEK ? null : caches.delete(ad);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (olay) {
  const istek = olay.request;
  if (istek.method !== "GET") return;

  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;

  // Gezinme istekleri: önce ağ, olmazsa önbellekteki kabuk (çevrimdışı açılış).
  if (istek.mode === "navigate") {
    olay.respondWith(
      fetch(istek).catch(function () {
        return caches.match("/index.html").then(function (y) { return y || Response.error(); });
      })
    );
    return;
  }

  // Diğer varlıklar: önbellek varsa oradan, yoksa ağdan alıp sakla.
  olay.respondWith(
    caches.match(istek).then(function (bulunan) {
      if (bulunan) return bulunan;
      return fetch(istek).then(function (yanit) {
        if (yanit && yanit.ok && yanit.type === "basic") {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then(function (c) { c.put(istek, kopya); });
        }
        return yanit;
      });
    })
  );
});
