// Hacim hesabı ve doğrudan set alt sınırı.
//
// Bu dosyanın varlık sebebi: hazır bir programın Salı günü "Kol 4 set" gösteriyordu
// ama o günde hiç kol hareketi yoktu. Sayı yanlış değildi (dolaylı katkı bilimsel
// olarak yarım set sayılır) ama ekran bunu söylemiyordu ve bir bölge SIFIR doğrudan
// çalışmayla "ideal" (yeşil) görünebiliyordu.

import { volumeRows, weeklyVolume } from "../src/data/volume.js";
import { muscleMinFor, MUSCLE_MAX_DEFAULT, musclesOf, substitutesFor } from "../src/data/muscles.js";
import { READY_PROGRAMS, getReadyProgram } from "../src/data/programs.js";
import { buildAutoPlan, EMPHASIS } from "../src/data/autoPlan.js";
import { EXERCISES, getExercise, subOf } from "../src/data/exercises.js";
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

// --- Ev/kalistenik programlari salon aleti isteyemez ---
// Gelenek: ev programlari vucut agirligi + dumbbell + bar ile kurulu.
// fatloss "ev" etiketliydi ama bench-press ve barbell-row (saf halter)
// iceriyordu — evde yapilamayan bir ev programi.
// "Halter/Vücut" gibi bilesik etiketler serbest: vucut agirligiyla yapilabilir.
bad = [];
READY_PROGRAMS.filter((p) => p.style === "ev" || p.style === "kalistenik").forEach((p) => {
  p.days.forEach((d) => (d.exercises || []).forEach((id) => {
    const eq = (getExercise(id) || {}).equip || "";
    if (/^(Halter|Makine|EZ Bar|Smith)$/i.test(eq)) bad.push(p.id + "/" + d.name + "/" + id + " [" + eq + "]");
  }));
});
ok("ev/kalistenik programlarinda salon aleti yok", bad.length === 0, bad.slice(0, 3).join(" | "));

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




// Bolge basliklari TEKRAR ETMEMELI. Ekranlar "onceki satirin bolgesi
// farkliysa baslik bas" mantigini kullaniyor; istege bagli kaslar (On Kol,
// Boyun) listenin sonunda durdugu icin "KOL" ve "OMUZ" basliklari ikinci kez
// basiliyordu. volumeRows artik bolgeye gore bitisik siraliyor.
const satirlar = volumeRows([{ exercises: ["bench-press"], sets: { "bench-press": 3 } }]);
const gorulen = new Set();
bad = [];
satirlar.forEach((r, k) => {
  if (k > 0 && satirlar[k - 1].region === r.region) return;   // ayni blok devam ediyor
  if (gorulen.has(r.region)) bad.push(r.region + " (" + r.name + " satirinda tekrar)");
  gorulen.add(r.region);
});
ok("bolge basliklari tekrar etmiyor", bad.length === 0, bad.join(" | "));
ok("tum kas gruplari listeleniyor", satirlar.length === 16, String(satirlar.length));


// --- Iki ekran ayni hesabi kullanmali ---
// Planlama (VolumeSummary) kas grubu + dogrudan/dolayli gosteriyordu, Ilerleme
// ekrani ise BOLGE bazli ve yalniz dogrudan sayiyordu. Ayni hafta icin iki
// farkli sayi cikiyordu ("Biceps 6+10,5" vs "Kol 12"). Ilerleme artik
// kaydedilen setleri sahte bir "gun"e cevirip ayni volumeRows'u cagiriyor.
const kayitliSetler = [
  { exId: "bench-press" }, { exId: "bench-press" }, { exId: "bench-press" }, { exId: "bench-press" },
  { exId: "barbell-row" }, { exId: "barbell-row" }, { exId: "barbell-row" },
  { exId: "biceps-curl" }, { exId: "biceps-curl" }, { exId: "biceps-curl" },
];
const sayim = {};
kayitliSetler.forEach((st) => { sayim[st.exId] = (sayim[st.exId] || 0) + 1; });
const ilerlemeRows = volumeRows([{ exercises: Object.keys(sayim), sets: sayim }]);
const planRows = volumeRows([{ exercises: ["bench-press", "barbell-row", "biceps-curl"],
                              sets: { "bench-press": 4, "barbell-row": 3, "biceps-curl": 3 } }]);
bad = [];
planRows.forEach((pr, k) => {
  const ir = ilerlemeRows[k];
  if (pr.id !== ir.id || pr.direct !== ir.direct || pr.indirect !== ir.indirect || pr.level !== ir.level)
    bad.push(pr.id + ": plan " + pr.direct + "+" + pr.indirect + " vs ilerleme " + ir.direct + "+" + ir.indirect);
});
ok("Ilerleme ekrani = planlama ekrani (ayni hesap)", bad.length === 0, bad.slice(0, 3).join(" | "));
// Kaydedilen setlerde de dolayli katki gorunmeli (eskiden hic gorunmuyordu)
const bicepsRow = ilerlemeRows.find((r) => r.id === "biceps");
ok("kaydedilen setlerde dolayli katki da raporlaniyor", bicepsRow.indirect > 0,
   "biceps dolayli=" + bicepsRow.indirect);

// --- Hareket degistirme onerileri ---
// Kullanici bildirdi: "Pec Deck yerine -> Elmas Sinav". Elmas sinavin birincil
// kasi bizim kendi verimizde TRICEPS; bir fly'in yerine onerilemez.
// Kural: aday, degistirilen hareketin birincil kasini en az YARIM set
// degerinde yuklemeli. Hicbir hareket de onerisiz kalmamali.
const curated = EXERCISES.filter((e) => !/_/.test(e.id) && e.region !== "kardiyo");
bad = [];
let onerisiz = 0;
curated.forEach((e) => {
  const P = Object.keys(musclesOf(e.id)).filter((m) => musclesOf(e.id)[m] >= 1);
  if (!P.length) return;
  const subs = substitutesFor(e.id);
  if (!subs.length) onerisiz++;
  subs.forEach((a) => {
    if (!P.some((m) => (musclesOf(a.id)[m] || 0) >= 0.5)) bad.push(e.name + " -> " + a.name);
  });
});
ok("her oneri, hedefin birincil kasini en az yarim set yukluyor", bad.length === 0, bad.slice(0, 4).join(" | "));
ok("hicbir hareket onerisiz kalmiyor", onerisiz === 0, String(onerisiz));

// Bildirilen vakalar tek tek
const subIds = (id, used = []) => substitutesFor(id, used).map((e) => e.id);
ok("pec-deck yerine elmas sinav ONERILMIYOR", !subIds("pec-deck").includes("diamond-pushup"), subIds("pec-deck").slice(0,4).join(","));
ok("dumbbell-fly yerine elmas sinav ONERILMIYOR", !subIds("dumbbell-fly").includes("diamond-pushup"));
ok("pec-deck yerine cable-crossover ONERILIYOR", subIds("pec-deck").includes("cable-crossover"));
// Elle yazilmis ALTERNATIVES tablosunda da ayni kural gecerli olmali:
// superman -> glute-bridge (bel -> kalca) ve leg-curl -> glute-bridge gibi
// girdiler vardi.
ok("superman yerine glute-bridge ONERILMIYOR", !subIds("superman").includes("glute-bridge"));
ok("leg-curl yerine glute-bridge ONERILMIYOR", !subIds("leg-curl").includes("glute-bridge"));
ok("face-pull yerine upright-row ONERILMIYOR", !subIds("face-pull").includes("upright-row"));

// --- Otomatik uretec: 180 kombinasyon ---
// DIKKAT: degerler AutoPlanner.jsx'in GERCEKTEN gonderdikleri olmali.
// Eskiden burada "yagyak/genel", "ev", "ust/alt" yaziyordu — hicbiri gercek
// deger degildi, hepsi varsayilana dusuyordu ve 180 kombinasyon aslinda ayni
// birkac plani tekrar tekrar test ediyordu. bodyweight modu hic test
// edilmedigi icin "ekipmansiz plana barbell curl yaziliyor" hatasi gozden kacti.
const GOALS = ["kasyap", "yagver", "guc", "fitkal"];
const EQUIPS = ["full", "dumbbell", "bodyweight"];
const EMPHS = ["denge", "altvucut", "ustvucut", "kolomuz"];
const plans = [];
for (let d = 2; d <= 6; d++)
  for (const goal of GOALS)
    for (const equip of EQUIPS)
      for (const emphasis of EMPHS)
        plans.push({ key: `${d}g/${goal}/${equip}/${emphasis}`, plan: buildAutoPlan({ days: d, goal, equip, emphasis }) });
ok("240 kombinasyon uretildi", plans.length === 240, String(plans.length));

// --- Karin kapsami ---
// Kullanici bildirdi: "otomatik program karin hareketi ekliyor mu, alt/ust
// bolgeyi kapsiyor mu?" Olcum: her planda karin VARDI ama havuzun sirasi ve
// pick()'in 0/1 rotasyonu yuzunden 240 planin TAMAMINDA yalniz 3 hareket
// cikiyordu — UST KARIN ve OBLIK hic calisilmiyordu.
const abIds = new Set(), abSub = new Set();
let karinsizPlan = 0;
plans.forEach(({ plan }) => {
  let varMi = false;
  plan.days.forEach((d) => d.exercises.forEach((id) => {
    const ex = getExercise(id);
    if (!ex || ex.region !== "karin") return;
    varMi = true; abIds.add(id); abSub.add(subOf(ex));
  }));
  if (!varMi) karinsizPlan++;
});
ok("her planda karin hareketi var", karinsizPlan === 0, String(karinsizPlan) + " plan karinsiz");
ok("karin hareketi cesitliligi >= 6", abIds.size >= 6, abIds.size + " cesit");
["Üst karın", "Alt karın", "Yan karın (Oblik)", "Core / İzometrik"].forEach((g) =>
  ok("karin alt grubu kapsaniyor: " + g, abSub.has(g)));
// Dogrudan karin seti hicbir planda sifir olmamali
bad = [];
plans.forEach(({ key, plan }) => { if (plan.volume.direct.karin === 0) bad.push(key); });
ok("hicbir planda dogrudan karin seti sifir degil", bad.length === 0, bad.slice(0, 3).join(" | "));

// Bilesik slotlar havuzun BASINDAN secilmeli. Rotasyona gun sirasi eklenince
// 5 gunluk GUC programinin ana mentese hareketi "tek bacak glute bridge"
// oluyordu ve bel hacmi 12,5'ten 5'e dusuyordu.
const guc5 = buildAutoPlan({ days: 5, goal: "guc", equip: "full", emphasis: "denge" });
const tumHareketler = guc5.days.flatMap((d) => d.exercises);
ok("guc programinda ana mentese zayif varyanta dusmuyor",
   !tumHareketler.includes("single-leg-glute-bridge"), tumHareketler.join(","));
ok("guc programinda bel hacmi esigin uzerinde",
   guc5.volume.total.erektor >= muscleMinFor("erektor"), "erektor=" + guc5.volume.total.erektor);

// A/B gunleri BIRBIRININ KOPYASI olmamali. Gerilme garantisi her gunu havuzun
// AYNI "uzun boy" varyantina cevirebiliyordu: 4 gunluk Ust/Alt planinda iki
// gunde birden tekrar eden 6 hareketin ALTISI DA "uzun" etiketliydi.
// Degisim artik once programin baska gununde gecmeyen bir varyant ariyor.
const ua = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "denge" });
const ustGunler = ua.days.filter((d) => /^Üst/.test(d.name));
const ortak = ustGunler[0].exercises.filter((id) => ustGunler[1].exercises.includes(id));
ok("Ust A ve Ust B en fazla 3 hareket paylasiyor", ortak.length <= 3, ortak.join(","));
// Dikey cekiste iki gun ayni hareketi kullanmamali (havuzda barfiks, chin-up,
// negative-pullup hepsi "uzun" — secenek var)
const dikey = ["barfiks", "chin-up", "negative-pullup", "lat-pulldown"];
const d0 = ustGunler[0].exercises.filter((id) => dikey.includes(id));
const d1 = ustGunler[1].exercises.filter((id) => dikey.includes(id));
ok("iki ust gunde ayni dikey cekis yok", !d0.some((id) => d1.includes(id)), d0.join(",") + " vs " + d1.join(","));

// Yedek (fallback) hareketler SALON planina dusmemeli. diamond-pushup gogus
// izolasyon havuzundaydi ama birincil kasi triceps ve gogse yalniz yarim set
// veriyor; rotasyon havuzun derinine indigi icin tam donanimli salon planina
// vucut agirligi hareketi olarak dusuyordu.
bad = [];
plans.forEach(({ key, plan }) => {
  if (!key.includes("/full/")) return;
  plan.days.forEach((d) => {
    if (d.exercises.includes("diamond-pushup")) bad.push(key + "/" + d.name);
  });
});
ok("salon planina yedek vucut agirligi hareketi dusmuyor", bad.length === 0, bad.slice(0, 3).join(" | "));
// ...ama ekipmansiz modda yedek DEVREDE olmali (yoksa gun 3 harekete duser)
const bw6 = buildAutoPlan({ days: 6, goal: "kasyap", equip: "bodyweight", emphasis: "denge" });
ok("ekipmansiz modda yedek devreye giriyor",
   bw6.days.every((d) => d.exercises.length >= 4),
   bw6.days.map((d) => d.name + ":" + d.exercises.length).join(" "));


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

// Ekipman sozu tutulmali: "ekipmansiz" secen kullanicinin planinda barbell,
// "sadece dumbbell" secenin planinda makine hareketi OLAMAZ. pick()'in eski
// yedek dongusu filtreyi yok sayip 180 kombinasyonda 520 ihlal uretiyordu.
const equipOk = (mode, e) => {
  if (mode === "full") return true;
  if (mode === "dumbbell") return /dumbbell|vücut|bar|paralel/i.test(e);
  return /vücut|bar|paralel|i̇p|ip/i.test(e);
};
bad = [];
plans.forEach(({ key, plan }) => {
  const mode = key.split("/")[2];
  plan.days.forEach((day) => day.exercises.forEach((id) => {
    const ex = getExercise(id);
    if (!ex) { bad.push(key + "/" + id + " YOK"); return; }
    if (!equipOk(mode, ex.equip)) bad.push(key + "/" + id + " (" + ex.equip + ")");
  }));
});
ok("ekipman kisiti hic delinmiyor", bad.length === 0, bad.slice(0, 3).join(" | "));

// Hicbir gun 2-3 hareketle kalmasin (6g/bodyweight Cekis B boyle kaliyordu),
// gun ici tekrar da olmasin.
bad = [];
plans.forEach(({ key, plan }) => {
  plan.days.forEach((day) => {
    if (day.exercises.length < 4) bad.push(key + "/" + day.name + " " + day.exercises.length);
    if (new Set(day.exercises).size !== day.exercises.length) bad.push(key + "/" + day.name + " TEKRAR");
  });
});
ok("her gunde en az 4 benzersiz hareket var", bad.length === 0, bad.slice(0, 3).join(" | "));

// Vurgu GERCEK etki yaratmali. Eskiden yalnizca doldurma sirasini
// degistiriyordu ve her kas esigi gectigi anda etkisi sifirlaniyordu —
// "Kalca & Bacak" secmek bacaga tek set eklemiyordu.
const vDenge = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "denge" }).volume.total;
const vUst = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "ustvucut" }).volume.total;
const vAlt = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "altvucut" }).volume.total;
ok("ust vurgu gogus hacmini artiriyor", vUst.gogus > vDenge.gogus, vDenge.gogus + " -> " + vUst.gogus);
ok("ust vurgu lat hacmini artiriyor", vUst.lat > vDenge.lat, vDenge.lat + " -> " + vUst.lat);
ok("alt vurgu quad hacmini artiriyor", vAlt.quad > vDenge.quad, vDenge.quad + " -> " + vAlt.quad);
ok("alt vurgu hamstring hacmini artiriyor", vAlt.hamstring > vDenge.hamstring, vDenge.hamstring + " -> " + vAlt.hamstring);

// Kullanici bildirdi: "ust vucut sectigim halde kollara yuklenmiyor, elle
// eklemek zorunda kaliyorum". Iki sebep vardi: (1) ustvucut'un focus kumesi
// order.slice(0,3) idi ve biceps/triceps sirada 7-8'de kaliyordu; (2) TOPLAM
// hedefi yukseltmek kolu cozmuyor cunku dolayli hacim (kurek -> biceps 0,5)
// hedefi zaten dolduruyor. Cozum: focus kaslarda DOGRUDAN set hedefi.
const dDenge = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "denge" }).volume.direct;
const dUst = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "ustvucut" }).volume.direct;
const dKol = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: "kolomuz" }).volume.direct;
ok("ust vurgu biceps DOGRUDAN setini artiriyor", dUst.biceps > dDenge.biceps, dDenge.biceps + " -> " + dUst.biceps);
ok("ust vurgu triceps DOGRUDAN setini artiriyor", dUst.triceps > dDenge.triceps, dDenge.triceps + " -> " + dUst.triceps);
ok("kol&omuz vurgusu yan deltoidi artiriyor", dKol.yanDeltoid > dDenge.yanDeltoid, dDenge.yanDeltoid + " -> " + dKol.yanDeltoid);
ok("kol&omuz vurgusu arka deltoidi artiriyor", dKol.arkaDeltoid > dDenge.arkaDeltoid, dDenge.arkaDeltoid + " -> " + dKol.arkaDeltoid);

// Her vurgunun focus kaslari gercekten one cikmali (aksi halde etiket yalan olur).
bad = [];
Object.keys(EMPHASIS).forEach((k) => {
  const f = EMPHASIS[k].focus || [];
  if (!f.length) return;
  const v = buildAutoPlan({ days: 4, goal: "kasyap", equip: "full", emphasis: k }).volume.direct;
  f.forEach((m) => { if (v[m] <= dDenge[m] && v[m] < 8) bad.push(k + "/" + m + " " + dDenge[m] + " -> " + v[m]); });
});
ok("her vurgunun focus kaslari one cikiyor", bad.length === 0, bad.join(" | "));

// Omuz/kol IZOLASYONU bacak gunune dusmemeli. "4 gun + ust vucut vurgusu"nda
// ust gunler dolunca dolduma tasiyordu ve BACAK gunune iki yan kaldiris +
// face pull yaziliyordu. Baldir/karin muaf: onlari itis gunune koymak normaldir.
const UST_IZOLASYON = new Set(["lateral-raise", "cable-lateral", "upright-row", "face-pull",
  "rear-delt-fly", "biceps-curl", "barbell-curl", "hammer-curl", "preacher-curl",
  "concentration-curl", "triceps-pushdown", "skull-crusher", "overhead-extension",
  "cable-crossover", "pec-deck", "dumbbell-fly"]);
// Tasma tamamen yasak DEGIL: uyumlu gunler tavandayken ya da havuzda uygun
// hareket kalmadiginda (dumbbell/ekipmansiz modda sik), hic dogrudan seti
// olmayan bir kasi bacak gununde calismak hic calismamaktan iyidir.
// Olculebilir kural SIDDET uzerinedir: bacak gunu OMUZ GUNUNE DONUSMEMELI.
// Bildirilen hatada tek bir bacak gununde UC ust vucut izolasyonu vardi
// (iki yan kaldiris + face pull) ve ust gunler 8'de duruyordu.
bad = [];
plans.forEach(({ key, plan }) => {
  plan.days.forEach((day) => {
    if (!/^(Alt|Bacak)/.test(day.name)) return;
    const yanlis = day.exercises.filter((id) => UST_IZOLASYON.has(id));
    if (yanlis.length > 1) bad.push(key + "/" + day.name + ": " + yanlis.join(","));
  });
});
ok("bacak gununde birden fazla ust vucut izolasyonu yok", bad.length === 0, bad.slice(0, 3).join(" | "));

// ...ve istisna NADIR kalmali. Olculen: %5,2 (15/288). Kol vurgusu geldikten
// sonra yukseldi, cunku ust gunler daha cok dolduruluyor ve havuz tukenince
// tasiyor. Sinir %8: gercek bir regresyon (eski davranis) bunun cok ustunde
// kalir, normal dalgalanma ise altinda.
let bacakGun = 0, tasmali = 0;
plans.forEach(({ plan }) => plan.days.forEach((day) => {
  if (!/^(Alt|Bacak)/.test(day.name)) return;
  bacakGun++;
  if (day.exercises.some((id) => UST_IZOLASYON.has(id))) tasmali++;
}));
ok("bacak gunune tasma nadir (<=%8)", tasmali <= bacakGun * 0.08,
   tasmali + "/" + bacakGun + " = %" + (100 * tasmali / bacakGun).toFixed(1));

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
