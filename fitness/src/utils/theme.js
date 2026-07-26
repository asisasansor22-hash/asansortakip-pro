// --- Tema: koyu / açık / sistem ---
//
// Seçim <html data-theme="dark|light"> olarak yazılır; renkler index.css'teki
// :root ve :root[data-theme="light"] bloklarından gelir.
//
// DİKKAT: index.html'de aynı işi yapan satır içi bir betik var — o, ilk boyama
// öncesi çalışıp yanlış tema parlamasını (flash) önler. Anahtar adı (LS) ve
// theme-color renkleri iki yerde de AYNI olmalı.

const LS = "fitbe_theme";
const META_DARK = "#0f172a";
const META_LIGHT = "#f1f5f9";

export const MODES = [
  { id: "system", label: "Sistem", emoji: "📱" },
  { id: "dark", label: "Koyu", emoji: "🌙" },
  { id: "light", label: "Açık", emoji: "☀️" },
];

export function themeMode() {
  try {
    const m = localStorage.getItem(LS);
    return MODES.some((x) => x.id === m) ? m : "system";
  } catch (e) { return "system"; }
}

function systemPrefersLight() {
  try { return window.matchMedia("(prefers-color-scheme: light)").matches; } catch (e) { return false; }
}

// Seçilen mod → gerçekte uygulanacak tema
export function resolvedTheme(mode) {
  const m = mode || themeMode();
  if (m === "system") return systemPrefersLight() ? "light" : "dark";
  return m;
}

export function applyTheme(mode) {
  const t = resolvedTheme(mode);
  try {
    document.documentElement.setAttribute("data-theme", t);
    const mt = document.querySelector('meta[name="theme-color"]');
    if (mt) mt.setAttribute("content", t === "light" ? META_LIGHT : META_DARK);
  } catch (e) {}
  return t;
}

export function setThemeMode(mode) {
  const m = MODES.some((x) => x.id === mode) ? mode : "system";
  try { localStorage.setItem(LS, m); } catch (e) {}
  return applyTheme(m);
}

// Sistem teması değişince ("Sistem" seçiliyse) anında uy — kullanıcı telefonun
// otomatik gece moduna geçtiğinde uygulamayı yeniden açmak zorunda kalmasın.
// Geri dönüş değeri: dinleyiciyi kaldıran fonksiyon.
export function watchSystemTheme(onChange) {
  let mq;
  try { mq = window.matchMedia("(prefers-color-scheme: light)"); } catch (e) { return () => {}; }
  const handler = () => {
    if (themeMode() !== "system") return;
    const t = applyTheme("system");
    if (onChange) onChange(t);
  };
  if (mq.addEventListener) mq.addEventListener("change", handler);
  else if (mq.addListener) mq.addListener(handler); // eski Safari
  return () => {
    if (mq.removeEventListener) mq.removeEventListener("change", handler);
    else if (mq.removeListener) mq.removeListener(handler);
  };
}
