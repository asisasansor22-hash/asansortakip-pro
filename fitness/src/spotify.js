// Spotify entegrasyonu — Authorization Code + PKCE akışı (client secret GEREKMEZ,
// tarayıcıdan güvenli). Antrenman sırasında çalan şarkıyı gösterip ileri/geri/
// duraklat kontrolü sağlar. Çalan müziği kontrol için Spotify Premium gerekir.
//
// KURULUM (bir kez):
//   1) https://developer.spotify.com/dashboard → "Create app"
//   2) Redirect URI olarak uygulamanın kök adresini ekle:
//        https://fitbe.pages.dev/     (ve istersen http://localhost:5173/ )
//   3) "Web API" seç, kaydet. Client ID'yi kopyalayıp aşağıya yapıştır.
export const SPOTIFY_CLIENT_ID = "540c64b82f95439ea2cd3ff583a83263";

const SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing";
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const LS = "fitbe_spotify";          // {access_token, refresh_token, expires_at}
const LS_VERIFIER = "fitbe_spotify_verifier";

export function spotifyConfigured() { return !!SPOTIFY_CLIENT_ID; }

function redirectUri() { return window.location.origin + "/"; }
function load() { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; } }
function save(t) { try { localStorage.setItem(LS, JSON.stringify(t)); } catch (e) {} }
export function spotifyLogout() { try { localStorage.removeItem(LS); } catch (e) {} }
export function spotifyConnected() { const t = load(); return !!(t && t.refresh_token); }

function rand(n) {
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  return Array.from(a).map((b) => ("0" + b.toString(16)).slice(-2)).join("");
}
async function challenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  let s = ""; const bytes = new Uint8Array(digest);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Spotify giriş sayfasına yönlendir (PKCE)
export async function spotifyLogin() {
  if (!SPOTIFY_CLIENT_ID) return;
  const verifier = rand(32);
  try { localStorage.setItem(LS_VERIFIER, verifier); } catch (e) {}
  const code_challenge = await challenge(verifier);
  const p = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID, response_type: "code", redirect_uri: redirectUri(),
    scope: SCOPES, code_challenge_method: "S256", code_challenge,
  });
  window.location.href = AUTH_URL + "?" + p.toString();
}

// Sayfa açılışında ?code=... (veya ?error=) varsa işle. Dönüş: işlendiyse true.
export async function spotifyHandleRedirect() {
  const u = new URL(window.location.href);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (!code && !err) return false;
  if (code) {
    let verifier = "";
    try { verifier = localStorage.getItem(LS_VERIFIER) || ""; } catch (e) {}
    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code", code, redirect_uri: redirectUri(),
        client_id: SPOTIFY_CLIENT_ID, code_verifier: verifier,
      });
      const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const d = await res.json();
      if (d && d.access_token) {
        save({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000 });
      }
    } catch (e) {}
  }
  // URL'den code/error'u temizle, hash rotasını koru
  try { window.history.replaceState({}, "", redirectUri() + (u.hash || "")); } catch (e) {}
  try { localStorage.removeItem(LS_VERIFIER); } catch (e) {}
  return true;
}

// Geçerli access token (gerekirse yeniler)
async function token() {
  let t = load();
  if (!t) return null;
  if (Date.now() < (t.expires_at || 0) - 10000) return t.access_token;
  try {
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: SPOTIFY_CLIENT_ID });
    const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const d = await res.json();
    if (d && d.access_token) {
      t = { access_token: d.access_token, refresh_token: d.refresh_token || t.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000 };
      save(t); return t.access_token;
    }
  } catch (e) {}
  return null;
}

async function player(path, method) {
  const tk = await token();
  if (!tk) return { ok: false, status: 401 };
  try {
    return await fetch("https://api.spotify.com/v1/me/player" + path, {
      method: method || "GET", headers: { Authorization: "Bearer " + tk },
    });
  } catch (e) { return { ok: false, status: 0 }; }
}

// Çalan şarkı bilgisi: {name, artist, image, playing} veya null
export async function spotifyNowPlaying() {
  const res = await player("/currently-playing");
  if (!res || res.status === 204 || !res.ok) return null;
  try {
    const d = await res.json();
    if (!d || !d.item) return null;
    const imgs = (d.item.album && d.item.album.images) || [];
    return {
      name: d.item.name || "",
      artist: (d.item.artists || []).map((a) => a.name).join(", "),
      image: imgs.length ? imgs[imgs.length - 1].url : null,
      playing: !!d.is_playing,
    };
  } catch (e) { return null; }
}

export async function spotifyNext() { await player("/next", "POST"); }
export async function spotifyPrev() { await player("/previous", "POST"); }

// Kullanıcının Spotify cihazları (telefon, bilgisayar, hoparlör…)
export async function spotifyDevices() {
  const res = await player("/devices");
  if (!res || !res.ok) return [];
  try { const d = await res.json(); return (d && d.devices) || []; } catch (e) { return []; }
}

// Oynat/duraklat. Aktif cihaz yoksa (404) cihaz listesinden birini seçip
// çalmayı ORADAN başlatmayı dener; hiç cihaz yoksa {ok:false, reason:"no_device"}.
// (Web sayfası kapalı bir Spotify uygulamasını uyandıramaz — platform kısıtı.)
export async function spotifyToggle(isPlaying) {
  if (isPlaying) { await player("/pause", "PUT"); return { ok: true }; }
  let res = await player("/play", "PUT");
  if (res && res.ok) return { ok: true };
  if (res && (res.status === 404 || res.status === 403)) {
    const devs = await spotifyDevices();
    const d = devs.find((x) => x.is_active) || devs.find((x) => x.type === "Smartphone") || devs[0];
    if (d && d.id) {
      res = await player("/play?device_id=" + encodeURIComponent(d.id), "PUT");
      if (res && res.ok) return { ok: true };
    }
    return { ok: false, reason: "no_device" };
  }
  return { ok: !!(res && res.ok) };
}
