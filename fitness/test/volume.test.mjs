// Hacim hesabı ve doğrudan set alt sınırı.
//
// Bu dosyanın varlık sebebi: hazır bir programın Salı günü "Kol 4 set" gösteriyordu
// ama o günde hiç kol hareketi yoktu. Sayı yanlış değildi (dolaylı katkı bilimsel
// olarak yarım set sayılır) ama ekran bunu söylemiyordu ve bir bölge SIFIR doğrudan
// çalışmayla "ideal" (yeşil) görünebiliyordu.

import { volumeRows, weeklyVolume, minFor, maxFor, directMinFor } from "../src/data/volume.js";
import { READY_PROGRAMS, getReadyProgram } from "../src/data/programs.js";
import { buildAutoPlan } from "../src/data/autoPlan.js";

let fail = 0;
const ok = (n, c, x = "") => { console.log((c ? "  ok  " : "  FAIL") + "  " + n + (c ? "" : "  " + x)); if (!c) fail++; };

// --- Yapısal ---

let bad = [];
READY_PROGRAMS.forEach((p) => {
  volumeRows(p.days).forEach((r) => {
    if (r.sets !== r.direct + r.indirect) bad.push(p.id + "/" + r.id + " " + r.sets + " != " + r.direct + "+" + r.indirect);
  });
});
ok("sets === direct + indirect (tum programlar)", bad.length === 0, bad.slice(0, 3).join(" | "));

bad = [];
READY_PROGRAMS.forEach((p) => {
  volumeRows(p.days).forEach((r) => {
    if (r.level === "thin" && r.sets < r.min) bad.push(p.id + "/" + r.id);
  });
});
// "thin" mutlaka "low"dan SONRA degerlendirilmeli: yalnizca aksi halde ok/high
// gorunecek bir satiri dusurebilir, zaten esik altindakilere gurultu yapmamali.
ok("thin ⟹ sets >= min", bad.length === 0, bad.join(" | "));

// --- Kendi bolgesine kredi verme hatasi ---
// romanian-deadlift'in region'i "sirt" ve dolayli tabloda da { sirt: 0.25 } vardi:
// once 3 dogrudan, sonra 0.75 dolayli eklenip 3.75 sirt seti sayiliyordu.
const rdl = weeklyVolume([{ exercises: ["romanian-deadlift"], sets: { "romanian-deadlift": 3 } }]);
ok("kendi bolgesine cift sayim yok (sirt=3)", rdl.total.sirt === 3, "sirt=" + rdl.total.sirt);
ok("RDL katkisi bacaga yaziliyor", rdl.indirect.bacak === 1.5, "bacak dolayli=" + rdl.indirect.bacak);

// --- 0.25 katmani korunuyor ---
const fp = weeklyVolume([{ exercises: ["face-pull"], sets: { "face-pull": 4 } }]);
ok("face-pull 4 set -> kol 1 dolayli", fp.indirect.kol === 1, "kol dolayli=" + fp.indirect.kol);

// --- Bildirilen hata: fullbody-beginner ---
const fb = volumeRows(getReadyProgram("fullbody-beginner").days).find((r) => r.id === "kol");
ok("fullbody-beginner kol: dogrudan set var",
   fb.direct >= directMinFor("kol"), "dogrudan=" + fb.direct + " gereken=" + directMinFor("kol"));
ok("fullbody-beginner kol: artik 'thin' degil", fb.level !== "thin", "level=" + fb.level);

// --- Sinif korumasi: hicbir program sifir dogrudan ile "ideal" gorunmesin ---
bad = [];
READY_PROGRAMS.forEach((p) => {
  volumeRows(p.days).forEach((r) => {
    if (r.level === "ok" && r.direct === 0) bad.push(p.id + "/" + r.id + " (" + r.sets + " set)");
  });
});
ok("sifir dogrudan + 'ideal' kombinasyonu yok", bad.length === 0, bad.join(" | "));

// --- Tek gun gorunumu ---
// Tek gun toplam esige ulasmadigi icin "thin" tetiklenmemeli (gurultu olurdu),
// ama kirilim yine de dogru raporlanmali — kullanicinin ihtiyaci tam orada.
const day1 = volumeRows([getReadyProgram("fullbody-beginner").days[1]]);
ok("tek gunde 'thin' yok", day1.every((r) => r.level !== "thin"),
   JSON.stringify(day1.filter((r) => r.level === "thin").map((r) => r.id)));

// --- Icerik disiplini: isaretli her program gerekcesini yazmali ---
bad = [];
READY_PROGRAMS.forEach((p) => {
  const thin = volumeRows(p.days).filter((r) => r.level === "thin");
  if (thin.length && !p.volumeNote) bad.push(p.id + " (" + thin.map((r) => r.id).join(",") + ")");
});
ok("'thin' tasiyan her programda volumeNote var", bad.length === 0, bad.join(" | "));

// --- Otomatik uretec: 180 kombinasyon ---
const GOALS = ["kasyap", "guc", "yagyak", "genel"];
const EQUIPS = ["full", "ev", "dumbbell"];
const EMPHS = ["denge", "ust", "alt"];
const plans = [];
for (let d = 2; d <= 6; d++)
  for (const goal of GOALS)
    for (const equip of EQUIPS)
      for (const emphasis of EMPHS)
        plans.push({ key: `${d}g/${goal}/${equip}/${emphasis}`, plan: buildAutoPlan({ days: d, goal, equip, emphasis }) });
ok("180 kombinasyon uretildi", plans.length === 180, String(plans.length));

// Uretecin kendi hesabi ile ekranin hesabi AYNI olmali. Eskiden autoPlan'in
// kendi ayri ve uyusmayan dolayli tablosu vardi.
bad = [];
plans.forEach(({ key, plan }) => {
  const shown = weeklyVolume(plan.days).total;
  Object.keys(shown).forEach((r) => {
    if (Math.abs(shown[r] - plan.volume.total[r]) > 0.001) bad.push(key + "/" + r + " " + plan.volume.total[r] + " vs " + shown[r]);
  });
});
ok("uretec hacmi = ekran hacmi", bad.length === 0, bad.slice(0, 3).join(" | "));

// Alt sinir ya karsilanmali ya da acik olarak raporlanmali — sessizce
// "Hacim yeterli" dememeli.
bad = [];
plans.forEach(({ key, plan }) => {
  Object.keys(plan.volume.direct).forEach((r) => {
    if (plan.volume.direct[r] < directMinFor(r) && !plan.gaps.includes(r)) bad.push(key + "/" + r + " dogrudan=" + plan.volume.direct[r]);
  });
});
ok("dogrudan alt siniri karsilanmayan bolge 'gap' olarak raporlaniyor", bad.length === 0, bad.slice(0, 3).join(" | "));

// Doldurma ve budama donguleri artik salinamaz: doldurma yalniz
// (total < min || direct < directMin), budama yalniz (total > max && direct >= directMin)
// iken calisir. Bunlar ayrik.
bad = [];
plans.forEach(({ key, plan }) => {
  Object.keys(plan.volume.total).forEach((r) => {
    if (plan.volume.total[r] > maxFor(r) && plan.volume.direct[r] < directMinFor(r)) bad.push(key + "/" + r);
  });
});
ok("salinim yok (tavan ustu + alt sinir alti ayni anda olmuyor)", bad.length === 0, bad.slice(0, 3).join(" | "));

// Doldurma dongusu sabit TARGET_MIN kullaniyordu, minFor(r) degil — bu yuzden
// karin 6 yerine 10'a zorlanip 180 kombinasyonun HEPSINDE 12'ye cakiliyordu.
const karinler = new Set(plans.map(({ plan }) => plan.volume.total.karin));
ok("karin artik hep ayni degere cakili degil", karinler.size > 1,
   "farkli deger sayisi=" + karinler.size + " (" + [...karinler].slice(0, 5).join(",") + ")");

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
