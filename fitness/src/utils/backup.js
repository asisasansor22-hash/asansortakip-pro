// --- Veri yedekleme: dışa aktar / geri yükle ---
//
// Neden gerekli: tüm veri tek bir Firebase hesabına bağlı. Hesaba erişim
// giderse (şifre unutuldu, hesap silindi, proje taşındı) yıllarca biriken
// antrenman geçmişi de gider. Tek dosyalık JSON yedeği bunu ortadan kaldırır:
// kullanıcı istediği zaman indirir, istediği cihaza geri yükler.
//
// Yedek DÜZ METİN JSON'dur — kullanıcı içini açıp okuyabilir, başka bir araca
// aktarabilir. Şifre/token gibi gizli hiçbir şey içermez.

export const BACKUP_VERSION = 1;

// Yedeklenecek alanlar. Buraya yeni bir alan eklendiğinde geri yükleme de
// otomatik olarak onu taşır (applyBackup aynı listeyi kullanır).
const FIELDS = ["programs", "schedule", "activeId", "history", "progress", "favorites", "profile", "avatar"];

export function buildBackup(state) {
  const out = { app: "GYMO", v: BACKUP_VERSION, at: Date.now() };
  FIELDS.forEach((k) => { if (state[k] !== undefined && state[k] !== null) out[k] = state[k]; });
  return out;
}

// Dosya adı: gymo-yedek-2026-07-26.json
function fileName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return "gymo-yedek-" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + ".json";
}

// Tarayıcıdan dosya indir. iOS Safari'de "İndirilenler"e veya Dosyalar
// uygulamasına kaydedilir.
export function downloadBackup(state) {
  const data = buildBackup(state);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Bazı tarayıcılar indirme başlamadan URL'i serbest bırakınca iptal ediyor
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 2000);
  return data;
}

// Yedek dosyasını doğrula. Yanlış dosya seçilirse veriyi EZMEDEN uyarır.
export function parseBackup(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return { ok: false, error: "Dosya okunamadı — geçerli bir JSON değil." }; }
  if (!d || typeof d !== "object" || Array.isArray(d)) return { ok: false, error: "Dosya biçimi tanınmadı." };
  if (d.app !== "GYMO") return { ok: false, error: "Bu bir GYMO yedeği değil." };
  if (Number(d.v) > BACKUP_VERSION) {
    return { ok: false, error: "Yedek daha yeni bir GYMO sürümünden. Önce uygulamayı güncelle." };
  }
  const hasAny = FIELDS.some((k) => d[k] !== undefined);
  if (!hasAny) return { ok: false, error: "Yedek boş görünüyor." };
  return { ok: true, data: d, summary: summarize(d) };
}

// Geri yüklemeden önce kullanıcıya "ne geliyor" diye gösterilecek özet
export function summarize(d) {
  const n = (a) => (Array.isArray(a) ? a.length : 0);
  return {
    at: d.at || null,
    programs: n(d.programs),
    workouts: n(d.history),
    weights: n(d.progress && d.progress.weights),
    measures: n(d.progress && d.progress.measures),
  };
}

export function fmtBackupDate(t) {
  if (!t) return "";
  try { return new Date(t).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }); }
  catch (e) { return ""; }
}

// Dosya seçiciden okunan File → metin
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Dosya okunamadı."));
    r.readAsText(file);
  });
}

// Yedekten yalnızca TANINAN alanları çıkar (fazlalıkları at).
export function pickFields(d) {
  const out = {};
  FIELDS.forEach((k) => { if (d[k] !== undefined) out[k] = d[k]; });
  return out;
}
