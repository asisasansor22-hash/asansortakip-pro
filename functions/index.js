"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const { optimizeRoute } = require("./routeOptimizer");

admin.initializeApp();

const DB_INSTANCE = "asansortakipv3-default-rtdb";
const DB_REGION = "europe-west1";

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

async function sendBakimPush(evt, tokensPath) {
  if (!evt || evt.tip !== "bakim_tamamlandi") return;

  const tokensSnap = await admin.database().ref(tokensPath).get();
  const tokensVal = tokensSnap.val() || {};
  const entries = Object.entries(tokensVal).filter(
    ([, v]) => v && typeof v.token === "string" && v.token.length > 0
  );
  if (entries.length === 0) return;

  const parcalar = [];
  if (evt.elevAd) parcalar.push(evt.elevAd);
  if (evt.ilce) parcalar.push(evt.ilce);
  const tutar = Number(evt.tutar) || 0;
  const body =
    parcalar.join(" · ") +
    (evt.bakimciAd ? " — " + evt.bakimciAd : "") +
    (tutar > 0 ? " · " + tutar.toLocaleString("tr-TR") + "₺ alındı" : " · ödeme alınmadı");

  const tokens = entries.map(([, v]) => v.token);
  const result = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "✅ Bakım tamamlandı",
      body
    },
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
