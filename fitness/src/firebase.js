import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// Mevcut asansortakip projesiyle aynı Firebase projesi kullanılıyor.
// Spor verileri ayrı bir kök altında (/fitness) tutulur, böylece karışmaz.
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

// Giriş yap (hesap yoksa otomatik oluştur)
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

// Şifre sıfırlama maili gönder (kullanıcı kendi yeni şifresini belirler)
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Giriş yapmış kullanıcı mevcut şifresini doğrulayıp yeni şifre belirler
export async function changePassword(currentPassword, newPassword) {
  try {
    var user = auth.currentUser;
    if (!user) return { success: false, error: "Oturum yok. Tekrar giriş yap." };
    // Güvenlik için mevcut şifreyle yeniden kimlik doğrula
    var cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (e) {
    if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
      return { success: false, error: "Mevcut şifre yanlış." };
    }
    if (e.code === "auth/weak-password") {
      return { success: false, error: "Yeni şifre çok zayıf (en az 6 hane)." };
    }
    if (e.code === "auth/too-many-requests") {
      return { success: false, error: "Çok fazla deneme. Biraz bekleyip tekrar dene." };
    }
    return { success: false, error: e.message };
  }
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export { auth };

// --- Admin (Cloud Functions) ---
export const ADMIN_EMAIL = "berat_1994ozt@hotmail.com";
export function isAdmin(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL;
}
const fns = getFunctions(app);

export async function adminListUsers() {
  try {
    const r = await httpsCallable(fns, "adminListUsers")();
    return { success: true, users: (r.data && r.data.users) || [] };
  } catch (e) { return { success: false, error: e.message }; }
}
// Cloud Function GEREKTİRMEZ: Kayıtlı kullanıcıları doğrudan Realtime DB'den
// listele. Her kullanıcı girişte /fitness/users/{uid}/info = {email,lastSeen}
// yazıyor. Admin DB kuralıyla tüm /fitness/users ağacını okuyabilir.
export async function dbListUsers() {
  try {
    const token = await getToken();
    let url = FIREBASE_DB_URL + "/fitness/users.json";
    if (token) url += "?auth=" + token + "&shallow=false";
    const res = await fetch(url);
    if (!res.ok) return { success: false, error: "DB " + res.status };
    const data = await res.json();
    if (!data) return { success: true, users: [] };
    const users = Object.keys(data).map((uid) => {
      const info = (data[uid] && data[uid].info) || {};
      const profile = (data[uid] && data[uid].profile) || null;
      const photos = (data[uid] && Array.isArray(data[uid].photos)) ? data[uid].photos : [];
      return {
        uid,
        email: info.email || "",
        lastSignIn: info.lastSeen || "",
        created: "",
        disabled: false,
        profile,
        photos,
      };
    });
    users.sort((a, b) => (b.lastSignIn || 0) - (a.lastSignIn || 0));
    return { success: true, users };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function adminSetPassword(uid, password) {
  try {
    await httpsCallable(fns, "adminSetPassword")({ uid, password });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}
export async function adminSetDisabled(uid, disabled) {
  try {
    await httpsCallable(fns, "adminSetDisabled")({ uid, disabled });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// --- Realtime Database (REST, auth token ile) ---
// Her kullanıcının verisi /fitness/users/{uid}/{key} altında saklanır.
async function userPath(key) {
  var user = auth.currentUser;
  var uid = user ? user.uid : "anon";
  return "/fitness/users/" + uid + "/" + key + ".json";
}

export async function dbGet(key) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + (await userPath(key));
    if (token) url += "?auth=" + token;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    var data = await res.json();
    return (data !== null && data !== undefined) ? data : null;
  } catch (e) { return null; }
}

export async function dbSet(key, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + (await userPath(key));
    if (token) url += "?auth=" + token;
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch (e) {}
}
