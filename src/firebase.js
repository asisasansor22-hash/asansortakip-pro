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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FIREBASE_DB_URL = firebaseConfig.databaseURL;

// ── Firma (şirket) scope yönetimi ──
var _currentCompanyId = null;

export function setCurrentCompany(companyId) {
  _currentCompanyId = companyId;
}

export function getCurrentCompany() {
  return _currentCompanyId;
}

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

// ── Database - REST API (firma scope'lu) ──

function dbPath(key) {
  if (_currentCompanyId) {
    return "/sirketler/" + _currentCompanyId + "/" + key;
  }
  // fallback: eski yapı (migration öncesi)
  return "/asansor/" + key;
}

export async function dbGet(key) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + dbPath(key) + ".json";
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
    var url = FIREBASE_DB_URL + dbPath(key) + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch(e) {}
}

// ── Firma listesi (scope dışı — login öncesi) ──

export async function dbGetPublic(path) {
  try {
    var url = FIREBASE_DB_URL + "/" + path + ".json";
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 8000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if(!res.ok) return null;
    var data = await res.json();
    return (data !== null && data !== undefined) ? data : null;
  } catch(e) { return null; }
}

export async function dbSetPublic(path, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/" + path + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch(e) {}
}
