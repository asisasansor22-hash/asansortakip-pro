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
import { volumeOf, TARGET_MIN, TARGET_MAX } from "./volume";
import { muscleMinFor, muscleMaxFor, musclesOf, OPTIONAL } from "./muscles";

// Hacim eşikleri tek yerde: data/volume.js. Burada yeniden dışa aktarılıyor
// çünkü AutoPlanner.jsx bunları bu modülden içe aktarıyor.
export { TARGET_MIN, TARGET_MAX };

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
  // chin-up listenin SONUNDA: salon/dumbbell modunda öndekiler hep uygun olduğu
  // için asla seçilmez; yalnız ekipmansız modda devreye girer (kalisteniğin
  // standart biceps hareketi). region'ı sirt olduğu için biceps'e 0,6 dolaylı
  // sayılır ve biceps açığı dürüstçe raporlanmaya devam eder.
  biceps:    { region: "kol",   ids: ["barbell-curl", "biceps-curl", "hammer-curl", "preacher-curl", "concentration-curl", "chin-up"] },
  triceps:   { region: "kol",   ids: ["triceps-pushdown", "skull-crusher", "close-grip-bench", "triceps-dips", "overhead-extension"] },
  quad:      { region: "bacak", ids: ["squat", "front-squat", "leg-press", "goblet-squat", "hack-squat", "lunge", "bulgarian", "leg-extension"] },
  hamGlute:  { region: "bacak", ids: ["romanian-deadlift", "hip-thrust", "leg-curl", "glute-bridge", "nordic-curl", "single-leg-glute-bridge"] },
  // Hamstring açığını kapatmak için AYRI havuz: hamGlute'un başında hip-thrust
  // var ve o bir glute hareketi — hamstring eksikken onu seçmek açığı kapatmıyor.
  ham:       { region: "bacak", ids: ["leg-curl", "romanian-deadlift", "nordic-curl", "good-morning"] },
  glute:     { region: "bacak", ids: ["hip-thrust", "glute-bridge", "bulgarian", "single-leg-glute-bridge", "lunge"] },
  calf:      { region: "bacak", ids: ["calf-raise", "seated-calf-raise"] },
  // Sıra ÖNEMLİ ve alt gruplara göre dönüşümlü: alt karın → üst karın → oblik
  // → izometrik. Sebep: pick() rotasyonu yalnız 0/1 değerini aldığı için
  // pratikte havuzun ilk iki girdisi seçiliyor. Eski sıra ("plank",
  // "hanging-leg-raise", ...) yüzünden 240 planın hepsinde yalnız 3 hareket
  // çıkıyordu — ÜST KARIN ve OBLİK hiç çalışılmıyordu.
  core:      { region: "karin", ids: ["hanging-leg-raise", "crunch", "bicycle-crunch", "plank",
                                      "leg-raise", "russian-twist", "hollow-body-hold", "ab-roller",
                                      "side-plank", "cable-crunch"] },
};

// NOT: Burada eskiden AYRI bir dolaylı hacim tablosu vardı ve data/volume.js'teki
// tabloyla UYUŞMUYORDU (0.25 katmanı yoktu, bazı havuzlar eksikti). Üstelik
// doğrudan bölgeyi POOLS[pool].region'dan alıyordu, volume.js ise hareketin
// kendi region'ından — bu yüzden aynı plan için üreteç ve ekran farklı sayılar
// gösteriyordu. Artık ikisi de volumeOf() kullanıyor: tek tablo, tek doğru.

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
  // Uygun hareket yoksa null dön — slot boş kalır ve açık dürüstçe raporlanır.
  // Eskiden burada ekipman filtresini YOK SAYAN bir yedek döngü vardı:
  // "Ekipmansız" seçen kullanıcıya barbell curl, "sadece dumbbell" seçene
  // makine hareketi yazıyordu (180 kombinasyonda 520 ihlal).
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
// Vurgu sırası KAS GRUBU bazında. Eskiden bölge bazındaydı ve "bacak" tek kova
// olduğu için üreteç 20 set quad ile bacağı "dolu" sayıp hamstringi hiç
// eklemeyebiliyordu.
// focus: bu vurguda ÖNE ÇIKAN kaslar. Eskiden order.slice(0,3) ile örtük
// hesaplanıyordu ve sonuç yanıltıcıydı: "Üst Vücut" seçen kullanıcının
// KOLLARI hiç öne çıkmıyordu (biceps/triceps sırada 7. ve 8. idi). Artık açık
// yazılıyor — hangi vurgunun neyi artırdığı tek bakışta okunuyor.
export const EMPHASIS = {
  denge:   { name: "Dengeli", focus: [],
             order: ["quad", "hamstring", "glute", "lat", "ustSirt", "gogus", "onDeltoid", "yanDeltoid", "arkaDeltoid", "biceps", "triceps", "karin", "baldir", "erektor"] },
  altvucut:{ name: "Kalça & Bacak", focus: ["glute", "quad", "hamstring"],
             order: ["glute", "quad", "hamstring", "baldir", "karin", "lat", "ustSirt", "onDeltoid", "yanDeltoid", "arkaDeltoid", "gogus", "biceps", "triceps", "erektor"] },
  // Kollar da üst vücuttur: etiket "Üst Vücut" derken sırt ve göğsü artırıp
  // kolu dışarıda bırakmak sözü tutmamaktı.
  ustvucut:{ name: "Üst Vücut", focus: ["lat", "ustSirt", "gogus", "biceps", "triceps"],
             order: ["lat", "ustSirt", "gogus", "biceps", "triceps", "onDeltoid", "yanDeltoid", "arkaDeltoid", "quad", "hamstring", "glute", "karin", "baldir", "erektor"] },
  kolomuz: { name: "Kol & Omuz", focus: ["biceps", "triceps", "yanDeltoid", "arkaDeltoid"],
             order: ["biceps", "triceps", "yanDeltoid", "arkaDeltoid", "onDeltoid", "gogus", "lat", "ustSirt", "quad", "hamstring", "glute", "karin", "baldir", "erektor"] },
};

// Vurgulanan kas için DOĞRUDAN set hedefi.
//
// Bu olmadan vurgu kollarda işe yaramıyordu: biceps 6 doğrudan + 10,5 dolaylı
// = 16,5 toplam, eşik 10 → sistem "yeterli" deyip duruyordu. Ama kol büyütmek
// isteyen birine 6 doğrudan set azdır; dolaylı yük kürek ve preslerden geliyor
// ve curl'ün yaklaşık yarısı değerinde (Mannarino 2019). Toplam hedefi
// yükseltmek de çözmüyordu, çünkü dolaylı zaten hedefi doldurmuş oluyor.
const FOCUS_DIRECT = 8;

// Eksik kalan KAS GRUBUNU tamamlamak için havuz sırası.
// erektor listede yok: menteşe hareketleri onu zaten dolduruyor, ayrıca
// doğrudan bel hareketi (hyperextension) her ekipman modunda yok.
const FILL_POOLS = {
  gogus:       ["chestIso", "chestUp", "chest"],
  lat:         ["backVert", "backHoriz"],
  ustSirt:     ["backHoriz", "shRear", "backVert"],
  onDeltoid:   ["shPress", "chestUp"],
  yanDeltoid:  ["shLat"],
  arkaDeltoid: ["shRear", "backHoriz"],
  biceps:      ["biceps"],
  triceps:     ["triceps"],
  quad:        ["quad"],
  hamstring:   ["ham", "hamGlute"],
  glute:       ["glute", "hamGlute"],
  baldir:      ["calf"],
  karin:       ["core"],
  erektor:     ["backLow"],
};

// Günde en fazla hareket. Az günle çalışanın seansı zorunlu olarak uzundur,
// bu yüzden sınır gün sayısına göre esner.
function maxPerDay(days) { return days <= 2 ? 10 : days === 3 ? 9 : 8; }

// Haftalık hacim: { direct, indirect, total }. Ekranın kullandığı hesabın
// birebir aynısı (data/volume.js) — slot zaten hareket id'si taşıdığı için
// havuz anahtarına gerek yok.
function computeVolume(days) {
  return volumeOf(days.flatMap((d) => d.slots.map((s) => ({ id: s.id, sets: s.sets }))));
}

// Ana üretici
// { days, goal, equip, emphasis } → { name, split, days[], volume, gaps[], meets }
export function buildAutoPlan({ days = 3, goal = "kasyap", equip = "full", emphasis = "denge" } = {}) {
  const n = Math.max(2, Math.min(6, Number(days) || 3));
  const split = SPLIT_BY_DAYS[n];
  const mode = equip;

  // 1) Temel bölünmeyi kur
  const built = split.keys.map((k, gunIdx) => {
    const [name, slots, rotBase] = D[k];
    // Rotasyon: şablondaki rot yalnız 0/1 değeri alıyordu ve pick()
    // `ids.slice(rot % ids.length)` yaptığı için havuzun pratikte yalnız İLK
    // İKİ girdisi seçilebiliyordu. Somut sonucu: 240 planın tamamında karın
    // havuzundan hep aynı 3 hareket çıkıyor, üst karın ve oblik hiç
    // çalışılmıyordu.
    //
    // ⚠️ Gün sırası YALNIZ yardımcı (izolasyon) slotlara eklenir, bileşiklere
    // DEĞİL. Havuzlar tercih sırasına göre dizili — en iyi hareket başta.
    // Bileşiği de kaydırınca rotasyon havuzun dibindeki zayıf hareketi ana
    // lift yapıyordu: 5 günlük GÜÇ programında ana menteşe hareketi
    // "tek bacak glute bridge" oluyor ve bel hacmi 12,5'ten 5'e düşüyordu.
    const rot = rotBase;                 // bileşikler: havuzun başı
    const rotYardimci = rotBase + gunIdx; // yardımcılar: çeşitlilik
    const usedInDay = new Set();
    const out = { name, rot, rotYardimci, slots: [], baseRegions: new Set() };
    slots.forEach(([pool, compound]) => {
      // Günün KİMLİĞİ şablondaki slotlardan gelir; doldurma sonradan eklediği
      // için bunu doldurmadan ÖNCE kaydediyoruz. "Alt A" gününün kimliği
      // bacak+karın'dır, sonradan oraya omuz hareketi düşse bile.
      if (POOLS[pool]) out.baseRegions.add(POOLS[pool].region);
      const id = pick(pool, mode, usedInDay, compound ? rot : rotYardimci);
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
  // Vurgunun GERÇEK etkisi: ilk 3 kasın doldurma hedefi +5 set (10 → 15;
  // 20 tavanının güvenle altında, budamayla salınım yaratmaz).
  //
  // Eskiden vurgu yalnızca doldurma SIRASINI değiştiriyordu — her kas alt
  // eşiği geçtiği anda sıranın önemi kalmıyordu ve "Kalça & Bacak" seçmek
  // bacağa tek set bile eklemiyordu (ölçüldü: fark yalnız rotasyon gürültüsü).
  // Not: "gaps" raporu bilimsel eşiği (muscleMinFor) kullanmaya devam eder;
  // vurgu hedefine ulaşılamaması bir eksiklik değil, tercihtir.
  const focus = new Set((EMPHASIS[emphasis] || EMPHASIS.denge).focus || []);
  const targetFor = (r) => muscleMinFor(r) + (focus.has(r) ? 5 : 0);
  // Vurgusuz kaslarda kural değişmedi: "en az bir doğrudan set".
  const dogrudanHedef = (r) => (focus.has(r) ? FOCUS_DIRECT : 1);
  for (let guard = 0; guard < 40; guard++) {
    const vol = computeVolume(built);
    // Açık sayılan iki durum var:
    //   • toplam hacim bölgenin eşiğinin altında  (eskiden sabit TARGET_MIN
    //     kullanılıyordu, bu yüzden karın 6 yerine 10'a zorlanıp fazla dolduruluyordu)
    //   • toplam yeterli AMA doğrudan set alt sınırın altında — yani bölge
    //     yalnızca bileşiklerden dolaylı kredi toplamış. Eskiden bu görülmüyordu
    //     ve üreteç kola hiç hareket eklemiyordu.
    const gap = order.find((r) => vol.total[r] < targetFor(r) || vol.direct[r] < dogrudanHedef(r));
    if (!gap) break;

    // Bu kası çalıştıran havuzlardan bir hareket ekle.
    const candidates = FILL_POOLS[gap] || [];
    let placed = false;
    // Günleri önce UYUM'a, sonra doluluğa göre sırala.
    //
    // Eskiden yalnız doluluğa bakılıyordu ve sonuç saçmaydı: bacak gününe
    // dumbbell-fly ve face-pull, "Alt B" gününe cable-lateral ekleniyordu.
    // Uyum = o günde zaten aynı BÖLGEDEN hareket var mı. Böylece göğüs açığı
    // itiş/üst gününe, bacak açığı bacak gününe gider.
    const wantRegion = (POOLS[candidates[0]] || {}).region;
    // Uyum bir TERCİHTİR, kural değil — ama uyumlu günün KAPASİTESİ artırılır.
    //
    // Sorun şuydu: uyumlu günler tavana dayanınca hareket komşu güne taşıyordu
    // ve "4 gün + üst vücut vurgusu" seçen kullanıcının BACAK gününe üç omuz
    // hareketi (iki yan kaldırış + face pull) yazılıyordu (720 günün 69'u).
    //
    // Çözüm olarak taşmayı tamamen yasaklamayı denedim ve DAHA KÖTÜ oldu:
    // "hacim yeterli" plan sayısı 57/180'den 39/180'e düştü, baldır açığı
    // 84'ten 130'a çıktı — çünkü PPL'de baldır yalnız bacak gününe sığabiliyor.
    // Gerçek hayatta da baldırı/karnı itiş gününe koymak normaldir; asıl garip
    // olan, üst gün doluyken omuz izolasyonunun bacak gününe düşmesiydi.
    //
    // Bu yüzden: uyumlu gün +2 hareket taşıyabilir (önce o dolar), taşma yine
    // de son çare olarak mümkündür.
    const kisitli = built.some((d) => d.baseRegions.has(wantRegion))
                 && built.some((d) => !d.baseRegions.has(wantRegion));
    const fitDays = built.filter((d) => d.baseRegions.has(wantRegion));
    const uygun = fitDays.length ? fitDays : built;
    const digerleri = built.filter((d) => !uygun.includes(d));

    // Boşluğu kapatmanın üç yolu, bu sırayla denenir.
    const enBos = (list) => list.slice().sort((a, b) => a.slots.length - b.slots.length);

    // (1) Uyumlu güne YENİ hareket. Tavan burada +2, çünkü bölge o günlere
    //     hapsedilmişse yükü onlar taşımalı.
    const cap = maxPerDay(n) + (kisitli ? 2 : 0);
    for (const day of enBos(uygun)) {
      if (day.slots.length >= cap) continue;
      const usedInDay = new Set(day.slots.map((s) => s.id));
      for (const pool of candidates) {
        const id = pick(pool, mode, usedInDay, day.rotYardimci);
        if (!id) continue;
        day.slots.push({ pool, id, sets: prescribe(goal, false).s, reps: prescribe(goal, false).r });
        placed = true; break;
      }
      if (placed) break;
    }

    // (2) Uyumlu günde ZATEN o kası doğrudan çalıştıran hareket varsa SET EKLE.
    //     Bu adım olmadan üreteç, dumbbell modunda yan omuz için üçüncü bir
    //     yan kaldırış seansını BACAK gününe koyuyordu — havuzda başka uygun
    //     hareket kalmadığı için. Var olan hareketi 5 sete çıkarmak hem
    //     programlama olarak doğru hem de günü bozmuyor.
    if (!placed) {
      for (const day of enBos(uygun)) {
        const s = day.slots.find((x) => (musclesOf(x.id)[gap] || 0) >= 1 && x.sets < 5);
        if (s) { s.sets += 1; placed = true; break; }
      }
    }

    // (3) Son çare: uyumsuz güne yeni hareket. Baldır/karnı itiş gününe koymak
    //     gerçek hayatta normaldir; tamamen yasaklamak açığı büyütüyordu
    //     (ölçüldü: "hacim yeterli" 57/180 → 39/180).
    if (!placed) {
      for (const day of enBos(digerleri)) {
        if (day.slots.length >= maxPerDay(n)) continue;
        const usedInDay = new Set(day.slots.map((s) => s.id));
        for (const pool of candidates) {
          const id = pick(pool, mode, usedInDay, day.rotYardimci);
          if (!id) continue;
          day.slots.push({ pool, id, sets: prescribe(goal, false).s, reps: prescribe(goal, false).r });
          placed = true; break;
        }
        if (placed) break;
      }
    }
    if (!placed) break; // yer kalmadı — açık raporlanacak
  }

  // 2a) Çok ince gün tamamlama: ekipman filtresi (artık delinemediği için)
  //     bazı havuzları tamamen boşaltabiliyor — 6 gün + ekipmansız modda
  //     "Çekiş B" 2 harekette kalıyordu. Haftalık hacim yerinde olsa da 2
  //     hareketlik bir gün kullanıcıya bozuk görünür; günün KENDİ
  //     havuzlarından (yani aynı bölgeden) en az 4 harekete tamamla.
  built.forEach((day) => {
    for (let guard = 0; day.slots.length < 4 && guard < 6; guard++) {
      const usedInDay = new Set(day.slots.map((s) => s.id));
      let placed = false;
      for (const poolKey of [...new Set(day.slots.map((s) => s.pool))]) {
        const id = pick(poolKey, mode, usedInDay, day.rotYardimci + 1 + guard);
        if (!id) continue;
        const rx = prescribe(goal, false);
        day.slots.push({ pool: poolKey, id, sets: rx.s, reps: rx.r });
        placed = true;
        break;
      }
      if (!placed) break; // bu ekipmanla gerçekten başka hareket yok
    }
  });

  // 2b) Üst sınır budaması: hacim 20 setin üstüne çıkan bölgelerden İZOLASYON
  //     hareketi çıkar. Gerekçe: doz-yanıt eğrisi 10-20 set aralığından sonra
  //     azalan getiri (hatta ters-U) gösterir; fazla hacim toparlanmayı zorlar.
  //     Bileşikler korunur — onlar birden çok bölgeyi besler.
  const ISOLATION = new Set(["chestIso", "shLat", "shRear", "biceps", "triceps", "calf", "glute", "core"]);
  for (let guard = 0; guard < 30; guard++) {
    const vol = computeVolume(built);
    // Doğrudan set alt sınırının ALTINDAKİ bir bölgeden asla budama yapma.
    // Eskiden bu koşul yoktu: kolun hayali (dolaylı) hacmi 20'yi geçtiği için
    // budama, üretecin kendi koyduğu curl ve pushdown'ları siliyordu.
    const over = Object.keys(vol.total)
      .filter((r) => vol.total[r] > muscleMaxFor(r) && vol.direct[r] > 0)
      .sort((a, b) => vol.total[b] - vol.total[a])[0];
    if (!over) break;

    // O bölgeyi besleyen izolasyon slotlarından, en dolu günden birini çıkar
    let removed = false;
    const dayOrder = built.map((d, k) => k).sort((a, b) => built[b].slots.length - built[a].slots.length);
    for (const di of dayOrder) {
      const day = built[di];
      const idx = day.slots.findIndex((s) => {
        // "over" artık BÖLGE değil KAS GRUBU — o kası DOĞRUDAN çalıştıran
        // (katsayı 1) bir izolasyon slotu mu?
        const mix = musclesOf(s.id);
        if (!ISOLATION.has(s.pool) || (mix[over] || 0) < 1) return false;
        // Bu slotu silmek kası tek doğrudan uyaranından mahrum bırakıyorsa dokunma.
        if ((vol.direct[over] - s.sets) <= 0) return false;
        // ...ve YAN ETKİ: hareket başka kasları da çalıştırıyor olabilir.
        // glute-bridge glute için silinip hamstringi eşiğin altına düşürüyordu.
        return Object.keys(mix).every((m) => {
          if (m === over) return true;
          const after = vol.total[m] - s.sets * mix[m];
          return after >= muscleMinFor(m) || vol.total[m] < muscleMinFor(m); // zaten eksikse zaten raporlanıyor
        });
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
        // Değişim, hareketin DOĞRUDAN çalıştırdığı bir kası kaybettirmemeli.
        // Aksi halde gerilme uğruna hacim açığı açılıyordu: hamGlute havuzunda
        // romanian-deadlift → hip-thrust değişimi hamstringi 10,5'ten 8,5'e
        // düşürüp doldurma döngüsünün işini geri alıyordu (budama döngüsündeki
        // hatanın aynısı).
        const lost = Object.keys(musclesOf(s.id)).filter((m) => musclesOf(s.id)[m] >= 1);
        const alt = ids.find((id) => {
          const t = tensionOf(id);
          if (!t || t.p !== "uzun" || usedInDay.has(id)) return false;
          if (!accept((getExercise(id) || {}).equip, mode)) return false;
          const gain = musclesOf(id);
          return lost.every((m) => (gain[m] || 0) >= 1);
        });
        if (alt) { usedInDay.delete(s.id); s.id = alt; usedInDay.add(alt); break; }
      }
    });
  });

  // 4) Programa dönüştür + rapor
  const volume = computeVolume(built);
  // Doldurma döngüsüyle AYNI koşul: aksi halde "3 doğrudan kol seti" olan bir
  // plan sessizce "✓ Hacim yeterli" rozetini alırdı.
  const gaps = Object.keys(volume.total).filter(
    (r) => !OPTIONAL.has(r) && (volume.total[r] < muscleMinFor(r) || volume.direct[r] === 0));
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
