import React, { useEffect, useRef, useState } from "react";
import {
  spotifyConfigured, spotifyConnected, spotifyLogin,
  spotifyNowPlaying, spotifyNext, spotifyPrev, spotifyToggle,
} from "../spotify";

const wrap = {
  display: "flex", alignItems: "center", gap: 10,
  background: "var(--card2)", borderRadius: 12, padding: "8px 10px",
  margin: "8px 12px 0", minHeight: 52,
};
const artBox = {
  width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)",
};
const titleS = { fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const subS = { color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const ctrlBtn = {
  background: "var(--card)", color: "var(--text)", border: "none", borderRadius: 999,
  width: 34, height: 34, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
};

// Antrenman ekranında müzik kontrolü. Client ID yoksa yalnız "Spotify'ı Aç"
// (hızlı geçiş) düğmesi; yapılandırılmış ve bağlıysa çalan şarkı + ⏮⏯⏭.
export default function SpotifyBar() {
  const configured = spotifyConfigured();
  const [connected] = useState(spotifyConnected());
  const [np, setNp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const poll = useRef(null);
  const hintTimer = useRef(null);

  useEffect(() => {
    if (!(configured && connected)) return;
    let alive = true;
    const tick = async () => { const n = await spotifyNowPlaying(); if (alive) setNp(n); };
    tick();
    poll.current = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(poll.current); };
  }, [configured, connected]);

  async function ctrl(fn) {
    setBusy(true);
    try {
      const r = await fn();
      if (r && r.ok === false && r.reason === "no_device") {
        setHint("Aktif Spotify cihazı yok — Spotify'ı açıp bir şarkı başlat, sonra buradan yönet.");
        clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHint(""), 7000);
      }
    } catch (e) {}
    setTimeout(async () => { setNp(await spotifyNowPlaying()); setBusy(false); }, 350);
  }
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  // Bağlı: çalan şarkı + kontroller
  if (configured && connected) {
    return (
      <>
        <div style={wrap}>
          <div style={artBox}>
            {np && np.image ? <img src={np.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🎵</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titleS}>{np ? np.name : "Spotify'da bir şarkı başlat"}</div>
            <div style={subS}>{np ? np.artist : "telefonunda çalınca burada görünür"}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={ctrlBtn} disabled={busy} onClick={() => ctrl(spotifyPrev)} aria-label="Önceki">⏮</button>
            <button style={ctrlBtn} disabled={busy} onClick={() => ctrl(() => spotifyToggle(np && np.playing))} aria-label="Oynat/Duraklat">{np && np.playing ? "⏸" : "▶"}</button>
            <button style={ctrlBtn} disabled={busy} onClick={() => ctrl(spotifyNext)} aria-label="Sonraki">⏭</button>
          </div>
        </div>
        {hint && (
          <div style={{ margin: "6px 12px 0", background: "var(--card2)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 11, flex: 1, lineHeight: 1.35 }}>{hint}</span>
            <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer"
              style={{ background: "#1db954", color: "#04140a", fontWeight: 800, fontSize: 11, padding: "6px 10px", borderRadius: 999, textDecoration: "none", flexShrink: 0 }}>
              Spotify'ı Aç ↗
            </a>
          </div>
        )}
      </>
    );
  }

  // Yapılandırılmamış ya da henüz bağlı değil
  return (
    <div style={wrap}>
      <div style={artBox}><span style={{ fontSize: 20 }}>🎵</span></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleS}>Müzik</div>
        <div style={subS}>{configured ? "Bağlan: uygulamadan şarkı değiştir" : "Spotify'ı aç, şarkını seç, geri dön"}</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {configured && (
          <button style={{ ...ctrlBtn, width: "auto", padding: "0 12px", background: "#1db954", color: "#04140a", fontWeight: 800, fontSize: 12 }}
            onClick={spotifyLogin}>Bağlan</button>
        )}
        <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer"
          style={{ ...ctrlBtn, width: "auto", padding: "0 12px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          Spotify'ı Aç ↗
        </a>
      </div>
    </div>
  );
}
