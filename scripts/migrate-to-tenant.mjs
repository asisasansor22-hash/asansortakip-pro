// Mevcut Asis verisini /asansor/at_* yollarından /asansor/tenants/asis/at_* altına taşır.
// Ayrıca Asis yöneticisi uid'sini hem /asansor/users/{uid}'ye hem /asansor/superadmins/{uid}'ye yazar.
// public/ yolunu doldurur (login ekranı için).
//
// ÇALIŞTIRMA:
//   1) Firebase Rules'u YAYINLAMADAN önce çalıştır (açık kurallarda çalışmalı).
//   2) node scripts/migrate-to-tenant.mjs <ASIS_YONETICI_UID>
//      UID'yi Firebase Console → Authentication → Users listesinden kopyala.
//      (yonetici@asistakip.app kullanıcısının UID'si)
//   3) Bittikten sonra database.rules.json içeriğini Firebase Console → RTDB → Rules
//      sekmesine yapıştır ve Publish et.
//
// Veri aynalanarak kopyalanır; eski /asansor/at_* yolları silinmez (güvenlik için).
// Migration ve testler onaylandıktan sonra elle silebilirsin.

const DB_URL = "https://asansortakipv3-default-rtdb.europe-west1.firebasedatabase.app";
const TENANT_ID = "asis";

const KEYS = [
  "at_elevs", "at_maints", "at_faults", "at_tasks",
  "at_sozlesme", "at_hesapkayit", "at_haftalik", "at_aylik",
  "at_sonodemeler", "at_giderler", "at_giderhafta", "at_notlar",
  "at_ekstraisler", "at_teklifler", "at_muayeneler", "at_bakimcilar"
];

async function get(path) {
  const r = await fetch(DB_URL + "/asansor/" + path + ".json");
  if (!r.ok) return null;
  return r.json();
}

async function put(path, value) {
  const r = await fetch(DB_URL + "/asansor/" + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value)
  });
  return r.ok;
}

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Kullanım: node scripts/migrate-to-tenant.mjs <ASIS_YONETICI_UID>");
    process.exit(1);
  }

  console.log("[1/5] Asis yöneticisi işaretleniyor — uid:", uid);
  await put("superadmins/" + uid, true);
  await put("users/" + uid, {
    tenantId: TENANT_ID,
    role: "yonetici",
    ad: "Asis Yöneticisi",
    active: true,
    createdAt: new Date().toISOString()
  });

  console.log("[2/5] Tenant config oluşturuluyor");
  const mevcutConfig = await get("tenants/" + TENANT_ID + "/config");
  if (!mevcutConfig) {
    await put("tenants/" + TENANT_ID + "/config", {
      ad: "Asis Asansör",
      yetkili: "",
      tel: "0212 703 20 52",
      email: "berat@asisasansor.com",
      adminEmail: "yonetici@asistakip.app",
      adminUid: uid,
      updatedAt: new Date().toISOString()
    });
  }

  console.log("[3/5] Abonelik kaydı (süresiz aktif)");
  const mevcutSub = await get("tenants/" + TENANT_ID + "/subscription");
  if (!mevcutSub) {
    await put("tenants/" + TENANT_ID + "/subscription", {
      status: "active",
      aylikUcret: 0,
      baslangic: new Date().toISOString().slice(0, 10),
      bitis: "2099-12-31",
      sonOdeme: ""
    });
  }

  console.log("[4/5] Veriler tenant altına kopyalanıyor...");
  let bakimcilarData = null;
  for (const k of KEYS) {
    const data = await get(k);
    if (data === null || data === undefined) {
      console.log("  -", k, "boş, atlandı");
      continue;
    }
    if (k === "at_bakimcilar") bakimcilarData = data;
    const ok = await put("tenants/" + TENANT_ID + "/" + k, data);
    console.log("  -", k, ok ? "✓" : "✗");
  }

  console.log("[5/5] Public yolu oluşturuluyor (login ekranı)...");
  // Bakımcı listesinin şifresiz özetini public'e yaz
  const pubBakimcilar = Array.isArray(bakimcilarData)
    ? bakimcilarData.map(b => ({ id: b.id, ad: b.ad, renk: b.renk || "#3b82f6", hasSifre: !!(b.sifre) }))
    : [];
  const publicOk = await put("tenants/" + TENANT_ID + "/public", {
    ad: "Asis Asansör",
    adminEmail: "yonetici@asistakip.app",
    bakimcilar: pubBakimcilar
  });
  console.log("  - public yolu", publicOk ? "✓" : "✗");

  console.log("\n✅ Migration tamam. Sıradaki adımlar:");
  console.log("   1. database.rules.json içeriğini Firebase Console → RTDB → Rules'a yapıştır ve Publish et");
  console.log("   2. Uygulamayı yeniden derle (firma kodu: asis)");
  console.log("   3. Her şey çalışıyorsa /asansor/at_* eski yollarını Firebase Console'dan sil");
}

main().catch(e => { console.error(e); process.exit(1); });
