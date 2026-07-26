// --- Dinlenme süresi: hareketin türüne ve hedef tekrara göre otomatik ---
//
// Kanıt (bkz. docs/antrenman-bilimi.md · Bölüm 5):
//  • Bayesyen meta-analiz (Frontiers, 2024): >60 sn dinlenmenin hipertrofiye
//    küçük ama olumlu katkısı var. <60 sn kuvvet/güç çıktılarında dezavantajlı.
//  • 2 dk ile 5 dk arasında fark bulunmayan çalışmalar var → 2 dk çoğu durumda
//    yeterli; daha uzunu seansı gereksiz uzatıyor.
//  • Ağır bileşiklerde toparlanma daha uzun sürer (merkezi yorgunluk + daha
//    fazla kas kütlesi); izolasyonda kısa dinlenme yeterli.
//
// Pratik kural: yeni sete başlarken hâlâ nefes nefese kalmışsan dinlenme kısa;
// tekrar sayın belirgin düşüyorsa (ör. 10 → 6) dinlenmeyi uzat.

// Çok eklemli (bileşik) hareketler — birden fazla eklem ve büyük kas kütlesi
// çalıştığı için daha uzun toparlanma isterler.
const COMPOUND = new Set([
  // göğüs
  "bench-press", "incline-press", "decline-press", "dumbbell-press",
  "incline-dumbbell-press", "machine-chest-press", "close-grip-bench",
  "chest-dips", "triceps-dips", "sinav", "wide-pushup", "decline-pushup",
  "diamond-pushup", "archer-pushup", "pseudo-planche-pushup",
  // sırt
  "deadlift", "romanian-deadlift", "barfiks", "chin-up", "negative-pullup",
  "lat-pulldown", "v-bar-pulldown", "barbell-row", "seated-row", "dumbbell-row",
  "t-bar-row", "inverted-row", "muscle-up", "good-morning",
  // omuz
  "shoulder-press", "military-press", "arnold-press", "pike-pushup",
  "handstand-pushup", "upright-row",
  // bacak
  "squat", "front-squat", "hack-squat", "leg-press", "goblet-squat",
  "lunge", "bulgarian", "pistol-squat", "hip-thrust", "glute-bridge",
  "single-leg-glute-bridge", "nordic-curl",
]);

export function isCompound(exId) { return COMPOUND.has(exId); }

// Hedef tekrar metninden ilk sayıyı al ("6-10" → 6, "5" → 5, "30 sn" → 30)
function firstInt(s) {
  const m = String(s || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Süre bazlı mı? (plank, wall-sit gibi "30-60 sn" yazanlar)
function isHold(reps) { return /sn|saniye|dk|dakika/i.test(String(reps || "")); }

export const REST_MIN = 20;
export const REST_MAX = 300;

// Önerilen dinlenme (saniye) + gerekçe.
// exId: hareket id'si, reps: o hareket için hedef tekrar metni.
export function restFor(exId, reps) {
  const n = firstInt(reps);
  const comp = isCompound(exId);

  if (isHold(reps)) {
    return { sec: 45, label: "İzometrik", why: "Tutuş hareketi — 45-60 sn yeterli." };
  }
  if (comp && n != null && n <= 6) {
    return { sec: 180, why: "Ağır bileşik (≤6 tekrar) — 3 dk. Kuvvette tam toparlanma şart, yoksa yük düşer.", label: "Ağır bileşik" };
  }
  if (comp) {
    return { sec: 120, why: "Bileşik hareket — 2 dk. Hipertrofide 1.5-2 dk yeterli; daha kısası set kalitesini düşürür.", label: "Bileşik" };
  }
  if (n != null && n >= 15) {
    return { sec: 60, why: "Yüksek tekrar izolasyon — 60 sn.", label: "İzolasyon" };
  }
  return { sec: 90, why: "İzolasyon — 60-90 sn. Tek eklem çalıştığı için toparlanma hızlı.", label: "İzolasyon" };
}

export function clampRest(s) {
  return Math.max(REST_MIN, Math.min(REST_MAX, Math.round(s)));
}
