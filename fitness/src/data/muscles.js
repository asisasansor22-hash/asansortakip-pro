// --- Kas grubu modeli (hacim hesabının çözünürlüğü) ---
//
// NEDEN VAR: Uygulamanın 7 bölgesi (gogus/sirt/omuz/kol/bacak/karin/kardiyo)
// GEZİNME için doğru ama HACİM için çok kaba. Somut sonuç:
//   • 20 set squat + leg press + leg extension → "Bacak 20 · ideal"
//     ...hamstringe hiç dokunmadan.
//   • "Kol" tek kova olduğu için biceps'i hiç çalıştırmadan kol hedefi dolabiliyordu.
//   • "Omuz" tek kova olduğu için presler omzun tamamını doldurmuş gibi görünüyordu,
//     halbuki yan ve arka deltoid preslerde neredeyse hiç çalışmaz.
//
// Bu modül bölgeleri DEĞİŞTİRMEZ — hareket tarama, filtreler ve İlerleme ekranı
// aynı kalır. Yalnızca hacim hesabı kas grubuna iner, sonra bölgeye toplanır.
//
// Katsayıların dayanağı: docs/dolayli-hacim.md (her sayı ya kaynaklı ya da
// açıkça "tahmin" olarak işaretli).

import { getExercise, getAlternatives, exercisesByRegion, subOf } from "./exercises";
import { getMuscles } from "./exerciseMuscles";
// tension.js saf veridir (hiçbir şey import etmez) — döngü riski yok.
import { tensionOf } from "./tension";

// region: hangi bölgenin altında gösterileceği (mevcut REGIONS id'leri)
export const MUSCLES = [
  { id: "gogus",     name: "Göğüs",           emoji: "🫀", region: "gogus" },
  { id: "lat",       name: "Sırt (Lat)",      emoji: "🔙", region: "sirt" },
  { id: "ustSirt",   name: "Üst / Orta Sırt", emoji: "🔙", region: "sirt" },
  { id: "erektor",   name: "Bel (Erektör)",   emoji: "🧍", region: "sirt" },
  { id: "onDeltoid", name: "Ön Omuz",         emoji: "💪", region: "omuz" },
  { id: "yanDeltoid",name: "Yan Omuz",        emoji: "💪", region: "omuz" },
  { id: "arkaDeltoid",name: "Arka Omuz",      emoji: "💪", region: "omuz" },
  { id: "biceps",    name: "Biceps",          emoji: "🦾", region: "kol" },
  { id: "triceps",   name: "Triceps",         emoji: "🦾", region: "kol" },
  { id: "quad",      name: "Ön Bacak (Quad)", emoji: "🦵", region: "bacak" },
  { id: "hamstring", name: "Arka Bacak",      emoji: "🦵", region: "bacak" },
  { id: "glute",     name: "Kalça (Glute)",   emoji: "🍑", region: "bacak" },
  { id: "baldir",    name: "Baldır",          emoji: "🦵", region: "bacak" },
  { id: "karin",     name: "Karın",           emoji: "🧱", region: "karin" },
  // İSTEĞE BAĞLI kaslar: hacimleri gösterilir ama "eksik" uyarısı ÜRETMEZ ve
  // otomatik üreteç bunları doldurmaz. Gerekçe: 10-20 set doz-yanıt verisi bu
  // ikisi için yok, ve çoğu program bunları hiç çalıştırmaz — herkese
  // "Boyun 0 set · az" göstermek gürültüden ibaret olurdu.
  { id: "onKol",     name: "Ön Kol",          emoji: "🤝", region: "kol",  optional: true },
  { id: "boyun",     name: "Boyun",           emoji: "🧣", region: "omuz", optional: true },
];

// İsteğe bağlı kaslar uyarı üretmez, üreteç tarafından doldurulmaz.
export const OPTIONAL = new Set(MUSCLES.filter((m) => m.optional).map((m) => m.id));

export const MUSCLE_IDS = MUSCLES.map((m) => m.id);
const BY_ID = {};
MUSCLES.forEach((m) => { BY_ID[m.id] = m; });
export function muscleOf(id) { return BY_ID[id] || null; }

// Haftalık alt eşik, kas grubu başına.
//
// 10-20 set aralığının kanıtı ağırlıklı olarak ANA kas gruplarından gelir
// (göğüs, sırt, quad, biceps, triceps...). Bir kasın parçası olan ya da
// çoğunlukla yardımcı olarak çalıştırılan gruplar için o kadar veri YOK;
// hepsine 10 dayatmak, 3 günlük bir başlangıç programını haksız yere
// "eksik" göstermek olurdu.
//
// ⚠️ Aşağıdaki düşürülmüş eşikler TAHMİNDİR — ölçülmüş değer değil.
// Ana kaslar varsayılan 10'da kalır.
export const MUSCLE_MIN = {
  ustSirt: 8,      // lat ile büyük ölçüde aynı çekişlerden besleniyor
  yanDeltoid: 8,
  arkaDeltoid: 6,  // ayrı doz-yanıt verisi yok; genelde yardımcı olarak çalışılır
  erektor: 6,      // doğrudan bel hareketi seyrek; menteşelerden bolca yükleniyor
  baldir: 8,
  karin: 8,
};
export const MUSCLE_MAX_DEFAULT = 20;
export function muscleMinFor(id) {
  return MUSCLE_MIN[id] != null ? MUSCLE_MIN[id] : 10;
}

// Haftalık ÜST sınır, kas grubu başına.
//
// ⚠️ glute: 26 bir MÜHENDİSLİK KARARI, ölçülmüş eşik değil.
// Gerekçe: 10-20 set aralığı, çalışmalarda o kası HEDEFLEYEN setler sayılarak
// bulundu. Bizim modelimizde ise glute, kalça ekstansiyonu içeren HER bileşikten
// tam kredi alıyor — squat, front squat, lunge, RDL, hip thrust, glute bridge
// hepsi 1,0 (Plotkin ve ark.: back squat ve hip thrust benzer glute hipertrofisi
// üretiyor, bkz. docs/dolayli-hacim.md § 2.6). Sonuç: sıradan bir bacak günü
// glute'u kolayca 20'nin üstüne çıkarıyordu ve 180 planın 115'inde turuncu
// "fazla" uyarısı yanıyordu — uyarı gürültüye dönüşünce hiçbir şey ifade etmez.
// Doğru çözüm glute'u "hedefli" ve "bileşikten gelen" diye ayırmak olurdu;
// bu, bilinen sınır olarak docs'a yazıldı.
export const MUSCLE_MAX = { glute: 26 };
export function muscleMaxFor(id) {
  return MUSCLE_MAX[id] != null ? MUSCLE_MAX[id] : MUSCLE_MAX_DEFAULT;
}
// Doğrudan set alt sınırı: kas grubuna inince ARTIK GEREKSİZ.
// Eski modelde "kol 6 doğrudan set" kuralı vardı çünkü kova biceps ile triceps'i
// ayırmıyordu. Artık ayırdığı için, biceps'in kendi eşiği zaten doğrudan
// çalışmayı zorunlu kılıyor — kürek biceps'e yalnız 0,5 katkı yapar ve tek
// başına 10'a ulaşmak 20 set kürek gerektirir.

// --- Kaynak veri eşlemesi ---
// exerciseMuscles.js 874 hareketi kapsıyor ve şu 17 Türkçe adı kullanıyor.
// Buradaki eşleme kasıtlı olarak eksiktir: "Ön Kol" ve "Boyun" hacme GİRMEZ
// (kavrama izometriktir, hipertrofi uyaranı sayılmaz — bkz. docs/dolayli-hacim.md).
const NAME_TO_MUSCLE = {
  "Göğüs": "gogus",
  "Sırt (Lat)": "lat",
  "Orta Sırt": "ustSirt",
  "Trapez": "ustSirt",
  "Bel": "erektor",
  "Omuz": "onDeltoid",        // varsayılan; DELT_HEAD ile hareket tipine göre düzeltilir
  "Biceps": "biceps",
  "Triceps": "triceps",
  "Ön Bacak (Quad)": "quad",
  "Arka Bacak": "hamstring",
  "Kalça (Glute)": "glute",
  "Baldır": "baldir",
  "İç Bacak": "glute",        // adduktor ayrı takip edilmiyor; kalça altında toplanır
  "Dış Bacak": "glute",
  "Karın": "karin",
  // Ön kol ve boyun ARTIK eşleniyor — ama yalnızca BİRİNCİL olduklarında
  // (bkz. coeffFor). Eskiden hiç eşlenmedikleri için bilek curl bölgeye düşüp
  // "triceps 1 set", boyun hareketi de "ön omuz 1 set" sayılıyordu.
  "Ön Kol": "onKol",
  "Boyun": "boyun",
};

// Kaynak veri omzu tek isim olarak tutuyor ("Omuz"). Ön/yan/arka ayrımını
// hareketin kendisinden türetiyoruz. Küratörlü eşleme; kenar durumlarda
// hatalı olabilir (bkz. docs/dolayli-hacim.md · Bölüm 4).
//
// Hareket id'leri iki biçimde geliyor: elle yazılanlar tireli-küçük harf
// ("rear-delt-fly"), free-exercise-db'den gelenler alt çizgili-Başlık
// ("Cable_Rear_Delt_Fly"). ÖNCE tek biçime indirgiyoruz — bu yapılmadığı için
// alt çizgili 6 arka omuz hareketi ön omuz sayılıyordu.
function normId(exId) {
  return String(exId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
// Tire ile ayrılmış SÖZCÜK sınırı. Çıplak alt dizge araması "chin"in "machine"
// içinde eşleşmesine yol açıyordu (Machine_Shoulder_Military_Press → arka omuz).
function token(s, re) {
  return new RegExp("(?:^|-)(?:" + re + ")(?:-|$)").test(s);
}
const FLY = "fl(?:y|ye|ies)s?";

function deltHead(exId) {
  const s = normId(exId);

  // 1) ARKA — en özgül desenler önce.
  //    "rear" sözcüğü rear-delt / rear-lateral / rear-delt-row hepsini yakalar.
  if (token(s, "rear")) return "arkaDeltoid";
  if (/face-pull|pull-apart|external-rotation|to-neck/.test(s)) return "arkaDeltoid";
  if (/back-fl|ters-fl/.test(s)) return "arkaDeltoid";
  // "reverse" tek başına ters lunge/crunch/curl'ü de yakalardı; fly şartı gerek.
  if (token(s, "reverse") && new RegExp(FLY).test(s)) return "arkaDeltoid";
  // Öne eğik her kaldırış/açış arka deltoide gider.
  if (/bent-over|bent-arm/.test(s) && new RegExp("lateral|raise|" + FLY).test(s)) return "arkaDeltoid";

  // 2) YAN — omuz düzleminde abdüksiyon.
  if (/lateral|deltoid-raise|side-raise|scaption/.test(s)) return "yanDeltoid";
  if (/upright-row|yan-kaldir|crucifix|iron-cross|power-partials/.test(s)) return "yanDeltoid";

  // 3) ÇEKİŞLER → arka deltoid. Sözcük sınırı şart: "throw" içinde "row",
  //    "pullover" içinde "pull", "machine" içinde "chin" var.
  if (token(s, "rows?|pull|pulls|pull-?ups?|pull-?downs?|chins?|chin-?ups?|barfiks|lat|scapular")) return "arkaDeltoid";

  // 4) Kalan her şey: presler, şınav, fly, öne kaldırış, koparma/silkme.
  return "onDeltoid";
}

// --- Katsayı sapmaları (varsayılan: birincil 1,0 · ikincil 0,5) ---
// Her sapmanın gerekçesi docs/dolayli-hacim.md'de.
// Derin, kalça-baskın diz bükme hareketleri: glute'u DOĞRUDAN çalıştırırlar.
// Plotkin ve ark.: back squat ve hip thrust benzer glute hipertrofisi üretiyor.
// Bu yüzden "squat var ama hip thrust yok → glute eksik" demek yanlış olurdu.
const DEEP_SQUAT = /^(squat|front-squat|goblet-squat|lunge|bulgarian|pistol-squat|step-up|walking-lunge|reverse-lunge)$/i;
const SQUAT = /squat|leg-press|lunge|bulgarian|step-up|hack|goblet|pistol|wall-sit/i;
const HINGE = /deadlift|good-morning|hyperextension|glute-bridge|hip-thrust|nordic|back-extension/i;
// Diz BÜKÜK kalça ekstansiyonu (hip thrust, glute bridge).
//
// Hamstring hem kalçayı açar hem dizi büker. Köprüde diz zaten bükülüdür ve
// kalça açılırken kas İKİ UÇTAN DA kısalır — buna aktif yetersizlik denir:
// kas kısalmış boyda yeterli gerilim üretemez. Bu yüzden hip thrust mükemmel
// bir GLUTE hareketidir ama zayıf bir hamstring hareketidir.
//
// Uygulamanın kendi gerilim verisi de bunu doğruluyor: romanian-deadlift ve
// good-morning "uzun", hip-thrust ve glute-bridge "kisa" etiketli.
const HIP_BRIDGE = /hip-thrust|glute-bridge/i;
// Yan kaldırışta trapez skapulayı yukarı döndürür — SABİTLEYİCİ görevi.
// Upright row'da ise trapez asıl hareketi yapar; ikisi aynı kredi almamalı.
const LATERAL_RAISE = /lateral-raise|cable-lateral|yan-kaldir|side-lateral/i;
// Kalça fleksiyonlu karın hareketleri: rektus femoris (quad'ın bir parçası)
// çalışır ama kısa boyda ve düşük yükle. "Yarım quad seti" saymak, squat'la
// aynı kefeye koymak olurdu.
const HIP_FLEX_CORE = /l-sit|v-up|leg-raise|mountain-climber|flutter|hanging-leg|toe-touches|hollow/i;
// Vücut ağırlığını taşıyan ama eklemin hareket etmediği tutuşlar.
const IZOMETRIK_DESTEK = /^(plank|side-plank|hollow-body-hold|mountain-climber-ab|l-sit)$/i;
const INCLINE = /incline/i;
const CHINUP = /chin-up|barfiks|pull-up|pullup/i;
const PRESS = /press|sinav|pushup|push-up|dips|fly|crossover|pec-deck/i;
// Yüklü TAŞIMA hareketleri. Desen dar tutuldu: "walk" ve "hold" genel olarak
// yazılırsa Barbell_Walking_Lunge ve hollow-body-hold gibi taşıma OLMAYAN
// hareketleri de yakalıyor (yürüyen lunge'ın glute/hamstring katkısı bir ara
// yanlışlıkla sıfırlanmıştı).
const CARRY = /farmer|rickshaw|yoke|suitcase|carry|pinch/i;

// (exId, muscleId, rol) → katsayı. null dönerse varsayılan kullanılır.
function coeffFor(exId, m, isPrimary) {
  const s = String(exId || "");

  // Kürek/deadlift/barfikste ön kol (ve boyun) yalnızca kavrar/sabitler:
  // set başına birkaç saniye ve başarısızlığa uzak — küçük bir doz. Bu yüzden
  // İKİNCİL olduklarında sayılmazlar.
  //
  // DİKKAT: gerekçe "izometrik olduğu için" DEĞİL. İzometrik çalışma gerçekten
  // hipertrofi üretir (Oranchuk ve ark. 2019, sistematik derleme: 6-14 haftada
  // %5,4-23 kesit alanı artışı, şiddetten bağımsız). Belirleyici olan DOZ:
  // süre ve başarısızlığa yakınlık. Farmer's walk'ta kavrama 30-60 sn sürer ve
  // sınırlayıcı faktörün kendisidir — orada ön kol BİRİNCİLdir ve tam sayılır.
  if ((m === "onKol" || m === "boyun") && !isPrimary) return 0;

  // Yüklü taşımalar: bacaklar yükü taşıyor (lokomosyon — küçük uyaran), ama
  // trapez, gövde ve bel yükü tüm süre boyunca tutuyor. Bu gerçek bir izometrik
  // dozdur, sıfırlanamaz; varsayılan 0,5'te bırakılır.
  // "Rickshaw Deadlift" bir TAŞIMA değil, bir deadlift'tir (rickshaw sadece
  // aleti tarif ediyor). HINGE şartı olmadan bacak katkısı 0,25'e düşüyordu.
  if (CARRY.test(s) && !HINGE.test(s) && !isPrimary) {
    if (m === "quad" || m === "hamstring" || m === "glute" || m === "baldir") return 0.25;
  }

  // Squat türevleri: hamstring neredeyse hiç, glute belirgin, karın yok, erektör var
  if (SQUAT.test(s) && !isPrimary) {
    if (m === "hamstring") return 0.15;  // çift bacak squat hamstringde anlamlı hipertrofi üretmiyor
    // Derin squat/lunge glute'u hip thrust kadar büyütüyor → DOĞRUDAN sayılır.
    // Makine/kısa ROM hareketlerinde (leg press, hack) kalça ekstansiyonu sınırlı.
    if (m === "glute") return DEEP_SQUAT.test(s) ? 1 : 0.5;
    if (m === "karin") return 0;         // rektus abdominis aktivitesi %90 1RM'de bile düşük
    if (m === "erektor") return 0.5;     // squat'ta plank'ın 4 katı aktivasyon
    if (m === "baldir") return 0;        // baldır ayak bileğini SABİTLER, boyu değişmez
  }

  // Kalça menteşesi: hamstringi gerçekten yükler (squat'ın tersine).
  // Kalça ekstansiyonu glute'un asıl görevi olduğu için menteşe = DOĞRUDAN glute.
  if (HINGE.test(s) && !isPrimary) {
    if (m === "hamstring") {
      // Diz bükük köprüler: aktif yetersizlik → çeyrek set.
      if (HIP_BRIDGE.test(s)) return 0.25;
      // Diz düz menteşede kas UZUN boyda yükleniyorsa uyaran yüksek
      // (RDL, good morning). Orta/kısa profilde (klasik deadlift,
      // hyperextension) hamstring gerilmesi sınırlı → yarım set.
      const t = tensionOf(s);
      return t && t.p === "uzun" ? 0.7 : 0.5;
    }
    if (m === "glute") return 1;
    if (m === "karin") return 0;
    // Menteşede erektörün işi yük altında omurga fleksiyonuna direnmek —
    // bu, belin ASIL eğitimidir. Ayrıca doğrudan bel hareketi istemek
    // (hyperextension) yanlış pozitif olurdu.
    if (m === "erektor") return 1;
    if (m === "baldir") return 0;
  }

  // Presler
  if (PRESS.test(s) && !isPrimary) {
    if (m === "triceps") return 0.5;                      // yan baş büyüyor, uzun baş büyümüyor
    if (m === "onDeltoid") return INCLINE.test(s) ? 0.6 : 0.5;  // eğimlide pay daha yüksek (tahmin)
    if (m === "yanDeltoid" || m === "arkaDeltoid") return 0;    // preslerde çalışmaz
  }

  // İZOMETRİK DESTEK TUTUŞLARI. Plank ailesinde omuz vücudu taşır ama eklem
  // HAREKET ETMEZ ve kas boyu değişmez — yani tanım gereği sabitleyicidir.
  // Belgedeki kural bunu zaten söylüyordu ("yalnızca sabitliyorsa sayılmaz",
  // bkz. docs/dolayli-hacim.md § 1) ama koda uygulanmamıştı: yan plank ve
  // mountain climber ön omuza yarım set yazıyordu.
  //
  // Ab wheel BİLEREK dışarıda: orada kollar geniş bir yay çiziyor, omuz
  // gerçekten uzayıp kısalıyor. Şınav türevleri de öyle.
  if (IZOMETRIK_DESTEK.test(s) && !isPrimary &&
      (m === "onDeltoid" || m === "yanDeltoid" || m === "arkaDeltoid")) return 0;

  // Yan kaldırış → trapez: sabitleyici dozu, çeyrek set.
  if (LATERAL_RAISE.test(s) && !isPrimary && m === "ustSirt") return 0.25;

  // Kalça fleksiyonlu karın hareketleri → quad: çeyrek set.
  if (HIP_FLEX_CORE.test(s) && !isPrimary && m === "quad") return 0.25;

  // Çekişler → biceps
  if (!isPrimary && m === "biceps") {
    if (CHINUP.test(s)) return 0.6;      // supinasyon + tam ROM (tahmin)
    return 0.5;                          // Mannarino: kürek = curl'ün %47'si
  }

  return null;
}

// Bir hareketin kas grubu dağılımı: { muscleId: katsayı }
// Kapsam exerciseMuscles.js'ten gelir (874/893 hareket).
const CACHE = {};
export function musclesOf(exId) {
  if (CACHE[exId]) return CACHE[exId];
  const out = {};
  const mm = getMuscles(exId);
  const ex = getExercise(exId);

  const add = (rawName, isPrimary) => {
    let m = NAME_TO_MUSCLE[rawName];
    if (!m) return;                                    // Ön Kol / Boyun → hacme girmez
    if (rawName === "Omuz") m = deltHead(exId);
    const c = coeffFor(exId, m, isPrimary);
    const val = c != null ? c : (isPrimary ? 1 : 0.5);
    if (val <= 0) return;
    if (!out[m] || out[m] < val) out[m] = val;          // aynı kas iki kez geçerse büyüğü
  };

  if (mm) {
    (mm.p || []).forEach((n) => add(n, true));
    (mm.s || []).forEach((n) => add(n, false));
  }

  // SON ÇARE. Bugün hiçbir hareket buraya düşmüyor (exerciseMuscles.js'teki
  // MUSCLE_FIXES bloğu eksik 19 hareketi kapatıyor) — test bunu sabitliyor.
  // Yalnızca ileride kas eşlemesi olmayan yeni bir hareket eklenirse devreye
  // girer. Kaba bir tahmindir: nordic-curl'ü quad, single-leg-glute-bridge'i
  // yine quad sayıyordu.
  if (!Object.keys(out).length && ex) {
    const fallback = { gogus: "gogus", sirt: "lat", omuz: "onDeltoid", kol: "triceps", bacak: "quad", karin: "karin" }[ex.region];
    if (fallback) out[fallback] = 1;
  }

  CACHE[exId] = out;
  return out;
}

// --- Hareket değiştirme önerileri ---
//
// NEDEN BURADA: ProgramBuilder'ın kendi listesi yalnız iki şeye bakıyordu —
// elle yazılmış ALTERNATIVES tablosu ve "aynı bölge + aynı alt-grup" etiketi.
// Alt-grup etiketi elle yazıldığı için kas verisiyle çelişebiliyordu ve
// 1276 önerinin 90'ında öneri, hareketin birincil kasını HİÇ çalıştırmıyordu.
// Somut örnek (kullanıcı bildirdi): "Pec Deck yerine → Elmas Şınav".
// Elmas şınavın birincil kası bizim kendi verimizde TRICEPS.
//
// Bu fonksiyon muscles.js'te çünkü kas verisiyle hareket verisini birlikte
// görmesi gerekiyor ve bağımlılık yönü zaten muscles → exercises.
//
// Kural: aday, DEĞİŞTİRİLEN hareketin birincil kasını en az yarım set
// değerinde yüklemeli. Sıralama: aynı kası doğrudan (1,0) çalıştıranlar önce.
export function substitutesFor(exId, usedIds = [], limit = 14) {
  const ex = getExercise(exId);
  if (!ex) return [];
  const used = new Set(usedIds);
  const seen = new Set([exId]);
  const cand = [];
  const push = (e) => {
    if (!e || seen.has(e.id) || used.has(e.id)) return;
    seen.add(e.id); cand.push(e);
  };
  getAlternatives(exId).forEach(push);
  const sub = subOf(ex);
  exercisesByRegion(ex.region).filter((e) => subOf(e) === sub).forEach(push);

  const hedef = Object.keys(musclesOf(exId)).filter((m) => musclesOf(exId)[m] >= 1);
  if (!hedef.length) return cand.slice(0, limit);   // kas verisi yoksa eski davranış

  // 2 = aynı kası doğrudan çalıştırıyor · 1 = yarım set değerinde yüklüyor
  const skor = (id) => {
    const mix = musclesOf(id);
    let s = 0;
    hedef.forEach((m) => { const c = mix[m] || 0; if (c >= 1) s = Math.max(s, 2); else if (c >= 0.5) s = Math.max(s, 1); });
    return s;
  };
  return cand
    .map((e, i) => ({ e, s: skor(e.id), i }))
    .filter((x) => x.s > 0)
    .sort((a, b) => (b.s - a.s) || (a.i - b.i))   // skor, sonra özgün sıra (kararlı)
    .map((x) => x.e)
    .slice(0, limit);
}
