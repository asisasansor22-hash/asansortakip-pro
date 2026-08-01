// --- Haftalık kas grubu hacmi (set/kas) hesabı ---
// Hem hazır programlarda hem "Programım"da aynı hesap kullanılır; hareket
// eklenip çıkarıldıkça özet anında güncellenir.
//
// Kural: hipertrofi için kas başına haftada ~10-20 set etkili aralıktır
// (Schoenfeld/Krieger doz-yanıt meta-analizleri). 10 set etkili ALT sınırdır.
//
// DOĞRUDAN ve DOLAYLI AYRIMI — bu modülün en önemli kısmı:
// Bileşik hareketler yardımcı kaslara da yük bindirir (kürek → biceps,
// bench press → triceps). Bu katkı sayılır ama YARIM set olarak. Dayanak:
//   • Pelland ve ark., Sports Medicine 2026;56(2):481-505 — 67 çalışma,
//     2058 katılımcı. Dolaylı seti 1 / 0,5 / 0 sayan üç yöntem karşılaştırıldı;
//     kas gelişimini en iyi açıklayan 0,5 oldu.
//   • Mannarino ve ark. 2019 (JSCR) — aynı kişide bir kol kürek, öbür kol curl,
//     8 hafta: curl +%11,06, kürek +%5,16. Kürek gerçekten curl'ün yarısı kadar.
//
// AMA bu bir ÖLÇÜM yöntemidir, program TASARIM kuralı değil. Bir bölge sıfır
// doğrudan çalışmayla eşiğe ulaşabiliyordu ve ekran bunu "ideal" (yeşil)
// gösteriyordu. Neden kabul edilemez olduğu da ölçülmüş: triceps'in uzun başı
// omuz gerideyken (yani preslerde) kısalmış durumda ve neredeyse yüklenmiyor
// (Maeo ve ark., EJSS: baş üstü uzatma +%28,5, pushdown +%19,6, p<0,001).
// Bu yüzden aşağıda DIRECT_MIN alt sınırı ve "thin" seviyesi var.

import { getExercise, REGIONS } from "./exercises";
import { MUSCLES, MUSCLE_IDS, musclesOf, muscleMinFor, muscleMaxFor, MUSCLE_MAX_DEFAULT, OPTIONAL } from "./muscles";

export const TARGET_MIN = 10;
export const TARGET_MAX = 20;

// Bölgeye özel alt eşik. Karın istisnadır: squat, deadlift, baş üstü pres gibi
// bileşiklerde gövde stabilizasyonu için yoğun izometrik yük alır, bu yüzden
// DOĞRUDAN set ihtiyacı diğer bölgelerden düşüktür. Ayrıca 10-20 set aralığının
// kanıtı ağırlıklı olarak uzuv/gövde kaslarından gelir; karın için veri incedir.
const REGION_MIN = { karin: 6 };
export function minFor(regionId) {
  return REGION_MIN[regionId] != null ? REGION_MIN[regionId] : TARGET_MIN;
}

// Bölgeye özel ÜST sınır. "kol" istisnadır: tek kovada iki bağımsız kas
// (biceps + triceps) tutuyor, bu yüzden 20'lik ortak tavan yaklaşık yarı yarıya
// düşük kalıyor ve makul programlar (PPL, Upper/Lower) haksız yere "yüksek"
// görünüyordu. Doğru çözüm kolu iki bölgeye ayırmak; o REGIONS'a, hareket
// taramaya, filtrelere ve İlerleme ekranına dokunduğu için ayrı bir iş.
// 26 bir tahmindir, ölçülmüş bir tavan değil.
const REGION_MAX = { kol: 26 };
export function maxFor(regionId) {
  return REGION_MAX[regionId] != null ? REGION_MAX[regionId] : TARGET_MAX;
}

// Haftada gereken en az DOĞRUDAN set. Dolaylı katkı buraya sayılmaz.
//
// ⚠️ Bu sayılar MÜHENDİSLİK KARARIDIR, ölçülmüş eşik değil. Hiçbir çalışma
// "en az şu kadar doğrudan set" demiyor. Gerekçe: hem "kol" hem "omuz" tek
// kovada birden fazla bağımsız kas tutuyor ve dolaylı yük bunların yalnız
// birine geliyor (preslerde ön deltoid çalışır, yan/arka deltoid çalışmaz;
// preslerde triceps'in uzun başı yüklenmez). 6 = kas başına haftada bir
// çalışma hareketi (3+3) — alt sınırı karşılayan EN KÜÇÜK sayı.
//
// Diğer bölgeler girdi almaz: karın zaten REGION_MIN ile indirim alıyor
// (üstüne bir de talep koymak aynı gerekçeyi iki kez uygulamak olur), göğüs/
// sırt/bacakta ise dolaylı katkı çok küçük olduğu için doğrudan ≈ toplam.
const DIRECT_MIN = { kol: 6, omuz: 6 };
export function directMinFor(regionId) {
  return DIRECT_MIN[regionId] != null ? DIRECT_MIN[regionId] : minFor(regionId);
}

// "4 x 8-10" → 4 ; eşleşmezse null
export function parseSetCount(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  return m ? { n: parseInt(m[1], 10), reps: m[2].trim() } : null;
}

// Bir programdaki hareketin set sayısı: programda özel ayar varsa o,
// yoksa hareketin kendi varsayılanı, o da yoksa 3.
export function setsOf(program, exId) {
  if (program && program.sets && program.sets[exId] != null) return Number(program.sets[exId]) || 0;
  const ex = getExercise(exId);
  const p = ex ? parseSetCount(ex.sets) : null;
  return p ? p.n : 3;
}

// Bileşik hareketlerin yardımcı kaslara kattığı DOLAYLI hacim.
// Pres hareketleri triceps/ön omuza, çekişler biceps'e anlamlı yük bindirir;
// yaygın uygulamaya uygun olarak doğrudan setin yarısı sayılır.
const INDIRECT_BY_ID = {
  // göğüs presleri → omuz + kol (triceps)
  "bench-press": { omuz: 0.5, kol: 0.5 },
  "incline-press": { omuz: 0.5, kol: 0.5 },
  "decline-press": { omuz: 0.5, kol: 0.5 },
  "dumbbell-press": { omuz: 0.5, kol: 0.5 },
  "incline-dumbbell-press": { omuz: 0.5, kol: 0.5 },
  "machine-chest-press": { omuz: 0.5, kol: 0.5 },
  "close-grip-bench": { gogus: 0.5, omuz: 0.5 },
  "sinav": { omuz: 0.5, kol: 0.5 },
  "wide-pushup": { omuz: 0.5, kol: 0.5 },
  "diamond-pushup": { omuz: 0.5, kol: 0.5 },
  "decline-pushup": { omuz: 0.5, kol: 0.5 },
  "chest-dips": { omuz: 0.5, kol: 0.5 },
  "triceps-dips": { gogus: 0.5, omuz: 0.5 },
  // omuz presleri → kol (triceps)
  "shoulder-press": { kol: 0.5 },
  "military-press": { kol: 0.5 },
  "arnold-press": { kol: 0.5 },
  "pike-pushup": { kol: 0.5 },
  "handstand-pushup": { kol: 0.5 },
  // çekişler → kol (biceps)
  "barfiks": { kol: 0.5 },
  "chin-up": { kol: 0.5 },
  "negative-pullup": { kol: 0.5 },
  "lat-pulldown": { kol: 0.5 },
  "barbell-row": { kol: 0.5 },
  "seated-row": { kol: 0.5 },
  "dumbbell-row": { kol: 0.5 },
  "t-bar-row": { kol: 0.5 },
  "inverted-row": { kol: 0.5 },
  "face-pull": { kol: 0.25 },
  // menteşe → bacak (arka zincir)
  // NOT: romanian-deadlift ve good-morning'in kendi region'ı "sirt". Eskiden
  // burada { sirt: 0.25 } yazıyordu, yani KENDİ bölgelerine ikinci kez kredi
  // veriyorlardı ve her RDL 3,75-5 sırt seti sayılıyordu. İkisi de hamstring/
  // kalça hareketi olduğu için katkı bacağa yazılır. (region'larının "sirt"
  // olması ayrı bir sorun; düzeltmek tüm uygulamada sayı oynatır.)
  "deadlift": { bacak: 0.5 },
  "romanian-deadlift": { bacak: 0.5 },
  "good-morning": { bacak: 0.5 },
  "hyperextension": { bacak: 0.25 },
  // squat türevleri → core
  "squat": { karin: 0.25 },
  "front-squat": { karin: 0.25 },
  "bulgarian": { karin: 0.25 },
  "lunge": { karin: 0.25 },
};

// Hacim çekirdeği. items: [{ id, sets }] — hareket id'si ve set sayısı.
// Dönüş: { direct, indirect, total } — her biri { bölge: sayı }.
//
// DOĞRUDAN ve DOLAYLI AYRI TUTULUR. Eskiden ikisi tek kovaya toplanıyordu ve
// bilgi geri döndürülemez şekilde kayboluyordu; bu yüzden ekran "13,5 set"
// derken bunun tamamının dolaylı olduğunu söyleyemiyordu.
//
// autoPlan.js ve (ileride) İlerleme ekranı da bunu kullanır — tek uygulama,
// tek doğru. Eskiden autoPlan'ın kendi ayrı ve UYUŞMAYAN kopyası vardı.
// KAS GRUBU bazında hesaplar (bölge bazında değil). Bölge çözünürlüğü hacim için
// çok kabaydı: 20 set squat + leg press "Bacak 20 · ideal" gösteriyordu, hamstringe
// hiç dokunmadan. Artık quad ve hamstring ayrı satır.
//
// Katsayı 1 ise DOĞRUDAN, 1'den küçükse DOLAYLI sayılır. Katsayıların dayanağı
// docs/dolayli-hacim.md'de; her biri ya kaynaklı ya da "tahmin" işaretli.
export function volumeOf(items) {
  const direct = {};
  const indirect = {};
  MUSCLE_IDS.forEach((m) => { direct[m] = 0; indirect[m] = 0; });

  (items || []).forEach((it) => {
    if (!it) return;
    const ex = getExercise(it.id);
    if (!ex || ex.region === "kardiyo") return;
    const n = Number(it.sets) || 0;
    if (!n) return;
    const mix = musclesOf(it.id);
    Object.keys(mix).forEach((m) => {
      if (direct[m] === undefined) return;
      const c = mix[m];
      if (c >= 1) direct[m] += n;
      else indirect[m] += n * c;
    });
  });

  const total = {};
  MUSCLE_IDS.forEach((m) => {
    indirect[m] = Math.round(indirect[m] * 2) / 2;
    total[m] = direct[m] + indirect[m];
  });
  return { direct, indirect, total };
}

// Bir veya birden çok "gün"ün haftalık hacmi.
// days: [{exercises:[id], sets:{id:n}}, ...] — tek program da dizi içinde verilebilir.
export function weeklyVolume(days) {
  const items = [];
  (days || []).forEach((d) => {
    (d && d.exercises ? d.exercises : []).forEach((exId) => {
      items.push({ id: exId, sets: setsOf(d, exId) });
    });
  });
  return volumeOf(items);
}

// Görüntüleme için satırlar — artık KAS GRUBU başına.
// level:
//   "none" — hiç çalışılmıyor
//   "low"  — toplam eşiğin altında
//   "thin" — toplam yeterli AMA hiç doğrudan set yok (tamamı dolaylı)
//   "high" — toplam üst sınırın üstünde
//   "ok"   — iyi
//
// SIRA ÖNEMLİ: "thin" mutlaka "low"dan SONRA değerlendirilir, yani yalnızca
// aksi hâlde "ok"/"high" görünecek bir satırı düşürebilir.
//
// NOT: Kas grubuna inince eski "doğrudan set alt sınırı" (kol için 6) gereksizleşti.
// O kural, kova biceps ile triceps'i ayırmadığı için gerekiyordu. Artık ayırıyor:
// biceps'e yalnız kürekle ulaşmak 20 set kürek gerektirir, yani eşik kendiliğinden
// doğrudan çalışmayı zorluyor. Geriye yalnızca "hiç doğrudan set yok" uyarısı kalıyor.
export function volumeRows(days) {
  const { direct, indirect, total } = weeklyVolume(days);
  return MUSCLES.map((m) => {
    const d = direct[m.id] || 0;
    const ind = indirect[m.id] || 0;
    const sets = total[m.id] || 0;
    const min = muscleMinFor(m.id);
    // İsteğe bağlı kaslar (ön kol, boyun) "az"/"dolaylı" uyarısı ÜRETMEZ:
    // doz-yanıt verisi yok ve çoğu program bunları hiç çalıştırmaz.
    const opt = OPTIONAL.has(m.id);
    const level = sets === 0 ? "none"
      : (!opt && sets < min) ? "low"
      : (!opt && d === 0) ? "thin"
      : sets > muscleMaxFor(m.id) ? "high"
      : "ok";
    return { id: m.id, name: m.name, emoji: m.emoji, region: m.region,
             direct: d, indirect: ind, sets, min, directMin: min, level };
  });
}
