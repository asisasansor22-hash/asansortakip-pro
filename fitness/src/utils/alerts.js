// --- Dinlenme bitti uyarıları: titreşim + ses + bildirim + ekran uyanık tutma ---
//
// PWA sınırı (dürüst not): Telefon TAMAMEN kilitliyken tarayıcı JavaScript'i
// askıya alır; o durumda zamanlayıcı ateşlenmeyebilir. Gerçek arka plan
// bildirimi için sunucudan Web Push gerekir — 60 saniyelik bir sayaç için
// aşırı karmaşık ve güvenilmez. Bunun yerine:
//   1) Antrenman boyunca EKRANI AÇIK TUTUYORUZ (Screen Wake Lock) → sayaç
//      kesintisiz çalışır, telefon sehpanın üstündeyken uyarı garanti gelir.
//   2) Uygulama arka plana alınıp geri gelirse, süre ZAMAN DAMGASINDAN
//      hesaplandığı için kaçan uyarı dönüşte hemen verilir.
//   3) Ses + titreşim + bildirim birlikte tetiklenir.

const LS_SOUND = "fitbe_alert_sound";
const LS_NOTIF = "fitbe_alert_notif";

export function soundOn() {
  try { return localStorage.getItem(LS_SOUND) !== "0"; } catch (e) { return true; }
}
export function setSoundOn(v) {
  try { localStorage.setItem(LS_SOUND, v ? "1" : "0"); } catch (e) {}
}
export function notifOn() {
  try { return localStorage.getItem(LS_NOTIF) === "1"; } catch (e) { return false; }
}
export function setNotifOn(v) {
  try { localStorage.setItem(LS_NOTIF, v ? "1" : "0"); } catch (e) {}
}

export function notifSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}
export function notifPermission() {
  return notifSupported() ? Notification.permission : "unsupported";
}

// İzin iste (kullanıcı hareketiyle çağrılmalı — iOS şartı).
// iOS'ta yalnızca ANA EKRANA EKLENMİŞ PWA'da çalışır.
export async function requestNotif() {
  if (!notifSupported()) return "unsupported";
  try {
    const p = await Notification.requestPermission();
    setNotifOn(p === "granted");
    return p;
  } catch (e) { return "denied"; }
}

// --- Ses: kısa çift bip (Web Audio; dosya indirmeye gerek yok) ---
let ctx = null;
function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch (e) {}
  return ctx;
}
// iOS ses motorunu ancak kullanıcı hareketiyle başlatır — antrenman
// başlarken bir kez çağrılır, sonrasında sayaç bittiğinde ses çıkabilir.
export function primeAudio() {
  const c = audioCtx();
  if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} }
}

function beep(freq, startAt, dur) {
  const c = audioCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // Yumuşak giriş/çıkış — "tık" sesi olmasın
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(startAt); osc.stop(startAt + dur + 0.02);
}

export function playRestDone() {
  if (!soundOn()) return;
  const c = audioCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") c.resume();
    const t = c.currentTime;
    beep(880, t, 0.16);         // ilk bip
    beep(1320, t + 0.22, 0.22); // ikinci, daha tiz → "hazır ol"
  } catch (e) {}
}

export function vibrateRestDone() {
  try { if (navigator.vibrate) navigator.vibrate([160, 70, 160, 70, 260]); } catch (e) {}
}

// Bildirim göster. Servis çalışanı varsa onun üzerinden (kilit ekranında da
// görünür), yoksa doğrudan Notification ile.
export async function showRestDone(exName) {
  if (!notifOn() || notifPermission() !== "granted") return;
  const title = "⏱️ Dinlenme bitti";
  const body = exName ? exName + " — sıradaki sete hazırlan" : "Sıradaki sete hazırlan";
  const opts = {
    body, tag: "gymo-rest", renotify: true,
    icon: "/pwa-192.png", badge: "/pwa-192.png",
    vibrate: [160, 70, 160], silent: false,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) { await reg.showNotification(title, opts); return; }
    }
    new Notification(title, opts);
  } catch (e) {}
}

// Antrenman günü hatırlatması (bkz. utils/reminder.js).
// Dinlenme bildirimiyle aynı izni kullanır ama farklı "tag" taşır ki
// biri diğerinin yerini almasın.
export async function showWorkoutReminder(programName) {
  if (!notifOn() || notifPermission() !== "granted") return;
  const title = "🏋️ Bugün antrenman günün";
  const body = programName ? programName + " seni bekliyor" : "Planındaki antrenmanı yapmayı unutma";
  const opts = {
    body, tag: "gymo-workout-day", renotify: false,
    icon: "/pwa-192.png", badge: "/pwa-192.png",
    vibrate: [120, 60, 120], silent: false,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) { await reg.showNotification(title, opts); return; }
    }
    new Notification(title, opts);
  } catch (e) {}
}

// Hepsi birden
export function alertRestDone(exName) {
  vibrateRestDone();
  playRestDone();
  showRestDone(exName);
}

// --- Ekran uyanık tutma (antrenman boyunca) ---
let wakeLock = null;
export async function keepAwake() {
  try {
    if (!("wakeLock" in navigator)) return false;
    wakeLock = await navigator.wakeLock.request("screen");
    // Uygulama arka plana alınıp geri gelince kilit düşer — yeniden al
    document.addEventListener("visibilitychange", reacquire);
    return true;
  } catch (e) { return false; }
}
async function reacquire() {
  if (document.visibilityState !== "visible") return;
  try {
    if (!wakeLock || wakeLock.released) wakeLock = await navigator.wakeLock.request("screen");
  } catch (e) {}
}
export function releaseAwake() {
  try { document.removeEventListener("visibilitychange", reacquire); } catch (e) {}
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
}
