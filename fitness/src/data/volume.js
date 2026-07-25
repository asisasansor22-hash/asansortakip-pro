// --- Haftalık kas grubu hacmi (set/kas) hesabı ---
// Hem hazır programlarda hem "Programım"da aynı hesap kullanılır; hareket
// eklenip çıkarıldıkça özet anında güncellenir.
//
// Kural: hipertrofi için kas başına haftada ~10-20 set etkili aralıktır
// (Schoenfeld/Krieger doz-yanıt meta-analizleri). 10 set etkili ALT sınırdır.

import { getExercise, REGIONS } from "./exercises";

export const TARGET_MIN = 10;
export const TARGET_MAX = 20;

// "4 x 8-10" → 4 ; eşleşmezse null
export function parseSetCount(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  return m ? { n: parseInt(m[1], 10), reps: m[2].trim() } : null;
}

// Bir programdaki hareketin set sayısı: programda özel ayar varsa o,
// yoksa hareketin kendi varsayılanı, o da yoksa 3.
export function setsOf(program, exId) {
  if (program && program.sets && program.sets[exId] != null) return Number(program.sets[exId]) || 0;
  const ex = getExercise(exId);
  const p = ex ? parseSetCount(ex.sets) : null;
  return p ? p.n : 3;
}

// Bileşik hareketlerin yardımcı kaslara kattığı DOLAYLI hacim.
// Pres hareketleri triceps/ön omuza, çekişler biceps'e anlamlı yük bindirir;
// yaygın uygulamaya uygun olarak doğrudan setin yarısı sayılır.
const INDIRECT_BY_ID = {
  // göğüs presleri → omuz + kol (triceps)
  "bench-press": { omuz: 0.5, kol: 0.5 },
  "incline-press": { omuz: 0.5, kol: 0.5 },
  "decline-press": { omuz: 0.5, kol: 0.5 },
  "dumbbell-press": { omuz: 0.5, kol: 0.5 },
  "incline-dumbbell-press": { omuz: 0.5, kol: 0.5 },
  "machine-chest-press": { omuz: 0.5, kol: 0.5 },
  "close-grip-bench": { gogus: 0.5, omuz: 0.5 },
  "sinav": { omuz: 0.5, kol: 0.5 },
  "wide-pushup": { omuz: 0.5, kol: 0.5 },
  "diamond-pushup": { omuz: 0.5, kol: 0.5 },
  "decline-pushup": { omuz: 0.5, kol: 0.5 },
  "chest-dips": { omuz: 0.5, kol: 0.5 },
  "triceps-dips": { gogus: 0.5, omuz: 0.5 },
  // omuz presleri → kol (triceps)
  "shoulder-press": { kol: 0.5 },
  "military-press": { kol: 0.5 },
  "arnold-press": { kol: 0.5 },
  "pike-pushup": { kol: 0.5 },
  "handstand-pushup": { kol: 0.5 },
  // çekişler → kol (biceps)
  "barfiks": { kol: 0.5 },
  "chin-up": { kol: 0.5 },
  "negative-pullup": { kol: 0.5 },
  "lat-pulldown": { kol: 0.5 },
  "barbell-row": { kol: 0.5 },
  "seated-row": { kol: 0.5 },
  "dumbbell-row": { kol: 0.5 },
  "t-bar-row": { kol: 0.5 },
  "inverted-row": { kol: 0.5 },
  "face-pull": { kol: 0.25 },
  // menteşe → bacak (arka zincir) / sırt
  "deadlift": { bacak: 0.5 },
  "romanian-deadlift": { sirt: 0.25 },
  "good-morning": { sirt: 0.25 },
  "hyperextension": { bacak: 0.25 },
  // squat türevleri → core
  "squat": { karin: 0.25 },
  "front-squat": { karin: 0.25 },
  "bulgarian": { karin: 0.25 },
  "lunge": { karin: 0.25 },
};

// Bir veya birden çok "gün"ün haftalık hacmini hesapla.
// days: [{exercises:[id], sets:{id:n}}, ...] — tek program da dizi içinde verilebilir.
// Dönüş: { gogus: 12, sirt: 14, ... } (kardiyo hariç, 0.5 hassasiyetle)
export function weeklyVolume(days) {
  const vol = {};
  REGIONS.forEach((r) => { if (r.id !== "kardiyo") vol[r.id] = 0; });

  (days || []).forEach((d) => {
    (d && d.exercises ? d.exercises : []).forEach((exId) => {
      const ex = getExercise(exId);
      if (!ex || ex.region === "kardiyo") return;
      const n = setsOf(d, exId);
      if (!n) return;
      vol[ex.region] = (vol[ex.region] || 0) + n;
      const ind = INDIRECT_BY_ID[exId];
      if (ind) Object.keys(ind).forEach((r) => {
        if (vol[r] !== undefined) vol[r] += n * ind[r];
      });
    });
  });

  Object.keys(vol).forEach((k) => { vol[k] = Math.round(vol[k] * 2) / 2; });
  return vol;
}

// Görüntüleme için satırlar: [{id, name, emoji, sets, level}]
// level: "low" (<10) | "ok" (10-20) | "high" (>20)
export function volumeRows(days) {
  const vol = weeklyVolume(days);
  return REGIONS.filter((r) => r.id !== "kardiyo").map((r) => {
    const sets = vol[r.id] || 0;
    return {
      id: r.id, name: r.name, emoji: r.emoji, sets,
      level: sets === 0 ? "none" : sets < TARGET_MIN ? "low" : sets <= TARGET_MAX ? "ok" : "high",
    };
  });
}
