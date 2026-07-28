import { overloadSuggestion, gearOf, minIncrement } from "../src/data/overload.js";
import { exerciseSize } from "../src/data/rest.js";

let fail = 0;
const ok = (n, c, x = "") => { console.log((c ? "  ok  " : "  FAIL") + "  " + n + (c ? "" : "  " + x)); if (!c) fail++; };

// Tek seans kısayolu: setler {weight, reps, rir}
const S = (...sets) => [{ date: Date.now(), sets }];
const set = (weight, reps, rir) => ({ weight, reps: String(reps), rir: rir === undefined ? null : rir });

// --- Hareket büyüklüğü: isCompound boşluğu kapandı mı? ---
ok("squat = large", exerciseSize("squat") === "large", exerciseSize("squat"));
ok("uretilmis bilesik de large", exerciseSize("Barbell_Full_Squat") === "large", exerciseSize("Barbell_Full_Squat"));
ok("yan kaldiris = small", exerciseSize("lateral-raise") === "small", exerciseSize("lateral-raise"));
ok("bilinmeyen id cokmuyor", ["large", "medium", "small"].includes(exerciseSize("yok-boyle-bir-sey")));

// --- Ekipman ---
ok("EZ Bar artik pullbar DEGIL", gearOf("EZ Bar") === "ezbar", gearOf("EZ Bar"));
ok("Bar hala pullbar", gearOf("Bar") === "pullbar", gearOf("Bar"));
ok("Halter = barbell", gearOf("Halter") === "barbell");
ok("Vucut agirligi", gearOf("Vücut ağırlığı") === "bodyweight");
ok("Diger", gearOf("Diğer") === "other");

// --- Adım büyüklüğü ---
ok("kilo yoksa adim 0", minIncrement("sinav", null) === 0);
ok("halter 2.5", minIncrement("bench-press", 100) === 2.5, String(minIncrement("bench-press", 100)));
ok("makine 5", minIncrement("lat-pulldown", 50) === 5, String(minIncrement("lat-pulldown", 50)));
ok("dumbbell 2", minIncrement("lateral-raise", 8) === 2, String(minIncrement("lateral-raise", 8)));

// --- Plandaki elle doğrulama satırları ---
let s;

s = overloadSuggestion("bench-press", "8-12", S(set(100, 12, 2)));
ok("bench 100x12 RIR2 -> 102.5", s.weight === 102.5 && s.tone === "up", JSON.stringify(s));

s = overloadSuggestion("squat", "6-8", S(set(140, 8, 2)));
ok("squat 140x8 -> 145 (clamp)", s.weight === 145, JSON.stringify(s));

// 180 * %2,5 = 4,5 → 2,5'lik kademeye yukarı yuvarlanınca +5 kg.
// Bu, programs.js'te düz metin olarak yazılı "+2,5 kg (deadlift +5 kg)"
// kuralını ÖZEL DURUM YAZMADAN üretiyor: aynı yüzde, daha ağır hareket,
// daha büyük mutlak sıçrama.
s = overloadSuggestion("deadlift", "5", S(set(180, 5, 2)));
ok("deadlift 180x5 -> 185 (bench'ten buyuk sicrama)", s.weight === 185, JSON.stringify(s));

s = overloadSuggestion("lateral-raise", "12-15", S(set(8, 15, 2)));
ok("yan kaldiris 8x15 -> 10 (clamp)", s.weight === 10, JSON.stringify(s));

s = overloadSuggestion("seated-row", "12-15", S(set(45, 15, 2)));
ok("makine 45x15 -> 50", s.weight === 50, JSON.stringify(s));

// --- RIR davranışı ---
s = overloadSuggestion("squat", "6-8", S(set(100, 7, 3)));
ok("RIR3 -> iki kademe (105)", s.weight === 105 && s.tone === "up", JSON.stringify(s));

s = overloadSuggestion("bench-press", "8-12", S(set(100, 9, 1)));
ok("RIR1 + aralik ustunde degil -> SABIT", s.tone === "hold" && s.weight === 100 && s.reps === "9", JSON.stringify(s));

// --- Takılma: üst üste iki seans RIR 0 ---
const stall = [
  { date: 3, sets: [set(100, 5, 0)] },
  { date: 2, sets: [set(100, 5, 0)] },
];
s = overloadSuggestion("bench-press", "5", stall);
ok("iki seans RIR0 -> %10 dusus", s.tone === "down" && s.weight === 90, JSON.stringify(s));

s = overloadSuggestion("bench-press", "5", [{ date: 3, sets: [set(100, 5, 0)] }]);
ok("tek seans RIR0 -> dusurme YOK", s.tone !== "down", JSON.stringify(s));

// --- Vücut ağırlığı ---
s = overloadSuggestion("barfiks", "6-10", S(set(null, 8, 2)));
ok("barfiks -> kg YOK, tekrar+1", s.weight === null && s.reps === "9", JSON.stringify(s));
s = overloadSuggestion("barfiks", "6-10", S(set(null, 10, 2)));
ok("barfiks aralik ustu -> hold", s.weight === null && s.tone === "hold", JSON.stringify(s));

// --- İzometrik ---
s = overloadSuggestion("plank", "30-60 sn", S(set(null, 45, 2)));
ok("plank 45 sn -> 50 sn", s.weight === null && s.reps === "50 sn", JSON.stringify(s));

// --- Kilo girilmemiş "Diğer" hareket: ASLA kg önerisi vermemeli ---
s = overloadSuggestion("Iliotibial_Tract_SMR", "8-12", S(set(null, 10, null)));
ok("agirliksiz 'Diger' -> kg YOK", s === null || s.weight === null, JSON.stringify(s));

// --- Sağlamlık: her dal bir değer döndürmeli, hiç çökmemeli ---
ok("bos seans -> null", overloadSuggestion("squat", "5", []) === null);
ok("bos set dizisi -> null", overloadSuggestion("squat", "5", [{ date: 1, sets: [] }]) === null);
ok("null girdi -> null", overloadSuggestion(null, null, null) === null);
s = overloadSuggestion("squat", "maks", S(set(100, 5, 2)));
ok("ayristirilamayan tekrar cokmuyor", s === null || typeof s === "object", JSON.stringify(s));

// RIR hiç girilmemişse normal ilerleme
s = overloadSuggestion("bench-press", "8-12", S(set(100, 12)));
ok("RIR yoksa normal ilerleme", s.tone === "up" && s.weight === 102.5, JSON.stringify(s));

// Her öneride "why" olmalı (arayüz gerekçe basıyor)
const all = [
  overloadSuggestion("bench-press", "8-12", S(set(100, 12, 2))),
  overloadSuggestion("barfiks", "6-10", S(set(null, 8, 2))),
  overloadSuggestion("plank", "30-60 sn", S(set(null, 45))),
  overloadSuggestion("bench-press", "5", stall),
];
ok("hepsinde gerekce var", all.every((x) => x && typeof x.why === "string" && x.why.length > 10));
ok("hepsinde gecerli tone", all.every((x) => ["up", "hold", "down"].includes(x.tone)));

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
