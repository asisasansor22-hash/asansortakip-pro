// --- Antrenman geçmişi: sınırsız saklama, sınırlı boyut ---
//
// SORUN: Geçmiş tek parça bir dizi olarak hem cihaza hem Firebase'e yazılıyor.
// Sınırsız büyürse her antrenman sonunda yazılan veri de büyür (mobil veriden
// yüzlerce KB). Eski çözüm son 60 seansı tutup gerisini SİLMEKTİ — ama rekorlar,
// rozetler, toplam antrenman sayısı ve tonaj hep bu diziden hesaplandığı için
// 61. antrenmandan sonra kullanıcı kazandığı rozeti geri kaybedebiliyordu.
//
// ÇÖZÜM: Silme yok, SIKIŞTIRMA var.
//   • Son MAX_FULL seans TAM detayla durur (grafikler, hareket bazlı geçmiş,
//     RIR, notlar — hepsi çalışır).
//   • Daha eskiler ARŞİV satırına iner: tarih, program adı, set sayısı, tonaj
//     ve harekete göre en iyi tahmini 1RM. ~10 kat küçük.
//
// Böylece kalıcı olarak korunanlar: toplam antrenman sayısı, toplam set, toplam
// tonaj, seri (streak), rozetler ve kişisel rekorlar.
// Kaybolan tek şey çok eski seansların set-set dökümü (RIR/not) — 100 seans
// haftada 4 antrenmanda ~6 aylık detay demek, grafikler için fazlasıyla yeterli.

export const MAX_FULL = 100;     // tam detay tutulan seans sayısı
export const MAX_ARCHIVE = 900;  // özet olarak tutulan seans sayısı

const firstInt = (v) => { const m = String(v || "").match(/\d+/); return m ? parseInt(m[0], 10) : 0; };

// Epley: tahmini 1 tekrar maksimum
const est1RM = (w, r) => Math.round(w * (1 + r / 30));

export function isArchived(s) { return !!(s && s.arch); }

// Tam seansı özet (arşiv) satırına indir.
// { date, program, arch:1, n:<set>, vol:<kg>, prs:{ exId: e1rm } }
export function toArchive(s) {
  const sets = Array.isArray(s.sets) ? s.sets : [];
  let vol = 0;
  const prs = {};
  sets.forEach((st) => {
    const w = Number(st.weight) || 0;
    const r = firstInt(st.reps);
    vol += w * r;
    if (w > 0 && r > 0 && st.exId) {
      const e = est1RM(w, r);
      if (!prs[st.exId] || e > prs[st.exId]) prs[st.exId] = e;
    }
  });
  const out = { date: s.date, arch: 1, n: sets.length, vol: Math.round(vol) };
  if (s.program) out.program = s.program;
  // Firebase boş objeleri saklamaz; ağırlıksız seansta prs hiç yazılmasın.
  if (Object.keys(prs).length) out.prs = prs;
  return out;
}

// Geçmişi sınırlar içinde tut: en yeniler tam, eskiler arşiv.
// Dizi her zaman yeni→eski sıralı döner.
export function compactHistory(list) {
  const arr = (Array.isArray(list) ? list : []).filter(Boolean);
  arr.sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
  const out = [];
  for (let i = 0; i < arr.length && out.length < MAX_FULL + MAX_ARCHIVE; i++) {
    out.push(i < MAX_FULL ? arr[i] : (isArchived(arr[i]) ? arr[i] : toArchive(arr[i])));
  }
  return out;
}

// --- Her iki biçimi de okuyan yardımcılar ---
// Bu üçü sayesinde çağıran kod "arşiv mi tam mı" diye bilmek zorunda kalmaz.

export function setCountOf(s) {
  if (isArchived(s)) return Number(s.n) || 0;
  return Array.isArray(s.sets) ? s.sets.length : 0;
}

export function volumeOf(s) {
  if (isArchived(s)) return Number(s.vol) || 0;
  let v = 0;
  (Array.isArray(s.sets) ? s.sets : []).forEach((st) => {
    v += (Number(st.weight) || 0) * firstInt(st.reps);
  });
  return v;
}

// Seansın harekete göre en iyi tahmini 1RM'i → { exId: e1rm }
export function bestOf(s) {
  if (isArchived(s)) return s.prs && typeof s.prs === "object" ? s.prs : {};
  const best = {};
  (Array.isArray(s.sets) ? s.sets : []).forEach((st) => {
    const w = Number(st.weight) || 0;
    const r = firstInt(st.reps);
    if (!w || !r || !st.exId) return;
    const e = est1RM(w, r);
    if (!best[st.exId] || e > best[st.exId]) best[st.exId] = e;
  });
  return best;
}

// Tüm geçmişin toplamları (arşiv dahil)
export function totalsOf(history) {
  const list = Array.isArray(history) ? history : [];
  let sets = 0, vol = 0;
  list.forEach((s) => { sets += setCountOf(s); vol += volumeOf(s); });
  return { sessions: list.length, sets, vol: Math.round(vol) };
}
