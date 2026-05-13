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

async function getToken() {
  var user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (e) { return null; }
}

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

// dbGet — ok=true sadece sunucudan geçerli cevap (200) geldiğinde döner.
// Timeout/ağ hatası ok=false; çağıran taraf "veri yok" ile "okuma başarısız"
// durumlarını ayırt edebilsin diye {ok, data} dönüyoruz.
export async function dbGet(key) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/asansor/" + key + ".json";
    if (token) url += "?auth=" + token;
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 12000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if(!res.ok) return { ok:false, data:null, status:res.status };
    var data = await res.json();
    return { ok:true, data: (data !== null && data !== undefined) ? data : null };
  } catch(e) {
    return { ok:false, data:null, error: e && e.message };
  }
}

// dbSet — başarı/başarısızlık döner, başarısız olursa 4 deneme yapar
// (200ms → 600ms → 1800ms → 5400ms exponential backoff).
// onError callback varsa kullanıcıya bildirim göstermek için tetiklenir.
var _dbSetErrorHandler = null;
export function setDbErrorHandler(fn){ _dbSetErrorHandler = fn; }

export async function dbSet(key, value) {
  var attempts = 4;
  var delay = 200;
  var lastError = null;
  for (var i = 0; i < attempts; i++) {
    try {
      var token = await getToken();
      if (!token) {
        lastError = "auth-yok";
      } else {
        var url = FIREBASE_DB_URL + "/asansor/" + key + ".json?auth=" + token;
        var controller = new AbortController();
        var timer = setTimeout(function(){ controller.abort(); }, 15000);
        var res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) return { ok:true };
        lastError = "http-" + res.status;
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          // 4xx (auth/permission) — retry'la düzelmez
          break;
        }
      }
    } catch (e) {
      lastError = (e && e.message) || "fetch-hata";
    }
    if (i < attempts - 1) {
      await new Promise(function(r){ setTimeout(r, delay); });
      delay = delay * 3;
    }
  }
  try { if (_dbSetErrorHandler) _dbSetErrorHandler(key, lastError); } catch(e) {}
  return { ok:false, error: lastError };
}
