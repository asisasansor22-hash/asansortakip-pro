import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";

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

export async function dbSet(key, value) {
  var p = tenantKeyPath(key);
  if (p === null) return;
  return dbSetRaw(p, value);
}

// ------- Database: raw (tenant-bypass, global yollar için) -----------------
// Örn: users/{uid}, superadmins/{uid}, tenants (liste), tenants/{tid}/config
export async function dbGetRaw(path) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + cleanDbPath(path) + ".json";
    if (token) url += "?auth=" + token;
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 8000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if(!res.ok) return null;
    var data = await res.json();
    return (data !== null && data !== undefined) ? data : null;
  } catch(e) { return null; }
}

export async function dbSetRaw(path, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + cleanDbPath(path) + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    return res.ok;
  } catch(e) { return false; }
}

async function dbPushResolvedPath(path, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + cleanDbPath(path) + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    if (!res.ok) return null;
    var data = await res.json();
    return data && data.name ? data.name : null;
  } catch (e) { return null; }
}

export async function dbPush(key, value) {
  var p = tenantKeyPath(key);
  if (p === null) return null;
  return dbPushResolvedPath(p, value);
}

export async function dbDeleteRaw(path) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + cleanDbPath(path) + ".json";
    if (token) url += "?auth=" + token;
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
  return dbGetRaw("tenants/" + tid + "/public");
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


