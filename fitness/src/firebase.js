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
        // Hesap zaten varsa, demek ki ilk hata yanlış şifredendi
        if (e2.code === "auth/email-already-in-use") {
          return { success: false, error: "Şifre yanlış. (Hesabın varsa şifreni kontrol et veya 'Şifremi unuttum'u kullan.)" };
        }
        if (e2.code === "auth/weak-password") {
          return { success: false, error: "Şifre çok zayıf (en az 6 hane)." };
        }
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

// --- Ortak Akış (Timeline) ---
// Tüm kullanıcılar /fitness/feed altına gönderi (yazı/foto/video) ekleyebilir.
// Kurallar: herkes okur; herkes kendi gönderisini ekler/siler; admin hepsini siler.
export function currentUid() {
  var u = auth.currentUser;
  return u ? u.uid : null;
}

export async function feedList(limit) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed.json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url);
    if (!res.ok) return { success: false, error: "FEED " + res.status };
    var data = await res.json();
    if (!data) return { success: true, posts: [] };
    var posts = Object.keys(data).map(function (id) {
      var p = data[id] || {};
      return { id: id, uid: p.uid || "", email: p.email || "", t: p.t || 0, text: p.text || "", media: p.media || null, avatar: p.avatar || null };
    });
    posts.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
    return { success: true, posts: posts.slice(0, limit || 80) };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function feedPost(post) {
  try {
    var user = auth.currentUser;
    if (!user) return { success: false, error: "Oturum yok." };
    var token = await getToken();
    var id = "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var body = {
      uid: user.uid,
      email: user.email || "",
      t: Date.now(),
      text: post.text || "",
      media: post.media || null,
      avatar: post.avatar || null,
    };
    var url = FIREBASE_DB_URL + "/fitness/feed/" + id + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return { success: false, error: "POST " + res.status };
    return { success: true, post: Object.assign({ id: id }, body) };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function feedDelete(id) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed/" + id + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, { method: "DELETE" });
    if (!res.ok) return { success: false, error: "DEL " + res.status };
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// --- Beğeni & Yorum ---
// Beğeniler: /fitness/feed_likes/{postId}/{uid} = true (herkes okur, kendi beğenisini yazar)
// Yorumlar:  /fitness/feed_comments/{postId}/{commentId} = {uid,email,t,text,avatar}
export async function feedLikesGet() {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed_likes.json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url);
    if (!res.ok) return {};
    var d = await res.json();
    return (d && typeof d === "object") ? d : {};
  } catch (e) { return {}; }
}

export async function feedLikeToggle(postId, like) {
  try {
    var user = auth.currentUser;
    if (!user) return { success: false, error: "Oturum yok." };
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed_likes/" + postId + "/" + user.uid + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, like
      ? { method: "PUT", headers: { "Content-Type": "application/json" }, body: "true" }
      : { method: "DELETE" });
    if (!res.ok) return { success: false, error: "LIKE " + res.status };
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function feedCommentsGet() {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed_comments.json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url);
    if (!res.ok) return {};
    var d = await res.json();
    return (d && typeof d === "object") ? d : {};
  } catch (e) { return {}; }
}

export async function feedCommentAdd(postId, text) {
  try {
    var user = auth.currentUser;
    if (!user) return { success: false, error: "Oturum yok." };
    var token = await getToken();
    var id = "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var avatar = null;
    try { avatar = localStorage.getItem("fitbe_avatar") || null; } catch (e) {}
    var body = { uid: user.uid, email: user.email || "", t: Date.now(), text: String(text), avatar: avatar };
    var url = FIREBASE_DB_URL + "/fitness/feed_comments/" + postId + "/" + id + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return { success: false, error: "COM " + res.status };
    return { success: true, comment: Object.assign({ id: id }, body) };
  } catch (e) { return { success: false, error: e.message }; }
}

export async function feedCommentDelete(postId, commentId) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/feed_comments/" + postId + "/" + commentId + ".json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url, { method: "DELETE" });
    if (!res.ok) return { success: false, error: "CDEL " + res.status };
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// Bir gönderiyi HERKESE AÇIK kopyala (/fitness/public_feed/{id}) — link ile
// giriş yapmadan görüntülenebilir. Sadece gönderi sahibi/admin yazabilir.
export async function feedSharePublic(post) {
  try {
    var token = await getToken();
    if (!token) return { success: false, error: "Oturum yok." };
    var body = {
      uid: post.uid, email: post.email || "", t: post.t || Date.now(),
      text: post.text || "", media: post.media || null, avatar: post.avatar || null,
    };
    var url = FIREBASE_DB_URL + "/fitness/public_feed/" + post.id + ".json?auth=" + token;
    var res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return { success: false, error: "PUB " + res.status };
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
}

// Herkese açık profil resmi: kendi avatarını /fitness/public_avatars/{uid}
// altına yaz (herkes okur). null verilirse silinir.
export async function setPublicAvatar(dataUrl) {
  try {
    var user = auth.currentUser;
    if (!user) return;
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/public_avatars/" + user.uid + ".json";
    if (token) url += "?auth=" + token;
    await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataUrl || null) });
  } catch (e) {}
}

// Tüm herkese açık avatarları getir: { uid: dataURL }
export async function publicAvatarsGet() {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + "/fitness/public_avatars.json";
    if (token) url += "?auth=" + token;
    var res = await fetch(url);
    if (!res.ok) return {};
    var d = await res.json();
    return (d && typeof d === "object") ? d : {};
  } catch (e) { return {}; }
}

// Herkese açık tek gönderiyi getir (GİRİŞ GEREKMEZ — anonim okunur)
export async function publicPostGet(id) {
  try {
    var url = FIREBASE_DB_URL + "/fitness/public_feed/" + encodeURIComponent(id) + ".json";
    var res = await fetch(url);
    if (!res.ok) return null;
    var d = await res.json();
    return d || null;
  } catch (e) { return null; }
}

// --- Realtime Database (REST, auth token ile) ---
// Her kullanıcının verisi /fitness/users/{uid}/{key} altında saklanır.
async function userPath(key) {
  var user = auth.currentUser;
  var uid = user ? user.uid : "anon";
  return "/fitness/users/" + uid + "/" + key + ".json";
}

export async function dbGet(key) {
  var r = await dbGetR(key, 1);
  return r.data;
}

// Sonuç durumlu GET: {ok, data}. ok=false = ağ/izin hatası — "veri yok" ile
// KARIŞTIRILMAMALI (boş düğüm ok:true + data:null döner). Kritik veriler
// (programlar) ok=false iken asla üzerine yazılmamalı, yoksa veri kaybolur.
export async function dbGetR(key, tries) {
  var n = tries || 3;
  for (var a = 0; a < n; a++) {
    try {
      var token = await getToken();
      var url = FIREBASE_DB_URL + (await userPath(key));
      if (token) url += "?auth=" + token;
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 10000);
      var res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        var data = await res.json();
        return { ok: true, data: (data === undefined ? null : data) };
      }
    } catch (e) {}
    if (a < n - 1) await new Promise(function (r) { setTimeout(r, 700 * (a + 1)); });
  }
  return { ok: false, data: null };
}

export async function dbSet(key, value) {
  await dbSetR(key, value);
}

// Sonuç dönen yazma: true = buluta yazıldı, false = başarısız (eşitleme
// bekleyen olarak işaretlenmeli).
export async function dbSetR(key, value) {
  try {
    var token = await getToken();
    var url = FIREBASE_DB_URL + (await userPath(key));
    if (token) url += "?auth=" + token;
    // NOT: keepalive KULLANMA — PUT + JSON, CORS ön-kontrolü (preflight)
    // gerektirir ve tarayıcılar keepalive'lı preflight isteklerini reddeder;
    // internet varken bile tüm yazmalar başarısız görünür. Çıkışta yarım
    // kalan yazma riskini yerel-öncelikli sistem (dirty + sonraki açılışta
    // eşitleme) zaten karşılıyor.
    var res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
    return !!res.ok;
  } catch (e) { return false; }
}
