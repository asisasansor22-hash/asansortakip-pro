import React, { useState, useRef, useEffect } from "react";
import { adminListUsers, dbListUsers, adminSetPassword, adminSetDisabled } from "../firebase";

const fmt = (s) => { try { return s ? new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"; } catch (e) { return "—"; } };

export default function Admin() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");
  const [limited, setLimited] = useState(false);
  const [gallery, setGallery] = useState(null); // {email, photos}
  const [zoom, setZoom] = useState(null);
  // Mobil "hayalet tıklama" koruması: katman kapandıktan hemen sonra
  // alttaki öğeye düşen sahte tıklamayı yok say.
  const closedAt = useRef(0);
  const justClosed = () => Date.now() - closedAt.current < 450;
  const closeNow = (setter) => { closedAt.current = Date.now(); setter(null); };

  // Escape tuşu açık katmanı kapatsın (önce zoom, sonra galeri)
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (zoom) closeNow(setZoom);
      else if (gallery) closeNow(setGallery);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, gallery]);

  async function load() {
    setErr(""); setLoading(true);
    // Önce Cloud Function (tam yetki: kayıt tarihi, askıya alma vb.)
    const r = await adminListUsers();
    if (r.success) {
      setLimited(false);
      setUsers(r.users);
      setLoading(false);
      return;
    }
    // Cloud Function yoksa: doğrudan veritabanından listele (deploy gerektirmez)
    const d = await dbListUsers();
    setLoading(false);
    if (d.success) {
      setLimited(true);
      setUsers(d.users);
    } else {
      setErr("Yüklenemedi (" + (d.error || r.error || "hata") + "). Veritabanı kuralında admin okuma izni olduğundan emin ol.");
    }
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(""), 2600); }

  async function setPw(u) {
    const np = window.prompt("Yeni şifre (" + u.email + ") — en az 6 hane:");
    if (np == null) return;
    if (np.length < 6) { flash("Şifre en az 6 hane olmalı."); return; }
    setBusy(u.uid);
    const r = await adminSetPassword(u.uid, np);
    setBusy("");
    flash(r.success ? (u.email + " → şifre değiştirildi") : ("Hata: " + r.error));
  }

  async function toggle(u) {
    setBusy(u.uid);
    const r = await adminSetDisabled(u.uid, !u.disabled);
    setBusy("");
    if (r.success) setUsers((us) => us.map((x) => x.uid === u.uid ? { ...x, disabled: !u.disabled } : x));
    else flash("Hata: " + r.error);
  }

  const list = users ? users.filter((u) => !q || (u.email || "").toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <div>
      <div className="section-title">🛠️ Admin Paneli</div>
      {!users && (
        <button className="btn-primary" onClick={load} disabled={loading}>
          {loading ? "Yükleniyor..." : "Kullanıcıları Yükle"}
        </button>
      )}
      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
      {msg && <div style={{ color: "var(--ok)", fontSize: 13, marginTop: 8 }}>{msg}</div>}

      {users && (
        <div>
          <div className="row" style={{ justifyContent: "space-between", margin: "8px 0" }}>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{list.length} kullanıcı</span>
            <button className="icon-btn" onClick={load}>↻ Yenile</button>
          </div>
          {limited && (
            <div className="card" style={{ padding: 10, marginBottom: 8, fontSize: 12, color: "var(--muted)" }}>
              ℹ️ Sınırlı mod: kullanıcılar veritabanından listeleniyor (giriş yapmış olanlar görünür).
              Şifre atama ve askıya alma için Cloud Functions deploy gerekir
              (Blaze planı + repo kökünde <code>firebase deploy --only functions</code>).
            </div>
          )}
          <input className="search-input" placeholder="🔍 E-posta ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          {list.map((u) => (
            <div key={u.uid} className="card" style={{ marginBottom: 8, padding: 12, opacity: u.disabled ? 0.6 : 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, wordBreak: "break-all" }}>
                {u.email || "(e-posta yok)"} {u.disabled && <span className="pill" style={{ color: "var(--danger)" }}>Askıda</span>}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 11, margin: "2px 0 8px" }}>
                Son giriş: {fmt(u.lastSignIn)} · Kayıt: {fmt(u.created)}
              </div>
              <div className="row">
                <button className="icon-btn" disabled={limited || busy === u.uid} onClick={() => setPw(u)}>🔑 Şifre Ata</button>
                <button className="icon-btn" style={{ color: u.disabled ? "var(--ok)" : "var(--danger)" }}
                  disabled={limited || busy === u.uid} onClick={() => toggle(u)}>
                  {u.disabled ? "✓ Aktifleştir" : "⛔ Askıya Al"}
                </button>
                {u.photos && u.photos.length > 0 && (
                  <button className="icon-btn" onClick={() => { if (justClosed()) return; setGallery({ email: u.email, photos: u.photos }); }}>📷 {u.photos.length}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {gallery && (
        <div onClick={() => closeNow(setGallery)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 60, padding: 16,
          overflowY: "auto",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, wordBreak: "break-all" }}>{gallery.email}</div>
              <button className="icon-btn" onClick={() => closeNow(setGallery)}>Kapat ✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {gallery.photos.slice().sort((a, b) => (a.t || 0) - (b.t || 0)).map((p) => (
                <img key={p.id || p.t} src={p.src} alt="" onClick={() => { if (justClosed()) return; setZoom(p.src); }}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {zoom && (
        <div onClick={() => closeNow(setZoom)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.96)", zIndex: 70,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); closeNow(setZoom); }}
            style={{ position: "fixed", top: 14, right: 14, background: "rgba(255,255,255,.12)", zIndex: 71 }}>Kapat ✕</button>
          <img src={zoom} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
