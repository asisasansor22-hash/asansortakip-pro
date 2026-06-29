import React, { useState } from "react";
import { adminListUsers, adminSetPassword, adminSetDisabled } from "../firebase";

const fmt = (s) => { try { return s ? new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"; } catch (e) { return "—"; } };

export default function Admin() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setErr(""); setLoading(true);
    const r = await adminListUsers();
    setLoading(false);
    if (r.success) setUsers(r.users);
    else setErr(r.error || "Yüklenemedi. (Cloud Function deploy edildi mi?)");
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
                <button className="icon-btn" disabled={busy === u.uid} onClick={() => setPw(u)}>🔑 Şifre Ata</button>
                <button className="icon-btn" style={{ color: u.disabled ? "var(--ok)" : "var(--danger)" }}
                  disabled={busy === u.uid} onClick={() => toggle(u)}>
                  {u.disabled ? "✓ Aktifleştir" : "⛔ Askıya Al"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
