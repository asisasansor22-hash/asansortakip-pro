import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getMessaging, getToken as getFcmToken, isSupported as fcmIsSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAWU95hhLKUKc_bTX5fqlLjDyPtOJ8w5r4",
  authDomain: "asansortakipv3.firebaseapp.com",
  databaseURL: "https://asansortakipv3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "asansortakipv3",
  storageBucket: "asansortakipv3.firebasestorage.app",
  messagingSenderId: "1037552972911",
  appId: "1:1037552972911:web:bd2daac0919f1062d8899a",
  measurementId: "G-Z6GPHV36QW"
};

const ROUTE_OPTIMIZE_PATH = "/api/optimize-route";
const ROUTE_OPTIMIZE_FUNCTION_URL = "https://europe-west1-asansortakipv3.cloudfunctions.net/optimizeRoute";

function isRouteOptimizeRequest(input) {
  var raw = typeof input === "string" ? input : (input && input.url);
  if (!raw) return false;
  if (raw === ROUTE_OPTIMIZE_FUNCTION_URL) return true;
  try {
    var base = typeof window !== "undefined" && window.location ? window.location.origin : "https://asansortakipv3.web.app";
    return new URL(raw, base).pathname === ROUTE_OPTIMIZE_PATH;
  } catch (e) {
    return raw === ROUTE_OPTIMIZE_PATH || raw.indexOf(ROUTE_OPTIMIZE_PATH) >= 0;
  }
}

function validRouteCoord(point) {
  return point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng));
}

function sanitizeRoutePayloadBody(body) {
  if (typeof body !== "string") return body;
  try {
    var payload = JSON.parse(body);
    if (!payload || !Array.isArray(payload.stops)) return body;
    payload.stops = payload.stops
      .filter(validRouteCoord)
      .map(function(stop) {
        return { id: stop.id, lat: Number(stop.lat), lng: Number(stop.lng) };
      });
    if (payload.start && validRouteCoord(payload.start)) {
      payload.start = { lat: Number(payload.start.lat), lng: Number(payload.start.lng) };
    } else {
      payload.start = null;
    }
    return JSON.stringify(payload);
  } catch (e) {
    return body;
  }
}

function installRouteFetchFallback() {
  if (typeof globalThis === "undefined" || typeof globalThis.fetch !== "function") return;
  if (globalThis.__AT_ROUTE_FETCH_PATCHED__) return;
  globalThis.__AT_ROUTE_FETCH_PATCHED__ = true;

  var nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async function(input, init) {
    if (!isRouteOptimizeRequest(input)) return nativeFetch(input, init);

    var safeInit = Object.assign({}, init || {});
    if (safeInit.body !== undefined) safeInit.body = sanitizeRoutePayloadBody(safeInit.body);

    var firstResponse = null;
    try {
      firstResponse = await nativeFetch(input, safeInit);
      if (firstResponse && firstResponse.ok) return firstResponse;
    } catch (e) {}

    var raw = typeof input === "string" ? input : (input && input.url);
    if (raw === ROUTE_OPTIMIZE_FUNCTION_URL) {
      if (firstResponse) return firstResponse;
      return nativeFetch(input, safeInit);
    }

    try {
      var retryResponse = await nativeFetch(ROUTE_OPTIMIZE_FUNCTION_URL, safeInit);
      if (retryResponse && retryResponse.ok) return retryResponse;
      return firstResponse || retryResponse;
    } catch (e2) {
      if (firstResponse) return firstResponse;
      throw e2;
    }
  };
}

installRouteFetchFallback();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FIREBASE_DB_URL = firebaseConfig.databaseURL;
const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const FIREBASE_EMULATOR_DB_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_EMULATOR_DB_URL) ||
  "http://127.0.0.1:9000";
const USE_FIREBASE_EMULATOR_DB = (function () {
  try {
    var host = typeof window !== "undefined" && window.location ? window.location.hostname : "";
    var isLocal = host === "localhost" || host === "127.0.0.1";
    var forced =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || "").toLowerCase() === "1";
    var dev =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      !!import.meta.env.DEV;
    return isLocal && (forced || dev);
  } catch (e) {
    return false;
  }
})();

function buildDbUrl(path, token) {
  var base;
  if (USE_FIREBASE_EMULATOR_DB) {
    base = FIREBASE_EMULATOR_DB_URL + "/asansor/" + cleanDbPath(path) + ".json?ns=" + encodeURIComponent(FIREBASE_PROJECT_ID);
  } else {
    base = FIREBASE_DB_URL + "/asansor/" + cleanDbPath(path) + ".json";
  }
  if (token) base += (base.indexOf("?") >= 0 ? "&" : "?") + "auth=" + encodeURIComponent(token);
  return base;
}

// Auth token'ı al
async function getToken() {
  var user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (e) { return null; }
}

// Firebase Auth ile giriş yap.
// opts.noCreate === true ise yok olan kullanıcı için yeni hesap açmaz.
// Bu, yönetici girişinde profilsiz hayalet UID üretilmesini engeller
// (profil sadece süper-admin tarafından FirmalarPaneli üzerinden yazılabilir).
export async function firebaseLogin(email, password, opts) {
  var allowCreate = !opts || opts.noCreate !== true;
  try {
    var result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (e) {
    if (allowCreate && (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential")) {
      try {
        var result2 = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: result2.user };
      } catch (e2) {
        return { success: false, error: e2.message };
      }
    }
    return { success: false, error: e.message };
  }
}

export async function firebaseLogout() {
  try { await signOut(auth); } catch (e) {}
}

// İkincil Firebase app — süper-admin yeni firma yöneticisi oluştururken
// kullanılır. createUserWithEmailAndPassword ana session'ı yeni kullanıcıya
// geçirdiği için süper-admin oturumu yok olur ve users/{uid} yazma izni
// rules tarafından reddedilirdi. İkincil app ile birincil oturum korunur.
function getSecondaryAuth() {
  var name = "admin-create";
  var app2;
  if (getApps().some(function(a){ return a.name === name; })) {
    app2 = getApp(name);
  } else {
    app2 = initializeApp(firebaseConfig, name);
  }
  return getAuth(app2);
}

// Bir tenant yöneticisi için Firebase Auth hesabı oluşturur veya günceller.
// Süper-admin'in birincil oturumunu bozmaz.
// Dönüş: { success: bool, user: { uid }, error?: string }
export async function createTenantAdmin(email, password) {
  var sec = getSecondaryAuth();
  var uid = null;
  var error = null;
  try {
    var existing = await signInWithEmailAndPassword(sec, email, password);
    uid = existing.user.uid;
  } catch (e) {
    if (e && (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential" || e.code === "auth/wrong-password")) {
      try {
        var created = await createUserWithEmailAndPassword(sec, email, password);
        uid = created.user.uid;
      } catch (e2) {
        error = (e2 && e2.message) || "yonetici hesabi olusturulamadi";
      }
    } else {
      error = (e && e.message) || "yonetici hesabi olusturulamadi";
    }
  }
  // İkincil oturumu kapat ki sızıntı olmasın
  try { await signOut(sec); } catch (_) {}
  if (uid) return { success: true, user: { uid: uid } };
  return { success: false, error: error };
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export { auth };

// ------- Tenant (çoklu firma) ----------------------------------------------
// Her kiracı firma kendi verisini /asansor/tenants/{tenantId}/ altında tutar.
// Asis (süper-admin) için tenantId = "asis".
var currentTenantId = null;
try {
  if (typeof localStorage !== "undefined") {
    currentTenantId = localStorage.getItem("at_tenant_id") || localStorage.getItem("at_active_company") || null;
  }
} catch(e) {}

function cleanDbPath(path) {
  return String(path || "").replace(/^\/+|\/+$/g, "");
}

function isGlobalPath(path) {
  return /^(tenants|users|superadmins)(\/|$)/.test(path);
}

export function setTenantId(tid) {
  currentTenantId = tid || null;
  try {
    if (typeof localStorage !== "undefined") {
      if (tid) {
        localStorage.setItem("at_tenant_id", tid);
        localStorage.setItem("at_active_company", tid);
      } else {
        localStorage.removeItem("at_tenant_id");
        localStorage.removeItem("at_active_company");
      }
    }
  } catch(e) {}
}

export function getTenantId() { return currentTenantId; }

function tenantKeyPath(key) {
  var safeKey = cleanDbPath(key);
  // Global koleksiyonlar (tenants, users, superadmins) tenant wrapper'ı almaz.
  if (isGlobalPath(safeKey)) return safeKey;
  if (!currentTenantId) return null;
  // "asis" süper-admin tenant'ı eski flat path'lerini korur (/asansor/at_elevs vb.).
  if (currentTenantId === "asis") return safeKey;
  return "tenants/" + cleanDbPath(currentTenantId) + "/" + safeKey;
}

// ------- Database: tenant-aware --------------------------------------------
export async function dbGet(key) {
  var p = tenantKeyPath(key);
  if (p === null) return null;
  return dbGetRaw(p);
}

// dbGetWithMeta — App.jsx ana yükleyici için "okuma başarısız" ile
// "veri yok" durumlarını ayırt eder. {ok, data} döner.
// ok=false → fetch/timeout/permission hatası; çağıran taraf yedeğe düşer
// ve dbSet'i bloklayarak boş state ile Firebase'i ezmeyi engeller.
export async function dbGetWithMeta(key) {
  var p = tenantKeyPath(key);
  if (p === null) return { ok: false, data: null, error: "tenant-yok" };
  return dbGetRawWithMeta(p);
}

export async function dbSet(key, value) {
  var p = tenantKeyPath(key);
  if (p === null) return;
  return dbSetRaw(p, value);
}

// ------- Database: raw (tenant-bypass, global yollar için) -----------------
// Örn: users/{uid}, superadmins/{uid}, tenants (liste), tenants/{tid}/config
export async function dbGetRaw(path) {
  var r = await dbGetRawWithMeta(path);
  return r && r.ok ? r.data : null;
}

async function dbGetRawWithMeta(path) {
  try {
    var token = await getToken();
    var url = buildDbUrl(path, token);
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 12000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, data: null, status: res.status };
    var data = await res.json();
    return { ok: true, data: (data !== null && data !== undefined) ? data : null };
  } catch(e) { return { ok: false, data: null, error: (e && e.message) || "fetch-hata" }; }
}

// Yazma hatası global handler'ı — App.jsx kullanıcıya bildirim göstermek
// için kayıt olur. Sessiz veri kaybını engeller.
var _dbSetErrorHandler = null;
export function setDbErrorHandler(fn) { _dbSetErrorHandler = fn; }

export async function dbSetRaw(path, value) {
  var attempts = 4;
  var delay = 200;
  var lastError = null;
  for (var i = 0; i < attempts; i++) {
    try {
      var token = await getToken();
      if (!token) {
        lastError = "auth-yok";
      } else {
        var url = buildDbUrl(path, token);
        var controller = new AbortController();
        var timer = setTimeout(function(){ controller.abort(); }, 15000);
        var res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) return true;
        lastError = "http-" + res.status;
        // 4xx (auth/permission) — retry'la düzelmez
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) break;
      }
    } catch (e) {
      lastError = (e && e.message) || "fetch-hata";
    }
    if (i < attempts - 1) {
      await new Promise(function(r){ setTimeout(r, delay); });
      delay = delay * 3;
    }
  }
  try { if (_dbSetErrorHandler) _dbSetErrorHandler(path, lastError); } catch(e) {}
  return false;
}

async function dbPushResolvedPath(path, value) {
  var attempts = 3;
  var delay = 300;
  for (var i = 0; i < attempts; i++) {
    try {
      var token = await getToken();
      if (token) {
        var url = buildDbUrl(path, token);
        var controller = new AbortController();
        var timer = setTimeout(function(){ controller.abort(); }, 12000);
        var res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          var data = await res.json();
          return data && data.name ? data.name : null;
        }
        // 4xx (izin/auth) — retry'la düzelmez
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) return null;
      }
    } catch (e) {}
    if (i < attempts - 1) {
      await new Promise(function(r){ setTimeout(r, delay); });
      delay = delay * 3;
    }
  }
  return null;
}

export async function dbPush(key, value) {
  var p = tenantKeyPath(key);
  if (p === null) return null;
  return dbPushResolvedPath(p, value);
}

// ------- ETag'li koşullu okuma/yazma (kapama kilidi) ------------------------
// Aylık/haftalık kapama birden fazla cihazda aynı anda tetiklenebilir.
// Firebase REST ETag desteğiyle "oku → değişmediyse yaz" yapılır; yarışı
// kaybeden cihaz 412 alır ve kapamayı tekrarlamaz.
export async function dbGetWithETag(key) {
  var p = tenantKeyPath(key);
  if (p === null) return null;
  try {
    var token = await getToken();
    var url = buildDbUrl(p, token);
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 12000);
    var res = await fetch(url, { headers: { "X-Firebase-ETag": "true" }, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    var etag = res.headers.get("ETag");
    var data = await res.json();
    return { etag: etag || null, data: (data !== undefined) ? data : null };
  } catch(e) { return null; }
}

export async function dbSetIfMatch(key, value, etag) {
  var p = tenantKeyPath(key);
  if (p === null) return false;
  try {
    var token = await getToken();
    var url = buildDbUrl(p, token);
    var headers = { "Content-Type": "application/json" };
    if (etag) headers["if-match"] = etag;
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 15000);
    var res = await fetch(url, { method: "PUT", headers: headers, body: JSON.stringify(value), signal: controller.signal });
    clearTimeout(timer);
    return res.ok; // 412 → başka cihaz önce yazdı
  } catch(e) { return false; }
}

export async function dbDeleteRaw(path) {
  try {
    var token = await getToken();
    var url = buildDbUrl(path, token);
    var res = await fetch(url, { method: "DELETE" });
    return res.ok;
  } catch(e) { return false; }
}

// ------- Payment Events (tek ledger) ---------------------------------------
function localDateStr(d) {
  var dt = d || new Date();
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}
function localTimeStr(d) {
  var dt = d || new Date();
  return String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0");
}
function normalizePaymentEventsList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== "object") return [];
  var out = [];
  for (var k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    var v = raw[k];
    if (!v || typeof v !== "object") continue;
    if (!v.id) v.id = k;
    out.push(v);
  }
  return out;
}

function paymentEventValidationError(input) {
  if (!input || typeof input !== "object") return "geçersiz event";
  var asansorId = Number(input.asansorId);
  if (!Number.isFinite(asansorId)) return "asansorId zorunlu";
  var amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "amount sıfırdan büyük olmalı";
  var t = String(input.eventType || "payment");
  if (["payment", "reversal", "adjustment"].indexOf(t) < 0) return "eventType geçersiz";
  var src = String(input.source || "manuel");
  if (["manuel", "bakimci", "geri_alma", "duzeltme", "migration"].indexOf(src) < 0) return "source geçersiz";
  var st = String(input.status || "posted");
  if (["pending", "posted", "void"].indexOf(st) < 0) return "status geçersiz";
  return null;
}

export async function listPaymentEvents(filters) {
  var all = normalizePaymentEventsList(await dbGet("at_payment_events"));
  var f = filters || {};
  var from = f.fromDate ? new Date(f.fromDate) : null;
  var to = f.toDate ? new Date(f.toDate) : null;
  if (from && !isNaN(from.getTime())) from.setHours(0, 0, 0, 0); else from = null;
  if (to && !isNaN(to.getTime())) to.setHours(23, 59, 59, 999); else to = null;
  return all.filter(function (e) {
    if (f.asansorId != null && Number(e.asansorId) !== Number(f.asansorId)) return false;
    if (f.eventType && String(e.eventType) !== String(f.eventType)) return false;
    if (f.source && String(e.source) !== String(f.source)) return false;
    if (f.status && String(e.status) !== String(f.status)) return false;
    if (from || to) {
      var d = new Date((e.date || "") + "T12:00:00");
      if (isNaN(d.getTime())) d = new Date(e.createdAt || "");
      if (isNaN(d.getTime())) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
    }
    return true;
  }).sort(function (a, b) {
    var ad = new Date(a.createdAt || (a.date || "") + "T" + (a.time || "00:00") + ":00").getTime();
    var bd = new Date(b.createdAt || (b.date || "") + "T" + (b.time || "00:00") + ":00").getTime();
    return (isNaN(ad) ? 0 : ad) - (isNaN(bd) ? 0 : bd);
  });
}

export async function appendPaymentEvent(input) {
  var err = paymentEventValidationError(input);
  if (err) return { success: false, error: err };
  var now = new Date();
  var evt = {
    id: "",
    tenantId: input.tenantId || currentTenantId || "",
    asansorId: Number(input.asansorId),
    maintId: input.maintId != null ? Number(input.maintId) : null,
    date: input.date || localDateStr(now),
    time: input.time || localTimeStr(now),
    amount: Number(input.amount),
    currency: input.currency || "TRY",
    eventType: input.eventType || "payment",
    source: input.source || "manuel",
    status: input.status || "posted",
    collectorName: input.collectorName || "",
    collectorId: input.collectorId || null,
    note: input.note || "",
    relatedEventId: input.relatedEventId || null,
    createdAt: now.toISOString(),
    createdByUid: input.createdByUid || null,
    createdByRole: input.createdByRole || null,
    migrationTag: input.migrationTag || null
  };
  var basePath = tenantKeyPath("at_payment_events");
  if (!basePath) return { success: false, error: "aktif tenant yok" };
  var key = await dbPushResolvedPath(basePath, evt);
  if (!key) return { success: false, error: "event yazılamadı" };
  evt.id = key;
  var ok = await dbSetRaw(basePath + "/" + key, evt);
  if (!ok) return { success: false, error: "event id güncellenemedi" };
  return { success: true, event: evt };
}

export async function appendReversalEvent(originalEvent, reason, meta) {
  if (!originalEvent || typeof originalEvent !== "object") return { success: false, error: "orijinal event yok" };
  var amount = Number(originalEvent.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: "orijinal amount geçersiz" };
  var m = meta || {};
  return appendPaymentEvent({
    tenantId: originalEvent.tenantId || currentTenantId || "",
    asansorId: originalEvent.asansorId,
    maintId: originalEvent.maintId,
    date: m.date || localDateStr(new Date()),
    time: m.time || localTimeStr(new Date()),
    amount: Math.abs(amount),
    currency: originalEvent.currency || "TRY",
    eventType: "reversal",
    source: "geri_alma",
    status: "posted",
    collectorName: m.collectorName || "",
    collectorId: m.collectorId || null,
    note: reason || "Geri alma",
    relatedEventId: originalEvent.id || null,
    createdByUid: m.createdByUid || null,
    createdByRole: m.createdByRole || null
  });
}

// ------- Bakım bildirimleri (uygulama-içi, yöneticiye) ----------------------
// Bakımcı bir bakımı tamamladığında küçük bir olay yazar. Firma yöneticisi
// oturumu açıkken periyodik olarak okur ve yeni olanları toast gösterir.
// (Option A — sadece uygulama açıkken, FCM/service worker yok.)
export async function pushBakimBildirim(payload) {
  var p = payload || {};
  var evt = {
    tip: "bakim_tamamlandi",
    elevAd: p.elevAd || "",
    ilce: p.ilce || "",
    bakimciAd: p.bakimciAd || "",
    tutar: Number(p.tutar) || 0,
    ts: new Date().toISOString()
  };
  return dbPush("at_bakim_bildirimleri", evt);
}

export async function listBakimBildirimleri() {
  var raw = await dbGet("at_bakim_bildirimleri");
  if (!raw) return [];
  var out = [];
  if (Array.isArray(raw)) {
    for (var i = 0; i < raw.length; i++) {
      var a = raw[i];
      if (a && typeof a === "object") { if (!a.id) a.id = String(i); out.push(a); }
    }
  } else if (typeof raw === "object") {
    for (var k in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
      var v = raw[k];
      if (v && typeof v === "object") { if (!v.id) v.id = k; out.push(v); }
    }
  }
  out.sort(function (a, b) { return String(a.ts || "").localeCompare(String(b.ts || "")); });
  return out;
}

// ------- FCM web push (uygulama kapalıyken bildirim) ------------------------
// Firebase Console → Proje Ayarları → Cloud Messaging → Web Push certificates
// bölümünden "Key pair" değerini buraya yapıştırın.
const FCM_VAPID_KEY = "BB67K3liRRkXwqOfseHSbwtduEigcTKS8rXEzSzRVszICVW9Obn7oHy7EQewH-llyvUc5EOmkNHrKwltAEfFBPo";

/** Push bildirim durumu: "hazir-degil" (vapid yok / tarayıcı desteklemiyor),
 *  "granted" | "denied" | "default" (Notification.permission) */
export function pushBildirimDurumu() {
  if (!FCM_VAPID_KEY) return "hazir-degil";
  if (typeof Notification === "undefined" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "hazir-degil";
  return Notification.permission;
}

/** İzin ister, FCM token alır ve at_push_tokens/{uid} altına yazar.
 *  Tenant'larda tenants/{tid}/at_push_tokens, Asis'te flat at_push_tokens. */
export async function enablePushBildirim() {
  try {
    if (pushBildirimDurumu() === "hazir-degil") return { ok: false, reason: "desteklenmiyor" };
    if (!(await fcmIsSupported())) return { ok: false, reason: "desteklenmiyor" };
    var perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "izin-reddedildi" };
    var reg = await navigator.serviceWorker.ready;
    var messaging = getMessaging(app);
    var token = await getFcmToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return { ok: false, reason: "token-alinamadi" };
    var user = auth.currentUser;
    if (!user) return { ok: false, reason: "oturum-yok" };
    var p = tenantKeyPath("at_push_tokens/" + user.uid);
    if (!p) return { ok: false, reason: "tenant-yok" };
    var ok = await dbSetRaw(p, { token: token, email: user.email || "", ts: new Date().toISOString() });
    return ok ? { ok: true } : { ok: false, reason: "kayit-yazilamadi" };
  } catch (e) {
    return { ok: false, reason: (e && e.message) || "hata" };
  }
}

// ------- Kullanıcı / süper-admin profil yardımcıları ------------------------
export async function getUserProfile(uid) {
  if (!uid) return null;
  return dbGetRaw("users/" + uid);
}

export async function setUserProfile(uid, profile) {
  if (!uid) return;
  return dbSetRaw("users/" + uid, profile);
}

export async function isSuperAdmin(uid) {
  if (!uid) return false;
  var v = await dbGetRaw("superadmins/" + uid);
  return v === true;
}

export async function getTenantConfig(tid) {
  if (!tid) return null;
  return dbGetRaw("tenants/" + tid + "/config");
}

export async function saveTenantConfig(tid, fields) {
  if (!tid || !fields) return false;
  var existing = await dbGetRaw("tenants/" + tid + "/config");
  var merged = Object.assign({}, existing || {}, fields, { updatedAt: new Date().toISOString() });
  return dbSetRaw("tenants/" + tid + "/config", merged);
}

export async function getTenantSubscription(tid) {
  if (!tid) return null;
  return dbGetRaw("tenants/" + tid + "/subscription");
}

export async function listTenants() {
  // Süper-admin için tüm tenant özetlerini getir
  var all = await dbGetRaw("tenants");
  if (!all || typeof all !== "object") return [];
  var out = [];
  for (var tid in all) {
    if (!Object.prototype.hasOwnProperty.call(all, tid)) continue;
    var t = all[tid] || {};
    out.push({ id: tid, config: t.config || null, subscription: t.subscription || null });
  }
  return out;
}

// ------- Tenant public (login öncesi okunabilir minimal veri) ---------------
// tenants/{tid}/public → { ad, adminEmail, bakimcilar: [{id,ad,renk,hasSifre}] }
// .read: true olduğu için auth gerektirmez; gizli alan içermez.
export async function getTenantPublic(tid) {
  if (!tid) return null;
  var pub = await dbGetRaw("tenants/" + tid + "/public");
  // Local emulator boşsa en azından "asis" ile giriş yapılabilsin.
  if (!pub && USE_FIREBASE_EMULATOR_DB && tid === "asis") {
    return { ad: "Asis (Emulator)", adminEmail: "yonetici@asistakip.app", plan: "kurumsal", bakimcilar: [] };
  }
  return pub;
}

export async function setTenantPublic(tid, data) {
  if (!tid) return;
  var pub = data || {};
  if (!pub.ad || !pub.adminEmail) {
    var existing = await getTenantPublic(tid);
    if (existing) pub = Object.assign({}, existing, pub);
  }
  var obj = {
    ad: pub.ad || "",
    adminEmail: pub.adminEmail || "",
    bakimcilar: Array.isArray(pub.bakimcilar) ? pub.bakimcilar.map(function(b){
      return {
        id: b.id || "",
        ad: b.ad || "",
        renk: b.renk || "#3b82f6",
        hasSifre: !!b.hasSifre
      };
    }) : []
  };
  if (pub.plan) obj.plan = pub.plan;
  return dbSetRaw("tenants/" + tid + "/public", obj);
}

// ------- Bakımcı e-posta üreteci -------------------------------------------
// Asis için geriye dönük uyumluluk: tenant prefix'siz format korunur.
// Diğer tenantlar: bakimci_{tenantId}_{safe_ad}@asistakip.app
export function makeBakimciEmail(tenantId, ad) {
  var safe = (ad || "genel").toLowerCase()
    .replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g")
    .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ü/g,"u")
    .replace(/[^a-z0-9]/g,"");
  var prefix = (tenantId === "asis") ? "" : (tenantId + "_");
  return "bakimci_" + prefix + safe + "@asistakip.app";
}

// ------- Bakımcı şifre güncelle --------------------------------------------
// Yönetici mevcut bakımcının şifresini değiştirirken çağrılır.
// eskiSifre: mevcut Firebase Auth şifresi (yoksa derived pattern kullanılır)
// bakimci.sifre: yeni şifre
export async function updateBakimciUser(tenantId, bakimci, eskiSifre) {
  if (!tenantId || !bakimci || !bakimci.ad) return { success: false, error: "eksik bilgi" };
  if (!bakimci.sifre) return { success: true }; // şifre kaldırılmış, güncelleme gerekmez
  var sec = getSecondaryAuth();
  var email = makeBakimciEmail(tenantId, bakimci.ad);
  var oldPw = eskiSifre || ("bakimci_" + (bakimci.id || "nosifre"));
  var newPw = bakimci.sifre;
  if (oldPw === newPw) return { success: true }; // değişmemiş
  var uid = null;
  var error = null;
  try {
    var ex = await signInWithEmailAndPassword(sec, email, oldPw);
    await updatePassword(ex.user, newPw);
    uid = ex.user.uid;
  } catch (e) {
    // Eski şifre tutmadı — belki zaten yeni şifreyle kayıtlı
    try {
      var ex2 = await signInWithEmailAndPassword(sec, email, newPw);
      uid = ex2.user.uid;
    } catch (e2) {
      // Hesap yok, oluştur
      try {
        var cr = await createUserWithEmailAndPassword(sec, email, newPw);
        uid = cr.user.uid;
      } catch (e3) {
        error = (e3 && e3.message) || "şifre güncellenemedi";
      }
    }
  }
  try { await signOut(sec); } catch (_) {}
  if (uid) {
    await setUserProfile(uid, { tenantId: tenantId, role: "bakimci", ad: bakimci.ad, active: true });
    return { success: true, uid: uid };
  }
  return { success: false, error: error };
}

// ------- Bakımcı kullanıcı oluştur -----------------------------------------
// Yönetici bakımcı eklerken çağrılır. İkincil auth ile Firebase Auth hesabı
// açar ve users/{uid} profilini yazar. Bakımcı login'de aynı email+şifre
// kullanılır. Mevcut hesap varsa sign-in ile uid alınır.
export async function createBakimciUser(tenantId, bakimci) {
  if (!tenantId || !bakimci || !bakimci.ad) return { success: false, error: "eksik bilgi" };
  var sec = getSecondaryAuth();
  var email = makeBakimciEmail(tenantId, bakimci.ad);
  var password = bakimci.sifre || ("bakimci_" + (bakimci.id || Date.now()));
  var uid = null;
  var error = null;
  try {
    var ex = await signInWithEmailAndPassword(sec, email, password);
    uid = ex.user.uid;
  } catch (e) {
    if (e && (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential" || e.code === "auth/wrong-password")) {
      try {
        var cr = await createUserWithEmailAndPassword(sec, email, password);
        uid = cr.user.uid;
      } catch (e2) {
        error = (e2 && e2.message) || "hesap olusturulamadi";
      }
    } else {
      error = (e && e.message) || "hesap olusturulamadi";
    }
  }
  try { await signOut(sec); } catch (_) {}
  if (uid) {
    await setUserProfile(uid, {
      tenantId: tenantId,
      role: "bakimci",
      ad: bakimci.ad,
      active: true,
      createdAt: new Date().toISOString()
    });
    return { success: true, uid: uid, email: email };
  }
  return { success: false, error: error };
}


