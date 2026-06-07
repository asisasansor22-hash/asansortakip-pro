/* Spendy — Service Worker
   Uygulama kabuğunu önbelleğe alır: hızlı açılır ve internet yokken de çalışır.
   (Veri yedeği buluttadır; bu yalnızca arayüz dosyaları içindir.)               */
const CACHE = 'cuzdan-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './sync.js',
  './manifest.json',
  './icons/favicon-32.png',
  './icons/apple-touch-icon-180.png',
  './icons/pwa-192.png',
  './icons/pwa-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Sadece kendi originimiz: bulut/banka istekleri her zaman ağdan geçsin.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
