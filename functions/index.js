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
