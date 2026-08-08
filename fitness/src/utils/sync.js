// --- Buluta yazma + bağlantı dönünce gönderme ---
//
// push(): her yazmayı önce "bekliyor" işaretler, başarılıysa işareti kaldırır.
// Böylece çevrimdışıyken yapılan değişiklik kaybolmaz — bağlantı gelince
// flushOutbox() onu gönderir.
//
// flushOutbox() ÖNCE BİRLEŞTİRİR, SONRA YAZAR. Çevrimdışı kaldığımız sürede
// başka bir cihaz buluta yazmış olabilir; körlemesine PUT atmak onu ezerdi.
// Yükleme yolu ile gönderim yolu AYNI birleştirme kurallarını kullanır
// (data/merge.js) — tek kural kümesi, iki giriş noktası.

import { dbGetR, dbSetR } from "../firebase";
import { markPending, clearPending, pendingKeys } from "./outbox";
import { mergeHistory, mergePrograms, mergeSchedule, mergeProgress, mergeFavorites, mergeDiary } from "../data/merge";

// navigator.onLine === false → kesinlikle çevrimdışı, denemeye değmez.
// DİKKAT: tersi doğru DEĞİL — onLine true iken de erişilemeyebilir
// (otel/kafe portalı, Firebase kesintisi). Bu yüzden "erişilebilir mi"
// kararı her zaman gerçek okuma/yazma sonucundan gelir.
function surelyOffline() {
  try { return navigator.onLine === false; } catch (e) { return false; }
}

export async function push(key, value) {
  const at = Date.now();
  markPending(key, at);
  if (surelyOffline()) return false;
  const ok = await dbSetR(key, value);
  if (ok) clearPending(key, at);
  return ok;
}

// Anahtar → (yerel, bulut) birleştirici. Burada olmayan anahtar olduğu gibi
// gönderilir (profil, avatar gibi son-yazan-kazanır küçük kayıtlar).
const MERGERS = {
  workouts: (local, cloud) => mergeHistory(local, cloud),
  progress: (local, cloud) => mergeProgress(local, cloud, true),
  favorites: (local, cloud) => mergeFavorites(local, cloud, true),
  schedule: (local, cloud) => mergeSchedule(local, cloud),
  programs: (local, cloud) => mergePrograms(local, cloud),
  diary: (local, cloud) => mergeDiary(local, cloud),
};

let flushing = false;

// getSnapshot: () => { workouts, programs, schedule, progress, favorites, profile, avatar }
// Bekleyen her anahtar için: buluttan oku → birleştir → yaz → işareti kaldır.
export async function flushOutbox(getSnapshot) {
  if (flushing || surelyOffline()) return { sent: 0, failed: 0 };
  const keys = pendingKeys();
  if (!keys.length) return { sent: 0, failed: 0 };
  flushing = true;
  let sent = 0, failed = 0;
  try {
    const snap = getSnapshot() || {};
    for (const key of keys) {
      const local = snap[key];
      if (local === undefined) { continue; } // anlık görüntüde yok → sonraki turda
      const at = Date.now();
      markPending(key, at); // damgayı tazele: bu turun yazması bunu temizleyebilsin
      let value = local;
      const mergeFn = MERGERS[key];
      if (mergeFn) {
        const r = await dbGetR(key, 1);
        if (!r.ok) { failed++; continue; } // okuyamadıysak yazmak tehlikeli
        value = mergeFn(local, r.data);
      }
      const ok = await dbSetR(key, value);
      if (ok) { clearPending(key, at); sent++; } else failed++;
    }
  } finally { flushing = false; }
  return { sent, failed };
}

// Bağlantının döndüğüne dair her sinyalde cb çağrılır.
// Geri dönüş: dinleyicileri kaldıran fonksiyon.
export function onReconnect(cb) {
  const onOnline = () => cb("online");
  const onVis = () => { if (document.visibilityState === "visible" && !surelyOffline()) cb("visible"); };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export { surelyOffline };
