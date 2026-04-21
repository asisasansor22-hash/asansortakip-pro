import { initializeApp } from "firebase/app";
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

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export { auth };

// Database - REST API (artık auth token ile)
export async function dbGet(key) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + key + ".json";
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

export async function dbSet(key, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + key + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch(e) {}
}
