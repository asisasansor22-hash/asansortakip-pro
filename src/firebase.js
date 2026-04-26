import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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

// Firebase Auth ile giriş yap (yoksa hesap oluştur)
export async function firebaseLogin(email, password) {
  try {
    var result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (e) {
    if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
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
    currentTenantId = localStorage.getItem("at_tenant_id") || null;
  }
} catch(e) {}

export function setTenantId(tid) {
  currentTenantId = tid || null;
  try {
    if (typeof localStorage !== "undefined") {
      if (tid) localStorage.setItem("at_tenant_id", tid);
      else localStorage.removeItem("at_tenant_id");
    }
  } catch(e) {}
}

export function getTenantId() { return currentTenantId; }

function tenantKeyPath(key) {
  // Eğer key zaten "tenants/" veya "users/" gibi mutlaksa olduğu gibi kullan
  if (key.indexOf("/") >= 0) return key;
  if (!currentTenantId) {
    // Tenant seçilmemişse eski konuma düşme — bilinçli olarak null dönecek
    return null;
  }
  return "tenants/" + currentTenantId + "/" + key;
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
    var url = FIREBASE_DB_URL + "/asansor/" + path + ".json";
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
    var url = FIREBASE_DB_URL + "/asansor/" + path + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch(e) {}
}

export async function dbDeleteRaw(path) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + path + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, { method: "DELETE" });
  } catch(e) {}
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
