// --- Antrenman günü hatırlatması ---
//
// DÜRÜST SINIR: Sunucusuz bir PWA, uygulama kapalıyken kendi kendine bildirim
// gönderemez. Gerçek arka plan bildirimi için Web Push (sunucu + VAPID anahtarı)
// gerekir. Bu yüzden hatırlatma iki şekilde çalışır:
//
//   1) BİLDİRİM — uygulama açıkken (arka planda sekme/PWA olarak da olur)
//      belirlediğin saatte bildirim düşer.
//   2) UYGULAMA İÇİ ŞERİT — uygulamayı ne zaman açarsan aç, bugün antrenman
//      günün varsa ve henüz yapmadıysan üstte bir şerit çıkar ve doğrudan
//      "Başlat" der. Bu her koşulda çalışır.
//
// Bu yüzden asıl güvenilir kısım (2)'dir; (1) bonustur. Arayüzde de böyle yazar.

const LS_ON = "fitbe_reminder_on";
const LS_TIME = "fitbe_reminder_time";
const LS_FIRED = "fitbe_reminder_fired";       // bildirim bugün gönderildi mi
const LS_DISMISSED = "fitbe_reminder_hidden";  // şerit bugün kapatıldı mı

const DAY = 86400000;
export const DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
export const todayIdx = () => (new Date().getDay() + 6) % 7; // Pzt=0
const dayKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const todayStamp = () => String(dayKey(Date.now()));

const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export function remOn() { return get(LS_ON, "0") === "1"; }
export function setRemOn(v) { set(LS_ON, v ? "1" : "0"); }

export const DEFAULT_TIME = "18:00";
export function remTime() {
  const t = get(LS_TIME, DEFAULT_TIME);
  return /^\d{2}:\d{2}$/.test(t) ? t : DEFAULT_TIME;
}
export function setRemTime(t) { if (/^\d{2}:\d{2}$/.test(t)) set(LS_TIME, t); }

// Gün başına bir kez: damga bugünün tarihi mi?
export function firedToday() { return get(LS_FIRED, "") === todayStamp(); }
export function markFired() { set(LS_FIRED, todayStamp()); }
export function dismissedToday() { return get(LS_DISMISSED, "") === todayStamp(); }
export function markDismissed() { set(LS_DISMISSED, todayStamp()); }

// Bugün antrenman yapıldı mı? (arşivlenmiş seanslar da tarih taşır)
export function trainedToday(history) {
  const t0 = dayKey(Date.now());
  return (history || []).some((s) => dayKey(s.date) === t0);
}

// Hatırlatma saatine kalan süre (ms). Saat geçtiyse negatif döner.
export function msUntilRemTime() {
  const [h, m] = remTime().split(":").map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);
  return t.getTime() - Date.now();
}

// Bugünün durumu — hem şerit hem bildirim bunu kullanır.
export function reminderState({ schedule, programs, history }) {
  const prog = (programs || []).find((p) => p.id === (schedule || {})[todayIdx()]) || null;
  const trained = trainedToday(history);
  return {
    day: DAYS_FULL[todayIdx()],
    program: prog,
    isTrainingDay: !!prog,
    trained,
    // Şerit koşulu: bugün program atanmış, henüz yapılmamış, içinde hareket var
    pending: !!prog && !trained && (prog.exercises || []).length > 0,
  };
}

// Bildirim koşulu: şerit koşulu + saat geldi + bugün henüz gönderilmedi
export function notifDue(state) {
  return state.pending && msUntilRemTime() <= 0 && !firedToday();
}
