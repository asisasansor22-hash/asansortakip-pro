import React, { useState } from "react";
import ProfileForm, { GENDERS, GOALS, STYLES } from "./ProfileForm";
import { firebaseLogout, changePassword } from "../firebase";
import PasswordInput from "./PasswordInput";

const labelOf = (arr, id) => { const x = arr.find((a) => a.id === id); return x ? x.label : "—"; };

function ChangePassword() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!cur) { setErr("Mevcut şifreni gir."); return; }
    if (pw.length < 6) { setErr("Yeni şifre en az 6 hane olmalı."); return; }
    if (pw !== pw2) { setErr("Yeni şifreler eşleşmiyor."); return; }
    setBusy(true);
    const res = await changePassword(cur, pw);
    setBusy(false);
    if (res.success) { setMsg("Şifren güncellendi ✓"); setCur(""); setPw(""); setPw2(""); }
    else setErr(res.error || "Bir hata oluştu.");
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <PasswordInput placeholder="Mevcut şifre" value={cur}
        onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      <PasswordInput placeholder="Yeni şifre (min. 6 hane)" value={pw}
        onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      <PasswordInput placeholder="Yeni şifre (tekrar)" value={pw2}
        onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
      {err && <div className="err">{err}</div>}
      {msg && <div style={{ color: "var(--ok)", fontSize: 13 }}>{msg}</div>}
      <button className="btn-primary" disabled={busy}>{busy ? "Güncelleniyor..." : "Şifreyi Değiştir"}</button>
    </form>
  );
}

const fmtDate = (ts) => {
  try { return new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch (e) { return ""; }
};

// Profil sekmesi — tercihleri değiştir + antrenman geçmişi + çıkış.
export default function Profile({ profile, email, onSave, history = [] }) {
  return (
    <div>
      <h2>Profil</h2>
      {email && <p style={{ color: "var(--muted)", marginTop: -4 }}>{email}</p>}

      {history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-title">Son antrenmanlar</div>
          {history.slice(0, 8).map((s, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, padding: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.program || "Antrenman"}</div>
                <span className="pill">{(s.sets && s.sets.length) || 0} set</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{fmtDate(s.date)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>Mevcut seçimin</div>
        <div className="row">
          <span className="pill">{labelOf(GENDERS, profile && profile.gender)}</span>
          <span className="pill">{labelOf(GOALS, profile && profile.goal)}</span>
          <span className="pill">{labelOf(STYLES, profile && profile.style)}</span>
        </div>
      </div>

      <div className="section-title">Tercihleri güncelle</div>
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -4, marginBottom: 12 }}>
        Bu seçimler yalnızca <b>Hazır (otomatik) programları</b> filtreler. Kendi programını oluştururken hiçbir kısıtlama yoktur.
      </p>
      <ProfileForm initial={profile} onSave={onSave} submitLabel="Güncelle" />

      <div className="section-title">Şifre Değiştir</div>
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -4, marginBottom: 10 }}>
        Yeni bir şifre belirle. (Şifreni unuttuysan giriş ekranındaki "Şifremi unuttum?"u kullan.)
      </p>
      <ChangePassword />

      <button className="btn-ghost" style={{ width: "100%", marginTop: 20, padding: 14 }} onClick={firebaseLogout}>
        Çıkış Yap
      </button>
    </div>
  );
}
