// GYMO service worker — uygulama kabuğu önbelleği.
//
// AMAÇ: Spor salonunun bodrum katında internet yokken uygulama AÇILSIN.
// Program ve geçmiş zaten localStorage'da duruyordu ama uygulamanın kendisi
// yüklenemediği için hiçbirine ulaşılamıyordu.
//
// Aşağıdaki iki yer tutucu, derleme sırasında vite.config.js'teki "pwa-assets"
// eklentisi tarafından gerçek değerlerle DOLDURULUR. `vite dev`'de dolmazlar;
// o durumda SHELL boş kalır ve bu dosya ağ-öncelikli (eski) davranışa döner.
var SHELL = /*__SHELL__*/[];
var BUILD = /*__BUILD_ID__*/"";

var SHELL_CACHE = "gymo-shell-" + BUILD;
var RT_CACHE = "gymo-rt-" + BUILD;
var NAV_TIMEOUT = 3000;

// Hareket fotoğrafları (jsDelivr / free-exercise-db). Kabuk önbelleğinden AYRI
// ve BUILD'e bağlı DEĞİL: fotoğraflar sürümle değişmez, her güncellemede
// yeniden indirmek anlamsız olurdu.
//
// Neden önbelleğe alıyoruz: salonda aynı hareketleri her hafta yapıyorsun.
// Bu dosyalar içerik-adresli (klasör adı + 0.jpg/1.jpg) ve asla değişmez.
// Önbellek olmadan zayıf bağlantıda fotoğraflar tek tek düşüyor ve antrenman
// boyunca yedek çizime bakıyorsun.
var IMG_CACHE = "gymo-img";
var IMG_HOST = "cdn.jsdelivr.net";
var IMG_MAX = 400;   // ~400 fotoğraf; hepsi küçük JPEG

self.addEventListener("install", function (event) {
  // skipWaiting BİLEREK KOŞULSUZ ÇAĞRILMIYOR. Önbellekli kurulumda yeni bir
  // service worker oturum ortasında devralırsa, sayfada çalışan JS ile
  // uyuşmayan hash'li varlıklar sunmaya başlayabilir. Devralma yalnızca sayfa
  // açıkça istediğinde olur (aşağıdaki SKIP_WAITING mesajı).
  // İlk kurulumda bekleyecek bir şey olmadığı için zaten hemen etkinleşir.
  if (!SHELL.length) return;
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      // addAll ATOMİKTİR: eksik tek bir ikon kurulumu bozar ve uygulama hiç
      // service worker alamaz. Tek tek ekleyip hataları yutuyoruz.
      return Promise.all(SHELL.map(function (u) {
        return cache.add(u).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Eski sürümlerin önbellekleri burada temizlenir. Eskiden bu işi sayfa
      // yapıyordu (hardReload TÜM önbellekleri siliyordu) ve her güncellemede
      // çevrimdışı yeteneği sıfırlanıyordu.
      return Promise.all(keys.map(function (k) {
        if (k.indexOf("gymo-") !== 0) return null;
        // IMG_CACHE bilerek korunur: BUILD'e bağlı değil, fotoğraflar
        // sürümle değişmiyor. Silinirse her güncelleme çevrimdışı
        // fotoğrafları sıfırlardı.
        if (k === SHELL_CACHE || k === RT_CACHE || k === IMG_CACHE) return null;
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Sayfa (App.jsx > hardReload) yeni sürüme geçmeye hazır olduğunda çağırır.
self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ignoreVary ŞART. Sunucu hash'li varlıklara "Vary: Origin" gönderiyor
// (Cloudflare ve vite preview ikisi de). index.html'deki script/link etiketleri
// `crossorigin` taşıdığı için gerçek istek Origin başlığı gönderir; kurulumda
// cache.add() ile saklanan istekte ise Origin yoktur. Vary dikkate alınırsa bu
// ikisi EŞLEŞMEZ, önbellek ıskalanır ve çevrimdışında fetch'e düşüp patlar —
// yani kabuk önbelleği dolu olduğu hâlde uygulama açılmaz.
// İçerik hash'li dosyalarda Vary zaten anlamsız: aynı URL tek bir içeriktir.
function cacheMatch(req) {
  return caches.match(req, { ignoreVary: true });
}

// Fotoğraf: önce önbellek, yoksa ağ + sakla. Ağ patlarsa hatayı YUTMA —
// isteği reddet ki <img onError> tetiklensin ve bileşen SVG'ye düşsün.
//
// <img> istekleri no-cors olduğu için yanıt "opaque" gelir: status 0'dır ve
// res.ok false'tur. Bu yüzden ok yerine tipe de bakıyoruz — aksi halde hiçbir
// fotoğraf saklanmazdı.
function photo(req) {
  return caches.open(IMG_CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          c.put(req, res.clone()).then(function () { trimPhotos(c); }).catch(function () {});
        }
        return res;
      });
    });
  });
}

// Basit FIFO budama: sınır aşılırsa en eski girdiler silinir. keys() ekleme
// sırasını korur. Sayaç tutmak yerine bunu kullanıyoruz — service worker
// yeniden başlayınca sayaç sıfırlanır, önbellek sıfırlanmaz.
function trimPhotos(c) {
  return c.keys().then(function (ks) {
    if (ks.length <= IMG_MAX) return null;
    return Promise.all(ks.slice(0, ks.length - IMG_MAX).map(function (k) { return c.delete(k); }));
  }).catch(function () {});
}

function fromCache(req) {
  return cacheMatch(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(RT_CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;

  // --- Erken çıkışlar: respondWith ÇAĞIRMA, tarayıcı kendi işini görsün ---
  if (req.method !== "GET") return;              // Firebase PUT'larına asla dokunma

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // --- Hareket fotoğrafları: ÖNBELLEK ÖNCELİKLİ, sınırlı ---
  // Farklı kaynaklara dokunmama kuralının TEK istisnası: bu dosyalar asla
  // değişmez ve çevrimdışı değeri yüksek. Ağ hatası bilerek yutulmuyor —
  // istek reddedilir, <img onError> tetiklenir, bileşen yedek çizime düşer.
  if (url.hostname === IMG_HOST && /\/exercises\//.test(url.pathname)) {
    event.respondWith(photo(req));
    return;
  }

  // Diğer farklı kaynaklar (Firebase, OpenFoodFacts, Spotify): dokunmuyoruz.
  // Eskiden hepsi sarmalanıyordu ama sıfır fayda sağlıyor, buna karşılık ağ
  // hatasında yedeksiz bir reddetmeye dönüşüyordu.
  if (url.origin !== self.location.origin) return;

  // Güncelleme sinyali: asla önbelleğe alınmaz, asla yedeklenmez.
  // App.jsx'teki kontrolün kendi catch'i hatayı zaten karşılıyor.
  if (url.pathname === "/version.json") return;

  if (!SHELL.length) return; // geliştirme modu: ağ-öncelikli davran

  // --- Gezinme: AĞ ÖNCELİKLİ (yarışlı), yedek olarak önbellekteki index ---
  // index.html varlık hash'lerini taşır; bayat bir index tam olarak
  // güncellemeyi bozan şeydir. O yüzden ağ varken ağ kazanmalı. Yarış, ölü
  // yavaş bir bağlantının açılışı kilitlemesini engeller.
  if (req.mode === "navigate") {
    event.respondWith(
      Promise.race([
        fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put("/index.html", copy); });
          }
          return res;
        }),
        new Promise(function (resolve) {
          setTimeout(function () { resolve(cacheMatch("/index.html")); }, NAV_TIMEOUT);
        }),
      ]).then(function (res) {
        return res || cacheMatch("/index.html");
      }).catch(function () {
        return cacheMatch("/index.html");
      })
    );
    return;
  }

  // --- Hash'li varlıklar: ÖNBELLEK ÖNCELİKLİ, tazeleme yok ---
  // İçerik hash'li oldukları için değişmezler; aynı URL asla farklı içerik
  // döndürmez. Barkod tarayıcının tembel yığınları da böylece ilk
  // kullanımdan sonra çevrimdışı çalışır.
  if (url.pathname.indexOf("/assets/") === 0) {
    event.respondWith(fromCache(req));
    return;
  }

  // --- İkonlar ve manifest ---
  if (url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/apple-touch-icon.png" ||
      /^\/pwa-\d+\.png$/.test(url.pathname)) {
    event.respondWith(fromCache(req));
    return;
  }

  // Geri kalan aynı kaynaklı istekler: dokunma.
});
