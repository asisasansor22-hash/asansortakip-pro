import { getExercise } from "./exercises";

// Hareket havuzları (tercih sırasına göre; ilk uygun olan seçilir).
const P = {
  chest: ["bench-press", "dumbbell-press", "machine-chest-press", "sinav", "wide-pushup"],
  chestUp: ["incline-press", "incline-dumbbell-press", "decline-pushup"],
  chestIso: ["cable-crossover", "pec-deck", "dumbbell-fly", "diamond-pushup"],
  backVert: ["barfiks", "lat-pulldown", "chin-up", "negative-pullup", "inverted-row"],
  backHoriz: ["barbell-row", "seated-row", "dumbbell-row", "t-bar-row", "inverted-row"],
  backLow: ["deadlift", "romanian-deadlift", "hyperextension", "superman"],
  shPress: ["shoulder-press", "military-press", "arnold-press", "pike-pushup", "handstand-pushup"],
  shLat: ["lateral-raise", "cable-lateral", "upright-row"],
  shRear: ["face-pull", "rear-delt-fly"],
  biceps: ["barbell-curl", "biceps-curl", "hammer-curl", "preacher-curl", "concentration-curl"],
  triceps: ["triceps-pushdown", "skull-crusher", "close-grip-bench", "triceps-dips", "overhead-extension"],
  quad: ["squat", "front-squat", "leg-press", "goblet-squat", "hack-squat", "lunge", "bulgarian", "pistol-squat", "wall-sit"],
  hamGlute: ["romanian-deadlift", "hip-thrust", "leg-curl", "nordic-curl", "glute-bridge", "single-leg-glute-bridge"],
  calf: ["calf-raise", "seated-calf-raise"],
  core: ["plank", "hanging-leg-raise", "hollow-body-hold", "crunch", "leg-raise", "ab-roller"],
};

// Ekipman moduna göre hareket uygun mu?
function accept(equip, mode) {
  const e = String(equip || "");
  if (mode === "full") return true;
  if (mode === "dumbbell") return /dumbbell|vücut|bar|paralel/i.test(e); // ev: dumbbell + vücut + bar
  if (mode === "bodyweight") return /vücut|bar|paralel|i̇p|ip/i.test(e);   // ekipmansız
  return true;
}

// Havuzdan (rot kadar döndürerek) uygun ve kullanılmamış ilk hareketi seç
function pick(poolKey, mode, used, rot) {
  const pool = P[poolKey] || [];
  const arr = pool.slice(rot % (pool.length || 1)).concat(pool.slice(0, rot % (pool.length || 1)));
  for (const id of arr) {
    const ex = getExercise(id);
    if (ex && accept(ex.equip, mode) && !used.has(id)) { used.add(id); return id; }
  }
  // Uygun yoksa moddan bağımsız ilk kullanılmamışı dene (boş gün olmasın)
  for (const id of pool) { if (getExercise(id) && !used.has(id)) { used.add(id); return id; } }
  return null;
}

// Hedefe göre set/tekrar reçetesi
function prescribe(goal, compound) {
  if (goal === "guc") return compound ? { s: 5, r: "5" } : { s: 3, r: "8" };
  if (goal === "kasyap") return compound ? { s: 4, r: "6-10" } : { s: 3, r: "10-12" };
  if (goal === "yagver") return { s: 3, r: "12-15" };
  return { s: 3, r: "10-12" }; // fitkal
}
const REST_NOTE = {
  guc: "Bileşiklerde 3-5 dk dinlen. Her antrenman küçük kilo ekle (lineer ilerleme).",
  kasyap: "Setler arası 1.5-2 dk. Setleri yetmezliğe 1-3 tekrar kala (RIR 1-3) bitir.",
  yagver: "Kısa dinlenme 45-60 sn; tempoyu koru. Yağ kaybını kalori açığı belirler.",
  fitkal: "Setler arası 60-90 sn; form önceliğin olsun.",
};

// Bir günü kur: slots = [[poolKey, compound], ...]
function buildDay(name, slots, goal, mode, rot) {
  const used = new Set();
  const exercises = [], sets = {}, reps = {};
  slots.forEach(([key, compound]) => {
    const id = pick(key, mode, used, rot);
    if (!id) return;
    exercises.push(id);
    const rx = prescribe(goal, compound);
    sets[id] = rx.s; reps[id] = rx.r;
  });
  return { name, note: REST_NOTE[goal] || REST_NOTE.fitkal, exercises, sets, reps };
}

// Split şablonları (slot listeleri)
const PUSH = [["chest", true], ["chestUp", true], ["shPress", true], ["shLat", false], ["triceps", false], ["triceps", false]];
const PULL = [["backVert", true], ["backHoriz", true], ["backLow", true], ["shRear", false], ["biceps", false], ["biceps", false]];
const LEGS = [["quad", true], ["hamGlute", true], ["quad", false], ["hamGlute", false], ["calf", false], ["core", false]];
const UPPER = [["chest", true], ["backHoriz", true], ["shPress", true], ["backVert", true], ["biceps", false], ["triceps", false]];
const LOWER = [["quad", true], ["backLow", true], ["quad", false], ["hamGlute", false], ["calf", false], ["core", false]];
const FULL_A = [["quad", true], ["chest", true], ["backHoriz", true], ["shLat", false], ["core", false]];
const FULL_B = [["backLow", true], ["backVert", true], ["chestUp", true], ["biceps", false], ["triceps", false]];
const FULL_C = [["quad", true], ["shPress", true], ["backHoriz", true], ["hamGlute", false], ["core", false]];

// Ana üretici: {goal, days, equip} → { name, days:[...] }
export function generateProgram({ goal = "kasyap", days = 3, equip = "full" }) {
  const mode = equip;
  let plan = [];
  if (days <= 2) plan = [["Full Body A", FULL_A, 0], ["Full Body B", FULL_B, 0]];
  else if (days === 3) plan = [["Full Body A", FULL_A, 0], ["Full Body B", FULL_B, 0], ["Full Body C", FULL_C, 0]];
  else if (days === 4) plan = [["Üst A", UPPER, 0], ["Alt A", LOWER, 0], ["Üst B", UPPER, 1], ["Alt B", LOWER, 1]];
  else plan = [["Push", PUSH, 0], ["Pull", PULL, 0], ["Legs", LEGS, 0], ["Üst (Ekstra)", UPPER, 1], ["Alt (Ekstra)", LOWER, 1]];

  const goalName = { guc: "Güç", kasyap: "Kütle", yagver: "Yağ Yakım", fitkal: "Form" }[goal] || "Program";
  const built = plan.map(([name, slots, rot]) => buildDay(name, slots, goal, mode, rot));
  return { name: "Sihirbaz · " + goalName + " " + days + " Gün", days: built };
}
