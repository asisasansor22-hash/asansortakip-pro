"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { optimizeRoute } = require("./routeOptimizer");

admin.initializeApp();

const DB_INSTANCE = "asansortakipv3-default-rtdb";
const DB_REGION = "europe-west1";
const STORAGE_BUCKET = "asansortakipv3.firebasestorage.app";

exports.optimizeRoute = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB"
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    try {
      const result = await optimizeRoute(req.body || {});
      res.status(200).json(result);
    } catch (error) {
      const status = error && error.statusCode ? error.statusCode : 500;
      res.status(status).json({
        error: error && error.code ? error.code : "route-optimization-failed",
        message: error && error.message ? error.message : "Rota optimize edilemedi."
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Bakım bildirimi push'u: bakımcı bir bakımı tamamlayınca at_bakim_bildirimleri
// altına yazılan olay, kayıtlı yönetici cihazlarına FCM web push olarak gider.
// İki tetikleyici: Asis flat path + tenant path (tenants/{tenantId}/...).
// ---------------------------------------------------------------------------

/** tokensPath altındaki tüm kayıtlı cihazlara push gönderir; ölü token'ları temizler. */
async function pushGonder(tokensPath, title, body) {
  const tokensSnap = await admin.database().ref(tokensPath).get();
  const tokensVal = tokensSnap.val() || {};
  const entries = Object.entries(tokensVal).filter(
    ([, v]) => v && typeof v.token === "string" && v.token.length > 0
  );
  if (entries.length === 0) return;

  const tokens = entries.map(([, v]) => v.token);
  const result = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      fcmOptions: { link: "/" },
      headers: { Urgency: "high", TTL: "86400" }
    }
  });

  // Geçersiz token'ları temizle (cihaz değişmiş / izin kaldırılmış)
  const silinecek = [];
  result.responses.forEach((r, i) => {
    if (r.error) {
      const code = r.error.code || "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        silinecek.push(entries[i][0]);
      }
    }
  });
  await Promise.all(
    silinecek.map((uid) => admin.database().ref(tokensPath + "/" + uid).remove())
  );
}

async function sendBakimPush(evt, tokensPath) {
  if (!evt || evt.tip !== "bakim_tamamlandi") return;
  const parcalar = [];
  if (evt.elevAd) parcalar.push(evt.elevAd);
  if (evt.ilce) parcalar.push(evt.ilce);
  const tutar = Number(evt.tutar) || 0;
  const body =
    parcalar.join(" · ") +
    (evt.bakimciAd ? " — " + evt.bakimciAd : "") +
    (tutar > 0 ? " · " + tutar.toLocaleString("tr-TR") + "₺ alındı" : " · ödeme alınmadı");
  await pushGonder(tokensPath, "✅ Bakım tamamlandı", body);
}

exports.bakimPushAsis = onValueCreated(
  {
    ref: "/asansor/at_bakim_bildirimleri/{eventId}",
    instance: DB_INSTANCE,
    region: DB_REGION,
    memory: "256MiB"
  },
  async (event) => {
    await sendBakimPush(event.data.val(), "/asansor/at_push_tokens");
  }
);

exports.bakimPushTenant = onValueCreated(
  {
    ref: "/asansor/tenants/{tenantId}/at_bakim_bildirimleri/{eventId}",
    instance: DB_INSTANCE,
    region: DB_REGION,
    memory: "256MiB"
  },
  async (event) => {
    const tenantId = event.params.tenantId;
    await sendBakimPush(
      event.data.val(),
      "/asansor/tenants/" + tenantId + "/at_push_tokens"
    );
  }
);

// ---------------------------------------------------------------------------
// GÜNLÜK OTOMATİK YEDEK — her gece 03:00 (TR): /asansor'un tamamı Storage'a
// tarihli JSON olarak yazılır; 30 günden eski yedekler silinir.
// Geri dönüş: Storage'daki dosya indirilip ilgili node'a geri yazılır.
// ---------------------------------------------------------------------------
exports.gunlukYedek = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Istanbul",
    region: DB_REGION,
    memory: "1GiB",
    timeoutSeconds: 540
  },
  async () => {
    const snap = await admin.database().ref("/asansor").get();
    const data = snap.val() || {};
    const tarih = new Date().toISOString().slice(0, 10);
    const bucket = admin.storage().bucket(STORAGE_BUCKET);
    await bucket
      .file("yedekler/asansor-" + tarih + ".json")
      .save(JSON.stringify(data), { contentType: "application/json", resumable: false });

    // 30 günden eski yedekleri temizle
    const [files] = await bucket.getFiles({ prefix: "yedekler/" });
    const sinir = Date.now() - 30 * 24 * 3600 * 1000;
    await Promise.all(
      files
        .filter((f) => new Date(f.metadata.timeCreated).getTime() < sinir)
        .map((f) => f.delete().catch(() => {}))
    );

    // Bildirim olayları temizliği: at_bakim_bildirimleri sınırsız büyüyordu ve
    // yönetici cihazları listeyi her 25 sn'de indiriyor. Yedek alındıktan SONRA
    // 7 günden eski olaylar silinir (asis flat + tüm tenantlar).
    const bildirimSinir = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    async function bildirimTemizle(path, obj) {
      if (!obj || typeof obj !== "object") return;
      const silinecekler = {};
      Object.keys(obj).forEach((k) => {
        const ts = obj[k] && obj[k].ts;
        if (!ts || String(ts) < bildirimSinir) silinecekler[k] = null;
      });
      if (Object.keys(silinecekler).length > 0) {
        await admin.database().ref(path).update(silinecekler);
      }
    }
    await bildirimTemizle("/asansor/at_bakim_bildirimleri", data.at_bakim_bildirimleri);
    const tenantlar = data.tenants || {};
    for (const tid of Object.keys(tenantlar)) {
      await bildirimTemizle(
        "/asansor/tenants/" + tid + "/at_bakim_bildirimleri",
        (tenantlar[tid] || {}).at_bakim_bildirimleri
      );
    }

    console.log("Yedek alındı: asansor-" + tarih + ".json (" + JSON.stringify(data).length + " bayt)");
  }
);

// ---------------------------------------------------------------------------
// GÜNLÜK HATIRLATMA PUSH'U — her sabah 09:00 (TR): geciken/yaklaşan muayene,
// biten sözleşme ve 2+ aylık borçlu bina sayısını tek özet bildirimde gönderir.
// ---------------------------------------------------------------------------
function toList(v) {
  return Array.isArray(v) ? v.filter(Boolean) : Object.values(v || {}).filter(Boolean);
}

function hatirlatmaOzeti(veri) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const gun30 = new Date(bugun.getTime() + 30 * 24 * 3600 * 1000);

  const muayeneler = toList(veri.at_muayeneler);
  let gecikenM = 0, yakinM = 0;
  muayeneler.forEach((m) => {
    if (!m || !m.sonrakiTarih) return;
    const d = new Date(m.sonrakiTarih);
    if (isNaN(d.getTime())) return;
    if (d < bugun) gecikenM += 1;
    else if (d <= gun30) yakinM += 1;
  });

  const sozlesmeler = toList(veri.at_sozlesme);
  let bitenS = 0;
  sozlesmeler.forEach((s) => {
    if (!s || !s.bitis) return;
    const d = new Date(s.bitis);
    if (isNaN(d.getTime())) return;
    if (d >= bugun && d <= gun30) bitenS += 1;
  });

  const elevs = toList(veri.at_elevs);
  let borclu = 0;
  elevs.forEach((e) => {
    if (!e) return;
    const bakiye = Number(e.bakiyeDevir) || 0;
    const aylik = Number(e.aylikUcret) || 0;
    if (aylik > 0 && bakiye >= 2 * aylik) borclu += 1;
  });

  const parts = [];
  if (gecikenM) parts.push("🔴 " + gecikenM + " muayene gecikmiş");
  if (yakinM) parts.push("🔍 " + yakinM + " muayene 30 gün içinde");
  if (bitenS) parts.push("📄 " + bitenS + " sözleşme bitiyor");
  if (borclu) parts.push("💰 " + borclu + " binada 2+ aylık borç");
  return parts.join("  ·  ");
}

exports.gunlukHatirlatma = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Europe/Istanbul",
    region: DB_REGION,
    memory: "1GiB",
    timeoutSeconds: 300
  },
  async () => {
    const snap = await admin.database().ref("/asansor").get();
    const kok = snap.val() || {};

    // Asis (flat path)
    const asisOzet = hatirlatmaOzeti(kok);
    if (asisOzet) await pushGonder("/asansor/at_push_tokens", "⏰ Günlük Hatırlatma", asisOzet);

    // Tenant firmalar
    const tenants = kok.tenants || {};
    for (const tid of Object.keys(tenants)) {
      const ozet = hatirlatmaOzeti(tenants[tid] || {});
      if (ozet) {
        await pushGonder("/asansor/tenants/" + tid + "/at_push_tokens", "⏰ Günlük Hatırlatma", ozet);
      }
    }
  }
);

// ---------------------------------------------------------------------------
// BİNA ÖZETİ (self-servis link) — bina yöneticisi, kendisine verilen tokenlı
// linkle salt-okunur özetini görür. Token, yönetici uygulamasından üretilip
// at_bina_links/{token} = {elevId, ...} olarak kaydedilir. Bu endpoint token'ı
// doğrular ve SADECE o binanın sınırlı verisini döner (auth gerektirmez).
// ---------------------------------------------------------------------------
exports.binaOzet = onRequest(
  { region: DB_REGION, cors: true, memory: "256MiB", timeoutSeconds: 30 },
  async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const f = String(req.query.f || "asis").replace(/[^a-z0-9_-]/gi, "");
      const t = String(req.query.t || "");
      if (!/^[A-Za-z0-9_-]{12,64}$/.test(t)) { res.status(400).json({ error: "gecersiz-token" }); return; }
      const base = f === "asis" ? "/asansor" : "/asansor/tenants/" + f;

      const linkSnap = await admin.database().ref(base + "/at_bina_links/" + t).get();
      const link = linkSnap.val();
      if (!link || link.aktif === false) { res.status(404).json({ error: "bulunamadi" }); return; }
      const elevId = Number(link.elevId);

      const [elevsSnap, maintsSnap, odemeSnap, muayeneSnap] = await Promise.all([
        admin.database().ref(base + "/at_elevs").get(),
        admin.database().ref(base + "/at_maints").get(),
        admin.database().ref(base + "/at_sonodemeler").get(),
        admin.database().ref(base + "/at_muayeneler").get()
      ]);
      const elev = toList(elevsSnap.val()).find((e) => e && Number(e.id) === elevId);
      if (!elev) { res.status(404).json({ error: "bina-yok" }); return; }

      const bakimlar = toList(maintsSnap.val())
        .filter((m) => m && Number(m.asansorId) === elevId && m.yapildi)
        .map((m) => ({
          tarih: m.yapildiSaat || m.tarih || "",
          alinan: Number(m.alinanTutar) || 0,
          odendi: !!m.odendi
        }))
        .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))
        .slice(0, 12);

      const odemeler = toList(odemeSnap.val())
        .filter((o) => o && Number(o.aid) === elevId && !o.iptal && (Number(o.alinanTutar) || 0) > 0)
        .map((o) => ({ tarih: o.tarih || "", saat: o.saat || "", tutar: Number(o.alinanTutar) || 0 }))
        .sort((a, b) => String(b.tarih + " " + b.saat).localeCompare(String(a.tarih + " " + a.saat)))
        .slice(0, 12);

      const muayene = toList(muayeneSnap.val())
        .filter((m) => m && Number(m.asansorId) === elevId)
        .sort((a, b) => String(b.tarih || "").localeCompare(String(a.tarih || "")))[0] || null;

      // Firma iletişim bilgisi: müşteri sayfasındaki "Ara / Arıza Bildir" butonları
      // için firmanın TÜM telefonları (tel, tel2, tel3) döner; cep olanlar
      // WhatsApp numarası da taşır.
      function telefonKaydi(raw) {
        let d = String(raw || "").replace(/\D/g, "");
        if (!d) return null;
        if (d.length === 12 && d.indexOf("90") === 0) d = "0" + d.slice(2);
        if (d.length === 10) d = "0" + d;
        if (d.length !== 11 || d[0] !== "0") return null;
        const wa = d[1] === "5" ? "9" + d : "";
        return { tel: d, wa };
      }
      let firmaAd = "";
      let telefonKaynak = [];
      if (f === "asis") {
        firmaAd = "Asis Asansör";
        telefonKaynak = ["0212 703 20 52", "0543 507 07 94", "0536 565 92 23"];
      } else {
        const cfgSnap = await admin.database().ref(base + "/config").get();
        const cfg = cfgSnap.val() || {};
        firmaAd = cfg.ad || "";
        telefonKaynak = [cfg.tel, cfg.tel2, cfg.tel3];
      }
      const gorulen = {};
      const telefonlar = telefonKaynak
        .map(telefonKaydi)
        .filter((t) => t && !gorulen[t.tel] && (gorulen[t.tel] = true));
      const firmaBilgi = { ad: firmaAd, telefonlar };

      res.status(200).json({
        firma: firmaBilgi,
        binaAd: elev.ad || "",
        ilce: elev.ilce || "",
        semt: elev.semt || "",
        bakiye: Number(elev.bakiyeDevir) || 0,
        aylikUcret: Number(elev.aylikUcret) || 0,
        bakimlar,
        odemeler,
        muayene: muayene ? { tarih: muayene.tarih || "", sonraki: muayene.sonrakiTarih || "", sonuc: muayene.sonuc || "" } : null
      });
    } catch (e) {
      res.status(500).json({ error: "sunucu-hatasi" });
    }
  }
);
