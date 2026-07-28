// --- Aşamalı yüklenme (progressive overload) önerisi ---
//
// Eski hâlin dört kusuru vardı (WorkoutMode.jsx içinde gömülüydü):
//   1. Her harekete DÜZ +2,5 kg. 100 kg bench'te %2,5 (makul), 7,5 kg yan
//      kaldırışta %33 — uygulanamaz, kullanıcı öneriyi görmezden gelmeye başlar.
//   2. RIR YOK SAYILIYORDU. Uygulama her sette RIR topluyor ama öneri hiç
//      okumuyordu. RIR 4 ile bitirdiysen "1 tekrar daha" fazla ürkek; RIR 0 ise
//      kiloyu artırmak sakatlık davetiyesi.
//   3. Seansın SON setine demirliyordu (en yorgun set) → çalışma ağırlığını
//      sistematik olarak düşük gösteriyordu.
//   4. Vücut ağırlığı hareketlerinde hiç öneri çıkmıyordu (`!prev.weight` → null).
//
// Dönüş şekli bilerek restFor()'un { sec, why, label } biçimini yansıtır
// (data/rest.js): WorkoutMode zaten "why" alanını soluk açıklama paragrafı
// olarak basıyor, aynı kalıbı kullanıyoruz.

import { exerciseSize } from "./rest";
import { getExercise } from "./exercises";

export const round05 = (kg) => Math.round(kg * 2) / 2;

// Ekipman tipini serbest metin "equip" alanından çıkar.
// ExerciseAnimation.jsx'teki modül-özel gearType'ın dışa açılmış ve
// genişletilmiş hâli. "EZ Bar" hatası düzeltildi: eski sırada son kural
// ("bar") onu pullbar'a düşürüyordu, artık "ez" önce sınanıyor.
export function gearOf(equip) {
  const s = String(equip || "");
  if (!s) return "other";
  if (/ez\s*bar/i.test(s)) return "ezbar";
  if (/halter/i.test(s)) return "barbell";
  if (/dumbbell/i.test(s)) return "dumbbell";
  if (/kablo|makara/i.test(s)) return "cable";
  if (/makine/i.test(s)) return "machine";
  if (/plaka/i.test(s)) return "plate";
  if (/band/i.test(s)) return "band";
  if (/top\b|topu/i.test(s)) return "ball";
  if (/paralel\s*bar/i.test(s)) return "pullbar";
  if (/(^|[^a-zçğıöşü])bar($|[^a-zçğıöşü])/i.test(s)) return "pullbar";
  if (/vücut/i.test(s)) return "bodyweight";
  return "other";
}

// Kilo artışının en küçük anlamlı adımı (kg).
//
// KRİTİK TASARIM KARARI: ekipman "yüklenebilir mi" sorusuna KARAR VERMEZ,
// yalnızca adımın büyüklüğünü belirler. Yüklenebilirliğe karar veren tek şey
// "daha önce bu harekete kilo girilmiş mi" sorusudur. Böylece üretilmiş
// veride ekipmanı "Diğer" olan 244 hareket (kettlebell, esneme, kardiyo, SMR…)
// için kural yazmak gerekmiyor: esnemeye kimse kg girmez, dolayısıyla asla
// kg önerisi almaz. Kendi kendini düzelten, bakım gerektirmeyen kural.
export function minIncrement(exId, prevWeight) {
  if (!(Number(prevWeight) > 0)) return 0; // kilo ile ilerlemiyor
  const ex = getExercise(exId);
  const g = gearOf(ex && ex.equip);
  if (g === "machine" || g === "cable") return 5;
  if (g === "dumbbell") return 2;     // el başına (kaydedilen ağırlık el başına)
  return 2.5;                          // halter, EZ bar, plaka, top, "diğer"
}

export function snapUp(kg, step) {
  const s = step > 0 ? step : 0.5;
  return Math.round(Math.ceil(kg / s) * s * 100) / 100;
}
export function snapDown(kg, step) {
  const s = step > 0 ? step : 0.5;
  return Math.round(Math.floor(kg / s) * s * 100) / 100;
}

const firstInt = (v) => { const m = String(v || "").match(/\d+/); return m ? parseInt(m[0], 10) : null; };

function repRange(reps) {
  const m = String(reps || "").match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { low: parseInt(m[1], 10), high: parseInt(m[2], 10) };
  const one = String(reps || "").match(/\d+/);
  if (one) { const n = parseInt(one[0], 10); return { low: n, high: n }; }
  return null;
}

const isHold = (reps) => /sn|saniye|dk|dakika/i.test(String(reps || ""));

// Bir seansın EN AĞIR seti (eşitlikte en yüksek tekrar).
// Son set değil: son set genelde en yorgun olandır ve çalışma ağırlığını
// olduğundan düşük gösterir.
function topSet(sets) {
  let best = null;
  (Array.isArray(sets) ? sets : []).forEach((s) => {
    const w = Number(s.weight) || 0;
    const r = firstInt(s.reps) || 0;
    if (!best) { best = s; return; }
    const bw = Number(best.weight) || 0;
    const br = firstInt(best.reps) || 0;
    if (w > bw || (w === bw && r > br)) best = s;
  });
  return best;
}

// Hedefin üstündeki oransal artış — küçük kaslar ORANSAL olarak daha büyük
// sıçrama alır çünkü mutlak yükleri küçüktür. clamp, önerinin her zaman en az
// bir kullanılabilir kademe olmasını ve asla hayali olmamasını garanti eder.
const PCT = { large: 0.025, medium: 0.035, small: 0.05 };

/**
 * @param exId       hareket id'si
 * @param targetReps hedef tekrar metni ("8-12", "5", "30-60 sn")
 * @param sessions   bu hareketi içeren son ≤3 seans, yeni→eski,
 *                   her biri { date, sets: [{weight, reps, rir}] }
 * @returns null | { weight: number|null, reps: string, why: string, tone: "up"|"hold"|"down" }
 */
export function overloadSuggestion(exId, targetReps, sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (!list.length) return null;

  const top = topSet(list[0] && list[0].sets);
  if (!top) return null;

  const w = Number(top.weight) || 0;
  const r = firstInt(top.reps);
  const range = repRange(targetReps) || (r ? { low: r, high: r } : null);
  if (!range) return null;

  // --- İzometrik / süreli (plank, wall-sit…) — bugün hiç öneri almıyorlardı
  if (isHold(targetReps)) {
    const cur = r || range.low;
    const next = Math.min(range.high, cur + 5);
    return next > cur
      ? { weight: null, reps: String(next) + " sn", tone: "up", why: "Tutuş süresini 5 saniye uzat." }
      : { weight: null, reps: String(range.high) + " sn", tone: "hold", why: "Hedef süreye ulaştın — daha zor bir varyasyona geç." };
  }

  if (!r) return null;

  // --- Hiç kilo girilmemiş → tekrarla ilerle (vücut ağırlığı, bant, esneme…)
  if (!(w > 0)) {
    if (r < range.high) {
      return { weight: null, reps: String(r + 1), tone: "up", why: "Vücut ağırlığı — tekrar ekleyerek ilerle." };
    }
    return {
      weight: null, reps: String(range.high), tone: "hold",
      why: "Aralığın üstündesin — tempoyu yavaşlat, tepede duraklama ekle ya da daha zor varyasyona geç.",
    };
  }

  const step = minIncrement(exId, w) || 2.5;
  const size = exerciseSize(exId);
  const rir = (top.rir === null || top.rir === undefined || top.rir === "") ? null : Number(top.rir);

  // --- TAKILMA: üst üste iki seans başarısızlığa kadar (RIR 0)
  // data/programs.js'te Türkçe düz metin olarak yazılı ama hiçbir kodun
  // okumadığı politikayı burada çalıştırıyoruz.
  if (rir === 0 && list.length > 1) {
    const prevTop = topSet(list[1] && list[1].sets);
    const prevRir = prevTop && prevTop.rir != null && prevTop.rir !== "" ? Number(prevTop.rir) : null;
    if (prevRir === 0) {
      return {
        weight: snapDown(w * 0.9, step), reps: String(range.low), tone: "down",
        why: "İki seanstır başarısızlığa kadar gidiyorsun. %10 düşüp yeniden tırmanmak, aynı yerde sıkışmaktan hızlıdır.",
      };
    }
  }

  if (rir != null) {
    // Ağırlık belirgin şekilde hafif kalmış → iki kademe
    if (rir >= 3) {
      return {
        weight: snapUp(w + 2 * step, step), reps: String(range.low), tone: "up",
        why: "Son sette RIR " + rir + " — yedekte çok tekrar kalmış, iki kademe artır.",
      };
    }
    // Zorlandın ve aralığın üstüne çıkmadın → sabit kal
    if (rir <= 1 && r < range.high) {
      return {
        weight: w, reps: String(r), tone: "hold",
        why: "Son set zorlandı (RIR " + rir + ") — aynı ağırlıkta tekrarla, form ve hız oturunca ilerle.",
      };
    }
  }

  // --- Normal ilerleme
  if (r < range.high) {
    return {
      weight: w, reps: String(r + 1), tone: "up",
      why: "Aynı ağırlıkta bir tekrar daha. Aralığın üstüne çıkınca kilo artacak.",
    };
  }

  const raw = w * PCT[size];
  const delta = Math.min(2 * step, Math.max(step, raw));
  const next = snapUp(w + delta, step);
  return {
    weight: next, reps: String(range.low), tone: "up",
    why: "Tekrar aralığının üstüne çıktın — +" + round05(next - w) + " kg, tekrarı " + range.low + "'e çek.",
  };
}
