// Fit+be admin Cloud Functions (Firebase Admin SDK).
// Yalnızca admin e-postası çağırabilir. Şifre ASLA okunmaz/saklanmaz;
// sadece yeni şifre ATANIR. Kullanıcı listesi ve askıya alma da burada.

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

const ADMIN_EMAIL = "berat_1994ozt@hotmail.com";

function assertAdmin(context) {
  const email =
    context.auth && context.auth.token && (context.auth.token.email || "").toLowerCase();
  if (email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError("permission-denied", "Bu işlem için yetkin yok.");
  }
}

// Tüm kayıtlı kullanıcıları listele (e-posta, son giriş, durum)
exports.adminListUsers = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const out = [];
  let pageToken;
  do {
    const res = await admin.auth().listUsers(1000, pageToken);
    res.users.forEach((u) => {
      out.push({
        uid: u.uid,
        email: u.email || "",
        disabled: !!u.disabled,
        lastSignIn: u.metadata.lastSignInTime || "",
        created: u.metadata.creationTime || "",
      });
    });
    pageToken = res.pageToken;
  } while (pageToken);
  return { users: out };
});

// Bir kullanıcıya YENİ şifre ata (eski şifre görülmeden)
exports.adminSetPassword = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const uid = data && data.uid;
  const password = data && data.password;
  if (!uid || !password || String(password).length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "uid ve en az 6 haneli şifre gerekli.");
  }
  await admin.auth().updateUser(uid, { password: String(password) });
  return { success: true };
});

// Hesabı askıya al / aktifleştir
exports.adminSetDisabled = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const uid = data && data.uid;
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "uid gerekli.");
  await admin.auth().updateUser(uid, { disabled: !!(data && data.disabled) });
  return { success: true };
});

// --- Apple Sağlık içe-aktarma (güvenli HTTP köprüsü) ---
// iPhone Kısayolu (Firebase'e giriş YAPAMAZ) buraya POST eder:
//   POST https://<bölge>-<proje>.cloudfunctions.net/appleImport?token=<uid>.<secret>
//   Gövde (JSON): { type, start, durationMin, kcal }  — ya da bunların dizisi.
// Token, kullanıcının /fitness/users/{uid}/importsecret değeriyle SUNUCUDA
// doğrulanır. Geçerliyse veri, ADMIN yetkisiyle yalnız o kullanıcının kendi
// /fitness/users/{uid}/imports_inbox düğümüne yazılır. Böylece herkese açık
// (".write": true) bir düğüme gerek kalmaz — eski /fitness/imports kaldırılabilir.
exports.appleImport = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method === "OPTIONS") { res.set("Access-Control-Allow-Origin", "*").set("Access-Control-Allow-Methods", "POST").set("Access-Control-Allow-Headers", "Content-Type").status(204).end(); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "POST gerekli" }); return; }

    const token = String((req.query && req.query.token) || (req.body && req.body.token) || "");
    const dot = token.indexOf(".");
    if (dot < 1) { res.status(401).json({ error: "gecersiz token" }); return; }
    const uid = token.slice(0, dot);
    const secret = token.slice(dot + 1);
    if (!uid || secret.length < 8) { res.status(401).json({ error: "gecersiz token" }); return; }

    const snap = await admin.database().ref("/fitness/users/" + uid + "/importsecret").once("value");
    const stored = snap.val();
    if (!stored || stored !== secret) { res.status(403).json({ error: "yetki yok" }); return; }

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const items = Array.isArray(body)
      ? body
      : (body && Array.isArray(body.workouts) ? body.workouts : [body]);

    const inbox = admin.database().ref("/fitness/users/" + uid + "/imports_inbox");
    let added = 0;
    for (const it of items) {
      if (!it || typeof it !== "object") continue;
      let start = Number(it.start || it.date || 0) || 0;
      if (!start) continue;
      const rec = {
        type: String(it.type || it.workoutType || "Apple Antrenman").slice(0, 60),
        start: start,
        durationMin: Number(it.durationMin || it.duration || 0) || 0,
        kcal: Number(it.kcal || it.energy || 0) || 0,
        t: Date.now(),
      };
      await inbox.push(rec);
      added++;
    }
    res.status(200).json({ ok: true, added: added });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});
