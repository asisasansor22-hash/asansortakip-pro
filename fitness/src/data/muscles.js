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

import { getExercise } from "./exercises";
import { getMuscles } from "./exerciseMuscles";

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
];

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
  // "Ön Kol" ve "Boyun" — bilerek yok
};

// Kaynak veri omzu tek isim olarak tutuyor ("Omuz"). Ön/yan/arka ayrımını
// hareketin kendisinden türetiyoruz. Küratörlü eşleme; kenar durumlarda
// hatalı olabilir (bkz. docs/dolayli-hacim.md · Bölüm 4).
function deltHead(exId, name) {
  const s = String(exId || "").toLowerCase();
  if (/lateral|yan-kaldir|upright-row/.test(s)) return "yanDeltoid";
  if (/rear-delt|face-pull|reverse-fly|ters-fly/.test(s)) return "arkaDeltoid";
  if (/row|pull|chin|barfiks|lat-|scapular/.test(s)) return "arkaDeltoid"; // çekişler arka deltoidi yükler
  return "onDeltoid"; // presler, şınav, fly
}

// --- Katsayı sapmaları (varsayılan: birincil 1,0 · ikincil 0,5) ---
// Her sapmanın gerekçesi docs/dolayli-hacim.md'de.
// Derin, kalça-baskın diz bükme hareketleri: glute'u DOĞRUDAN çalıştırırlar.
// Plotkin ve ark.: back squat ve hip thrust benzer glute hipertrofisi üretiyor.
// Bu yüzden "squat var ama hip thrust yok → glute eksik" demek yanlış olurdu.
const DEEP_SQUAT = /^(squat|front-squat|goblet-squat|lunge|bulgarian|pistol-squat|step-up|walking-lunge|reverse-lunge)$/i;
const SQUAT = /squat|leg-press|lunge|bulgarian|step-up|hack|goblet|pistol|wall-sit/i;
const HINGE = /deadlift|good-morning|hyperextension|glute-bridge|hip-thrust|nordic|back-extension/i;
const INCLINE = /incline/i;
const CHINUP = /chin-up|barfiks|pull-up|pullup/i;
const PRESS = /press|sinav|pushup|push-up|dips|fly|crossover|pec-deck/i;

// (exId, muscleId, rol) → katsayı. null dönerse varsayılan kullanılır.
function coeffFor(exId, m, isPrimary) {
  const s = String(exId || "");

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
    if (m === "hamstring") return 0.7;   // yüksek aktivasyon ama kalça-baskın (kısmen tahmin)
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
    if (rawName === "Omuz") m = deltHead(exId, rawName);
    const c = coeffFor(exId, m, isPrimary);
    const val = c != null ? c : (isPrimary ? 1 : 0.5);
    if (val <= 0) return;
    if (!out[m] || out[m] < val) out[m] = val;          // aynı kas iki kez geçerse büyüğü
  };

  if (mm) {
    (mm.p || []).forEach((n) => add(n, true));
    (mm.s || []).forEach((n) => add(n, false));
  }

  // Kas tablosunda karşılığı olmayan ~19 hareket (çoğu vücut ağırlığı) için
  // bölgeden tek bir kas grubuna düş. Kaba ama sıfırdan iyi.
  if (!Object.keys(out).length && ex) {
    const fallback = { gogus: "gogus", sirt: "lat", omuz: "onDeltoid", kol: "triceps", bacak: "quad", karin: "karin" }[ex.region];
    if (fallback) out[fallback] = 1;
  }

  CACHE[exId] = out;
  return out;
}
