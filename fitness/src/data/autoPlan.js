// --- Haftalık gün sayısına göre otomatik program üretici (hacim doğrulamalı) ---
//
// İlkeler (meta-analiz temelli):
//  • Hacim: hipertrofi için kas başına haftada ~10-20 set etkili aralıktır
//    (Schoenfeld/Krieger doz-yanıt analizleri). 10 set "etkili alt sınır"dır;
//    daha azıyla da gelişim olur ama optimuma 10+ ile yaklaşılır.
//  • Sıklık: aynı hacmi haftaya 2+ güne yaymak, tek güne yığmaktan en az o
//    kadar iyidir; bu yüzden bölünmeler kasları haftada 2× çalıştırır.
//  • Bileşik öncelik: çok eklemli hareketler günün başında.
//  • İtiş/çekiş dengesi: omuz sağlığı için pres ve çekiş hacmi denk tutulur.
//
// NOT (cinsiyet): Kadınlar ve erkekler eşit göreli hızda kas geliştirir ve
// kadınlar için hacim hedefi DAHA DÜŞÜK değildir (kadınlar setler/seanslar
// arası genelde daha çabuk toparlanır). Bu yüzden "kadın" seçeneği hacmi
// azaltmaz; yalnızca hangi kasların ÖNE ÇIKACAĞINI (vurgu) değiştirir.

import { getExercise } from "./exercises";
import { tensionOf } from "./tension";

// Kas başına haftalık hedef set aralığı
export const TARGET_MIN = 10;
export const TARGET_MAX = 20;

// Hareket havuzları (tercih sırasına göre)
const POOLS = {
  chest:     { region: "gogus", ids: ["bench-press", "dumbbell-press", "machine-chest-press", "sinav", "wide-pushup"] },
  chestUp:   { region: "gogus", ids: ["incline-press", "incline-dumbbell-press", "decline-pushup"] },
  chestIso:  { region: "gogus", ids: ["cable-crossover", "pec-deck", "dumbbell-fly", "diamond-pushup"] },
  backVert:  { region: "sirt",  ids: ["barfiks", "lat-pulldown", "chin-up", "negative-pullup", "inverted-row"] },
  backHoriz: { region: "sirt",  ids: ["barbell-row", "seated-row", "dumbbell-row", "t-bar-row", "inverted-row"] },
  backLow:   { region: "sirt",  ids: ["deadlift", "romanian-deadlift", "hyperextension", "superman"] },
  shPress:   { region: "omuz",  ids: ["shoulder-press", "military-press", "arnold-press", "pike-pushup"] },
  shLat:     { region: "omuz",  ids: ["lateral-raise", "cable-lateral", "upright-row"] },
  shRear:    { region: "omuz",  ids: ["face-pull", "rear-delt-fly"] },
  biceps:    { region: "kol",   ids: ["barbell-curl", "biceps-curl", "hammer-curl", "preacher-curl", "concentration-curl"] },
  triceps:   { region: "kol",   ids: ["triceps-pushdown", "skull-crusher", "close-grip-bench", "triceps-dips", "overhead-extension"] },
  quad:      { region: "bacak", ids: ["squat", "front-squat", "leg-press", "goblet-squat", "hack-squat", "lunge", "bulgarian", "leg-extension"] },
  hamGlute:  { region: "bacak", ids: ["romanian-deadlift", "hip-thrust", "leg-curl", "glute-bridge", "nordic-curl", "single-leg-glute-bridge"] },
  glute:     { region: "bacak", ids: ["hip-thrust", "glute-bridge", "bulgarian", "single-leg-glute-bridge", "lunge"] },
  calf:      { region: "bacak", ids: ["calf-raise", "seated-calf-raise"] },
  core:      { region: "karin", ids: ["plank", "hanging-leg-raise", "hollow-body-hold", "crunch", "leg-raise", "ab-roller"] },
};

// Bileşik hareketlerin DOLAYLI kattığı hacim (yardımcı kaslar).
// Kanıt: pres hareketleri triceps/ön omuza, çekişler biceps'e anlamlı yük bindirir;
// bu yüzden yardımcı kaslar için doğrudan setin yarısı sayılır (yaygın uygulama).
const INDIRECT = {
  chest:     { omuz: 0.5, kol: 0.5 },
  chestUp:   { omuz: 0.5, kol: 0.5 },
  shPress:   { kol: 0.5 },
  backVert:  { kol: 0.5 },
  backHoriz: { kol: 0.5 },
  backLow:   { bacak: 0.5 },
};

// Ekipman moduna göre uygunluk
function accept(equip, mode) {
  const e = String(equip || "");
  if (mode === "full") return true;
  if (mode === "dumbbell") return /dumbbell|vücut|bar|paralel/i.test(e);
  if (mode === "bodyweight") return /vücut|bar|paralel|i̇p|ip/i.test(e);
  return true;
}

// Havuzdan uygun ve (o gün) kullanılmamış ilk hareketi seç
function pick(poolKey, mode, usedInDay, rot) {
  const pool = POOLS[poolKey];
  if (!pool) return null;
  const ids = pool.ids;
  const off = rot % (ids.length || 1);
  const arr = ids.slice(off).concat(ids.slice(0, off));
  for (const id of arr) {
    const ex = getExercise(id);
    if (ex && accept(ex.equip, mode) && !usedInDay.has(id)) return id;
  }
  for (const id of ids) if (getExercise(id) && !usedInDay.has(id)) return id;
  return null;
}

// Hedefe göre set/tekrar reçetesi
function prescribe(goal, compound) {
  if (goal === "guc") return compound ? { s: 5, r: "5" } : { s: 3, r: "8" };
  if (goal === "kasyap") return compound ? { s: 4, r: "6-10" } : { s: 3, r: "10-12" };
  if (goal === "yagver") return { s: 3, r: "12-15" };
  return { s: 3, r: "10-12" };
}

const REST_NOTE = {
  guc: "Bileşiklerde 3-5 dk dinlen; her hafta küçük kilo ekle (lineer ilerleme).",
  kasyap: "Setler arası 1.5-2 dk. Setleri yetmezliğe 1-3 tekrar kala (RIR 1-3) bitir.",
  yagver: "Dinlenme 45-60 sn; tempoyu koru. Yağ kaybını asıl kalori açığı belirler.",
  fitkal: "Setler arası 60-90 sn; form önceliğin olsun.",
};

// --- Bölünme şablonları: gün sayısına göre ---
// Her gün: [ad, [[havuz, bileşik?], ...], rotasyon]
const D = {
  pushA:  ["İtiş (Push)",  [["chest", 1], ["shPress", 1], ["chestUp", 1], ["shLat", 0], ["triceps", 0]], 0],
  pushB:  ["İtiş (Push) B",[["chestUp", 1], ["shPress", 1], ["chestIso", 0], ["shLat", 0], ["triceps", 0]], 1],
  pullA:  ["Çekiş (Pull)", [["backVert", 1], ["backHoriz", 1], ["backLow", 1], ["shRear", 0], ["biceps", 0]], 0],
  pullB:  ["Çekiş (Pull) B",[["backHoriz", 1], ["backVert", 1], ["shRear", 0], ["biceps", 0], ["biceps", 0]], 1],
  legsA:  ["Bacak (Legs)", [["quad", 1], ["hamGlute", 1], ["quad", 0], ["calf", 0], ["core", 0]], 0],
  legsB:  ["Bacak (Legs) B",[["hamGlute", 1], ["quad", 1], ["glute", 0], ["calf", 0], ["core", 0]], 1],
  upperA: ["Üst A",        [["chest", 1], ["backHoriz", 1], ["shPress", 1], ["backVert", 1], ["biceps", 0], ["triceps", 0]], 0],
  upperB: ["Üst B",        [["chestUp", 1], ["backVert", 1], ["shLat", 0], ["backHoriz", 1], ["triceps", 0], ["biceps", 0]], 1],
  lowerA: ["Alt A",        [["quad", 1], ["hamGlute", 1], ["quad", 0], ["calf", 0], ["core", 0]], 0],
  lowerB: ["Alt B",        [["hamGlute", 1], ["quad", 1], ["glute", 0], ["calf", 0], ["core", 0]], 1],
  fullA:  ["Full Body A",  [["quad", 1], ["chest", 1], ["backHoriz", 1], ["shLat", 0], ["core", 0]], 0],
  fullB:  ["Full Body B",  [["hamGlute", 1], ["backVert", 1], ["chestUp", 1], ["triceps", 0], ["biceps", 0]], 0],
  fullC:  ["Full Body C",  [["quad", 1], ["shPress", 1], ["backHoriz", 1], ["glute", 0], ["core", 0]], 1],
};

const SPLIT_BY_DAYS = {
  2: { name: "Full Body ×2", keys: ["fullA", "fullB"] },
  3: { name: "Full Body ×3", keys: ["fullA", "fullB", "fullC"] },
  4: { name: "Üst / Alt ×2", keys: ["upperA", "lowerA", "upperB", "lowerB"] },
  5: { name: "Push / Pull / Legs + Üst / Alt", keys: ["pushA", "pullA", "legsA", "upperB", "lowerB"] },
  6: { name: "Push / Pull / Legs ×2", keys: ["pushA", "pullA", "legsA", "pushB", "pullB", "legsB"] },
};

// Vurgu (emphasis): hangi bölgeye öncelik verilerek eksik hacim tamamlanacak.
// Bilimsel not: vurgu bir TERCİHTİR, cinsiyet zorunluluğu değildir.
export const EMPHASIS = {
  denge:  { name: "Dengeli", order: ["bacak", "sirt", "gogus", "omuz", "kol", "karin"] },
  altvucut:{ name: "Kalça & Bacak", order: ["bacak", "karin", "sirt", "omuz", "gogus", "kol"] },
  ustvucut:{ name: "Üst Vücut", order: ["sirt", "gogus", "omuz", "kol", "bacak", "karin"] },
};

// Eksik kalan bölgeyi tamamlamak için kullanılacak havuz sırası
const FILL_POOLS = {
  gogus: ["chestIso", "chestUp", "chest"],
  sirt:  ["backHoriz", "backVert", "backLow"],
  omuz:  ["shLat", "shRear", "shPress"],
  kol:   ["biceps", "triceps"],
  bacak: ["glute", "hamGlute", "quad", "calf"],
  karin: ["core"],
};

// Günde en fazla hareket. Az günle çalışanın seansı zorunlu olarak uzundur,
// bu yüzden sınır gün sayısına göre esner.
function maxPerDay(days) { return days <= 2 ? 10 : days === 3 ? 9 : 8; }

// Haftalık hacmi hesapla: bölge → set sayısı (dolaylı katkılar dahil)
function computeVolume(days) {
  const vol = { gogus: 0, sirt: 0, omuz: 0, kol: 0, bacak: 0, karin: 0 };
  days.forEach((d) => {
    d.slots.forEach((s) => {
      const pool = POOLS[s.pool];
      if (!pool) return;
      vol[pool.region] = (vol[pool.region] || 0) + s.sets;
      const ind = INDIRECT[s.pool];
      if (ind) Object.keys(ind).forEach((r) => { vol[r] = (vol[r] || 0) + s.sets * ind[r]; });
    });
  });
  Object.keys(vol).forEach((k) => { vol[k] = Math.round(vol[k] * 10) / 10; });
  return vol;
}

// Ana üretici
// { days, goal, equip, emphasis } → { name, split, days[], volume, gaps[], meets }
export function buildAutoPlan({ days = 3, goal = "kasyap", equip = "full", emphasis = "denge" } = {}) {
  const n = Math.max(2, Math.min(6, Number(days) || 3));
  const split = SPLIT_BY_DAYS[n];
  const mode = equip;

  // 1) Temel bölünmeyi kur
  const built = split.keys.map((k) => {
    const [name, slots, rot] = D[k];
    const usedInDay = new Set();
    const out = { name, rot, slots: [] };
    slots.forEach(([pool, compound]) => {
      const id = pick(pool, mode, usedInDay, rot);
      if (!id) return;
      usedInDay.add(id);
      const rx = prescribe(goal, !!compound);
      out.slots.push({ pool, id, sets: rx.s, reps: rx.r });
    });
    return out;
  });

  // 2) Hacim açığını kapat: hedefin (10 set) altındaki bölgelere,
  //    vurgu sırasına göre, günlere dağıtarak hareket ekle.
  const order = (EMPHASIS[emphasis] || EMPHASIS.denge).order;
  for (let guard = 0; guard < 40; guard++) {
    const vol = computeVolume(built);
    // Hedefin altındaki bölgeler; vurgu sırasına göre en öncelikli olan
    const gap = order.find((r) => vol[r] < TARGET_MIN);
    if (!gap) break;

    // Bu bölgeyi çalıştıran havuzlardan, en az dolu güne bir hareket ekle
    const candidates = FILL_POOLS[gap] || [];
    let placed = false;
    // Günleri hareket sayısına göre sırala (dengeli dağılım)
    const dayOrder = built.map((d, k) => k).sort((a, b) => built[a].slots.length - built[b].slots.length);
    for (const di of dayOrder) {
      const day = built[di];
      if (day.slots.length >= maxPerDay(n)) continue;
      const usedInDay = new Set(day.slots.map((s) => s.id));
      for (const pool of candidates) {
        const id = pick(pool, mode, usedInDay, day.rot);
        if (!id) continue;
        const rx = prescribe(goal, false);
        day.slots.push({ pool, id, sets: rx.s, reps: rx.r });
        placed = true;
        break;
      }
      if (placed) break;
    }
    if (!placed) break; // yer kalmadı — açık raporlanacak
  }

  // 2b) Üst sınır budaması: hacim 20 setin üstüne çıkan bölgelerden İZOLASYON
  //     hareketi çıkar. Gerekçe: doz-yanıt eğrisi 10-20 set aralığından sonra
  //     azalan getiri (hatta ters-U) gösterir; fazla hacim toparlanmayı zorlar.
  //     Bileşikler korunur — onlar birden çok bölgeyi besler.
  const ISOLATION = new Set(["chestIso", "shLat", "shRear", "biceps", "triceps", "calf", "glute", "core"]);
  for (let guard = 0; guard < 30; guard++) {
    const vol = computeVolume(built);
    const over = Object.keys(vol).filter((r) => vol[r] > TARGET_MAX)
      .sort((a, b) => vol[b] - vol[a])[0];
    if (!over) break;

    // O bölgeyi besleyen izolasyon slotlarından, en dolu günden birini çıkar
    let removed = false;
    const dayOrder = built.map((d, k) => k).sort((a, b) => built[b].slots.length - built[a].slots.length);
    for (const di of dayOrder) {
      const day = built[di];
      const idx = day.slots.findIndex((s) => {
        const pool = POOLS[s.pool];
        return pool && pool.region === over && ISOLATION.has(s.pool);
      });
      // Günü tamamen boşaltma; en az 4 hareket kalsın
      if (idx >= 0 && day.slots.length > 4) { day.slots.splice(idx, 1); removed = true; break; }
    }
    if (!removed) break; // yalnız bileşiklerden geliyorsa dokunma
  }

  // 3) Gerilme (uzun boy) garantisi: bir günde çalışılan her bölge için en az
  //    bir "uzun boy" hareketi bulunmalı. Yoksa, o bölgenin hareketlerinden
  //    birini aynı havuzdaki gerilme varyantıyla değiştir.
  //    Gerekçe: kası gerilmiş boyda yükleyen hareketler, kısa boyda zirve
  //    yapanlara göre daha fazla hipertrofi üretir (stretch-mediated hypertrophy).
  built.forEach((day) => {
    const byRegion = {};
    day.slots.forEach((s) => {
      const pool = POOLS[s.pool];
      if (!pool) return;
      (byRegion[pool.region] = byRegion[pool.region] || []).push(s);
    });
    Object.keys(byRegion).forEach((region) => {
      const slots = byRegion[region];
      if (slots.some((s) => { const t = tensionOf(s.id); return t && t.p === "uzun"; })) return;
      // Gerilme varyantı ara: bu bölgenin slotlarından birini değiştir
      const usedInDay = new Set(day.slots.map((s) => s.id));
      for (const s of slots) {
        const ids = (POOLS[s.pool] || {}).ids || [];
        const alt = ids.find((id) => {
          const t = tensionOf(id);
          return t && t.p === "uzun" && !usedInDay.has(id) && accept((getExercise(id) || {}).equip, mode);
        });
        if (alt) { usedInDay.delete(s.id); s.id = alt; usedInDay.add(alt); break; }
      }
    });
  });

  // 4) Programa dönüştür + rapor
  const volume = computeVolume(built);
  const gaps = Object.keys(volume).filter((r) => volume[r] < TARGET_MIN);
  const goalName = { guc: "Güç", kasyap: "Kütle", yagver: "Yağ Yakım", fitkal: "Form" }[goal] || "Program";

  const outDays = built.map((d) => {
    const exercises = [], sets = {}, reps = {};
    d.slots.forEach((s) => { exercises.push(s.id); sets[s.id] = s.sets; reps[s.id] = s.reps; });
    return { name: d.name, note: REST_NOTE[goal] || REST_NOTE.fitkal, exercises, sets, reps };
  });

  return {
    name: "Oto · " + goalName + " " + n + " Gün",
    split: split.name,
    days: outDays,
    volume,
    gaps,
    meets: gaps.length === 0,
  };
}
