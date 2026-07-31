// Hacim hesabı ve doğrudan set alt sınırı.
//
// Bu dosyanın varlık sebebi: hazır bir programın Salı günü "Kol 4 set" gösteriyordu
// ama o günde hiç kol hareketi yoktu. Sayı yanlış değildi (dolaylı katkı bilimsel
// olarak yarım set sayılır) ama ekran bunu söylemiyordu ve bir bölge SIFIR doğrudan
// çalışmayla "ideal" (yeşil) görünebiliyordu.

import { volumeRows, weeklyVolume } from "../src/data/volume.js";
import { muscleMinFor, MUSCLE_MAX_DEFAULT, musclesOf } from "../src/data/muscles.js";
import { READY_PROGRAMS, getReadyProgram } from "../src/data/programs.js";
import { buildAutoPlan } from "../src/data/autoPlan.js";
import { EXERCISES } from "../src/data/exercises.js";
import { getMuscles } from "../src/data/exerciseMuscles.js";

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
ok("RDL -> hamstring DOGRUDAN", rdl.direct.hamstring === 3, "=" + rdl.direct.hamstring);
ok("RDL -> baldir sayilmiyor (sabitleyici)", rdl.total.baldir === 0, "=" + rdl.total.baldir);

// --- Bolge kovasinin gizledigi hata: quad doldu diye hamstring atlanamaz ---
const quadOnly = weeklyVolume([{ exercises: ["squat","leg-press","leg-extension","lunge"],
  sets: { squat:5, "leg-press":5, "leg-extension":5, lunge:5 } }]);
ok("20 set quad -> hamstring HALA esik alti", quadOnly.total.hamstring < muscleMinFor("hamstring"),
   "hamstring=" + quadOnly.total.hamstring);
ok("squat karin'a kredi VERMIYOR", quadOnly.total.karin === 0, "karin=" + quadOnly.total.karin);
ok("squat erektore kredi veriyor", quadOnly.indirect.erektor > 0, "erektor=" + quadOnly.indirect.erektor);

// --- Presler yan/arka deltoide kredi vermemeli ---
const press = weeklyVolume([{ exercises: ["bench-press","shoulder-press"], sets: { "bench-press":5, "shoulder-press":5 } }]);
ok("pres -> yan deltoid 0", press.total.yanDeltoid === 0, "=" + press.total.yanDeltoid);
ok("pres -> arka deltoid 0", press.total.arkaDeltoid === 0, "=" + press.total.arkaDeltoid);
ok("pres -> triceps dolayli var", press.indirect.triceps === 5, "=" + press.indirect.triceps);

// --- Kavrama sayilmaz AMA dogrudan bilek calismasi sayilir ---
const kavrama = weeklyVolume([{ exercises: ["barbell-row","deadlift","barfiks"],
  sets: { "barbell-row":4, deadlift:4, barfiks:4 } }]);
ok("kavrama on kola kredi VERMIYOR", kavrama.total.onKol === 0, "=" + kavrama.total.onKol);

// Bilek curl eskiden bolgeye dusup "triceps 1 set" sayiliyordu.
const bilek = weeklyVolume([{ exercises: ["Cable_Wrist_Curl"], sets: { "Cable_Wrist_Curl": 3 } }]);
ok("bilek curl -> on kol DOGRUDAN", bilek.direct.onKol === 3, "=" + bilek.direct.onKol);
ok("bilek curl triceps'e SAYILMIYOR", bilek.total.triceps === 0, "=" + bilek.total.triceps);

// Isege bagli kaslar "eksik" uyarisi uretmemeli (dogrudan-yanit verisi yok,
// cogu program bunlari hic calistirmaz).
const bosRows = volumeRows([{ exercises: ["bench-press"], sets: { "bench-press": 4 } }]);
ok("on kol/boyun 'az' uyarisi uretmiyor",
   bosRows.filter((r) => (r.id === "onKol" || r.id === "boyun") && (r.level === "low" || r.level === "thin")).length === 0);

// --- Bildirilen hata: fullbody-beginner ---
const fbRows = volumeRows(getReadyProgram("fullbody-beginner").days);
const fbT = fbRows.find((r) => r.id === "triceps");
const fbB = fbRows.find((r) => r.id === "biceps");
ok("fullbody-beginner triceps: dogrudan set var", fbT.direct > 0, "dogrudan=" + fbT.direct);
ok("fullbody-beginner biceps: dogrudan set var", fbB.direct > 0, "dogrudan=" + fbB.direct);

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

// --- Hareket -> kas eslemesi denetimi ---
// Kural bazli denetim (scratchpad/audit.mjs) uc hata sinifi buldu; hepsi burada
// kilitleniyor.

// (a) Kaynak veri hicbir hareketi bos birakmamali. Bos kalirsa musclesOf
// "bolgeden tek kas" tahminine duser: nordic-curl quad, single-leg-glute-bridge
// yine quad sayiliyordu.
const kapsamsiz = EXERCISES.filter((e) => e.region !== "kardiyo" && !getMuscles(e.id));
ok("her hareketin kas eslemesi var", kapsamsiz.length === 0,
   kapsamsiz.length + " eksik: " + kapsamsiz.slice(0, 5).map((e) => e.id).join(", "));

const primOf = (id) => Object.keys(musclesOf(id)).filter((m) => musclesOf(id)[m] >= 1);
const birincil = (id, m) => ok(id + " -> " + m, primOf(id).includes(m), "= " + primOf(id).join(","));

// (b) Omuz basi ayrimi. Kaynak veri yalnizca "Omuz" diyor; on/yan/arka'yi
// hareket adindan turetiyoruz.
//   • "chin" cıplak alt dizge olarak aranıyordu ve "maCHINe" icinde eslesiyordu
//     → makine presleri arka omuz sayiliyordu.
//   • arka omuz desenleri tireliydi ("rear-delt") ama uretilen id'ler alt cizgili
//     ("Cable_Rear_Delt_Fly") → 6 arka omuz hareketi on omuz sayiliyordu.
birincil("Machine_Shoulder_Military_Press", "onDeltoid");
birincil("Smith_Machine_Overhead_Shoulder_Press", "onDeltoid");
birincil("Cable_Rear_Delt_Fly", "arkaDeltoid");
birincil("Lying_Rear_Delt_Raise", "arkaDeltoid");
birincil("Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", "arkaDeltoid");
birincil("Seated_Bent-Over_Rear_Delt_Raise", "arkaDeltoid");
birincil("Reverse_Flyes_With_External_Rotation", "arkaDeltoid");
birincil("Sled_Reverse_Flye", "arkaDeltoid");
birincil("Reverse_Machine_Flyes", "arkaDeltoid");
// "throw" icinde "row", "pullover" icinde "pull" var — sozcuk siniri sart.
birincil("Backward_Medicine_Ball_Throw", "onDeltoid");
birincil("upright-row", "yanDeltoid");
birincil("Seated_Side_Lateral_Raise", "yanDeltoid");
// Ters lunge/crunch/curl "reverse" tasir ama arka omuz DEGILDIR.
ok("reverse-lunge arka omuza sayilmiyor", !primOf("reverse-lunge").includes("arkaDeltoid"));

// (c) Elle yazilmis vucut agirligi hareketleri (kaynak veride yoklar).
birincil("nordic-curl", "hamstring");
ok("nordic-curl glute'a TAM set yazmiyor (diz bukme, kalca acilmiyor)",
   !(musclesOf("nordic-curl").glute >= 1), "= " + musclesOf("nordic-curl").glute);
birincil("single-leg-glute-bridge", "glute");
birincil("pistol-squat", "quad");
birincil("superman", "erektor");
birincil("scapular-pull", "ustSirt");
birincil("pike-pushup", "onDeltoid");
birincil("hollow-body-hold", "karin");

// (d) Kaynak veride birincil kas acikca yanlis olan hareketler.
birincil("flutter-kicks", "karin");
birincil("mountain-climber-ab", "karin");
birincil("Split_Squats", "quad");
birincil("Lower_Back_Curl", "erektor");
birincil("Rear_Leg_Raises", "glute");

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
    if (plan.volume.direct[r] === 0 && plan.volume.total[r] > 0 && !plan.gaps.includes(r)) bad.push(key + "/" + r + " dogrudan=0");
  });
});
ok("dogrudan seti olmayan kas 'gap' olarak raporlaniyor", bad.length === 0, bad.slice(0, 3).join(" | "));

// Doldurma ve budama donguleri artik salinamaz: doldurma yalniz
// (total < min || direct < directMin), budama yalniz (total > max && direct >= directMin)
// iken calisir. Bunlar ayrik.
bad = [];
plans.forEach(({ key, plan }) => {
  Object.keys(plan.volume.total).forEach((r) => {
    if (plan.volume.total[r] > MUSCLE_MAX_DEFAULT && plan.volume.direct[r] === 0) bad.push(key + "/" + r);
  });
});
ok("salinim yok (tavan ustu + alt sinir alti ayni anda olmuyor)", bad.length === 0, bad.slice(0, 3).join(" | "));

// Doldurma dongusu sabit TARGET_MIN kullaniyordu, minFor(r) degil — bu yuzden
// karin 6 yerine 10'a zorlanip 180 kombinasyonun HEPSINDE 12'ye cakiliyordu.
// Kas grubuna gecince uretecin hamstringi atlayamamasi gerek
bad = [];
plans.forEach(({ key, plan }) => {
  if (plan.volume.direct.hamstring === 0 && !plan.gaps.includes("hamstring")) bad.push(key);
});
ok("uretec hamstringi atlamiyor", bad.length === 0, bad.slice(0,3).join(" | "));

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
