// --- Deload & yorgunluk radarı ---
// Antrenman geçmişindeki hacim ve RIR verisinden birikmiş yorgunluğu tahmin
// eder ve gerektiğinde bir "deload" (hafifletme) haftası önerir.
//
// Dayanak: Sürekli yüklenme altında performans bir noktadan sonra düşer
// (overreaching). Klasik belirtiler: aynı yükte zorlanmanın artması (RIR'ın
// düşmesi), hacmin/performansın gerilemesi ve uzun süre hafif hafta yapılmaması.
// Öneri: 1 hafta boyunca SET SAYISINI ~%40-50 azalt, AĞIRLIĞI koru ve setleri
// başarısızlıktan uzak (RIR 3-4) bitir — böylece uyum korunurken yorgunluk iner.

const DAY = 86400000;

export function weekStart(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Pazartesi = 0
  d.setDate(d.getDate() - day);
  return d.getTime();
}

const firstInt = (s) => { const m = String(s || "").match(/\d+/); return m ? parseInt(m[0], 10) : null; };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// Geçmişi haftalara böl: en eskiden yeniye, son `n` hafta (boş haftalar dahil).
export function weeklyStats(history, n = 8) {
  const now = weekStart(Date.now());
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) weeks.push({ ws: now - i * 7 * DAY, sets: 0, vol: 0, sessions: 0, rirs: [] });
  const idx = {};
  weeks.forEach((w, i) => { idx[w.ws] = i; });

  (history || []).forEach((s) => {
    const k = idx[weekStart(s.date)];
    if (k == null) return;
    const w = weeks[k];
    w.sessions += 1;
    (s.sets || []).forEach((st) => {
      w.sets += 1;
      const kg = Number(st.weight) || 0;
      const r = firstInt(st.reps) || 0;
      w.vol += kg * r;
      if (st.rir !== null && st.rir !== undefined && st.rir !== "") {
        const v = Number(st.rir);
        if (!isNaN(v)) w.rirs.push(v);
      }
    });
  });

  return weeks.map((w) => ({ ws: w.ws, sets: w.sets, vol: Math.round(w.vol), sessions: w.sessions, rir: avg(w.rirs), rirN: w.rirs.length }));
}

// Yorgunluk değerlendirmesi.
// Dönüş: { level, score, reasons[], tips[], weeks, blockWeeks, hasData }
//   level: "none" (veri yok) | "ok" | "watch" (izle) | "deload" (hafifle)
export function assessFatigue(history) {
  const weeks = weeklyStats(history, 8);
  const active = weeks.filter((w) => w.sessions > 0);

  // En az 3 antrenman yapılmış hafta olmadan anlamlı yorum yapılamaz.
  if (active.length < 3) {
    return { level: "none", score: 0, reasons: [], tips: [], weeks, blockWeeks: 0, hasData: false };
  }

  // Bu hafta henüz sürüyor; trendleri TAMAMLANMIŞ haftalar üzerinden kur.
  const done = weeks.slice(0, weeks.length - 1);
  const reasons = [];
  let score = 0;

  // Referans: antrenman yapılan haftaların medyan set sayısı
  const activeSets = done.filter((w) => w.sessions > 0).map((w) => w.sets).sort((a, b) => a - b);
  const medSets = activeSets.length ? activeSets[Math.floor(activeSets.length / 2)] : 0;

  // A · Kesintisiz blok: hafif hafta (medyanın %60'ından az) olmadan geçen
  // ardışık antrenman haftası sayısı. 6+ hafta → planlı deload zamanı.
  let blockWeeks = 0;
  for (let i = done.length - 1; i >= 0; i--) {
    const w = done[i];
    if (w.sessions === 0) break;
    if (medSets > 0 && w.sets < medSets * 0.6) break; // zaten hafif geçmiş
    blockWeeks++;
  }
  if (blockWeeks >= 6) { score += 2; reasons.push(blockWeeks + " haftadır hafif hafta yapmadan aralıksız çalışıyorsun."); }
  else if (blockWeeks >= 4) { score += 1; reasons.push(blockWeeks + " haftadır aralıksız çalışıyorsun."); }

  // B · Hacim gerilemesi: son 2 tamamlanmış hafta, ondan önceki 2 haftaya göre
  // belirgin düşükse performans düşüyor demektir.
  if (done.length >= 4) {
    const last2 = avg(done.slice(-2).map((w) => w.vol));
    const prev2 = avg(done.slice(-4, -2).map((w) => w.vol));
    if (prev2 > 0 && last2 !== null && last2 < prev2 * 0.9) {
      score += 2;
      reasons.push("Toplam hacmin son 2 haftada %" + Math.round((1 - last2 / prev2) * 100) + " geriledi.");
    }
  }

  // C · RIR düşüşü: aynı işi yaparken setleri başarısızlığa daha yakın bitiriyorsan
  // (RIR düşüyorsa) yorgunluk birikiyor demektir.
  const rirWeeks = done.filter((w) => w.rirN >= 3);
  if (rirWeeks.length >= 4) {
    const lastR = avg(rirWeeks.slice(-2).map((w) => w.rir));
    const prevR = avg(rirWeeks.slice(-4, -2).map((w) => w.rir));
    // 0.7 tekrarlık eşik: normal dalgalanmayı gerçek düşüşten ayırır.
    if (lastR !== null && prevR !== null && lastR < prevR - 0.7) {
      score += 2;
      reasons.push("Setleri eskisine göre başarısızlığa daha yakın bitiriyorsun (RIR " + prevR.toFixed(1) + " → " + lastR.toFixed(1) + ").");
    }
  }

  // D · Ani hacim sıçraması: son tamamlanmış hafta medyanın %135'inin üstündeyse
  // toparlanma kapasitesini zorluyor olabilirsin.
  const lastDone = done[done.length - 1];
  if (medSets >= 8 && lastDone && lastDone.sets > medSets * 1.35) {
    score += 1;
    reasons.push("Geçen hafta her zamankinden belirgin fazla set yaptın (" + lastDone.sets + " set).");
  }

  const level = score >= 4 ? "deload" : score >= 2 ? "watch" : "ok";

  const tips = level === "deload"
    ? [
        "Bu hafta set sayısını ~%50 azalt (ör. 4 set yerine 2).",
        "Ağırlığı DÜŞÜRME — uyumu korumak için yük aynı kalsın.",
        "Setleri RIR 3-4'te bitir; başarısızlığa gitme.",
        "Uyku ve protein alımını bu hafta önceliklendir.",
      ]
    : level === "watch"
      ? [
          "Hacmi bu hafta artırma; mevcut seviyede kal.",
          "Setleri RIR 2-3'te bitir, başarısızlık setlerini azalt.",
          "Belirti sürerse gelecek hafta hafif (deload) hafta planla.",
        ]
      : [
          "Aşamalı yüklenmeye devam: kilo veya tekrarı küçük adımlarla artır.",
          "Her 6-8 haftada bir hafif hafta planlamak toparlanmayı korur.",
        ];

  return { level, score, reasons, tips, weeks, blockWeeks, hasData: true };
}
