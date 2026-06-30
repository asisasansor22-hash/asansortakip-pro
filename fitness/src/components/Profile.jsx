import React, { useState } from "react";
import ProfileForm, { GENDERS, GOALS, STYLES } from "./ProfileForm";
import { firebaseLogout, changePassword, ADMIN_EMAIL } from "../firebase";
import PasswordInput from "./PasswordInput";
import Admin from "./Admin";

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

// Avatar'ı kare olarak ~256px'e küçült (JPEG)
function resizeAvatar(file, size = 256, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = size; c.height = size;
        const ctx = c.getContext("2d");
        const m = Math.min(img.width, img.height);
        const sx = (img.width - m) / 2, sy = (img.height - m) / 2;
        ctx.drawImage(img, sx, sy, m, m, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Avatar({ avatar, email, onSaveAvatar }) {
  const [busy, setBusy] = useState(false);
  async function pick(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setBusy(true);
    try { onSaveAvatar(await resizeAvatar(f)); } catch (x) {}
    setBusy(false);
  }
  const initial = (email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="row" style={{ gap: 14, alignItems: "center", marginBottom: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {avatar
          ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontWeight: 800, fontSize: 24, color: "var(--accent)" }}>{initial}</span>}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <label className="icon-btn" style={{ cursor: "pointer" }}>{busy ? "…" : (avatar ? "Değiştir" : "📷 Fotoğraf ekle")}
          <input type="file" accept="image/*" style={{ display: "none" }} disabled={busy} onChange={pick} />
        </label>
        {avatar && <button className="icon-btn danger" onClick={() => onSaveAvatar(null)}>Kaldır</button>}
      </div>
    </div>
  );
}

// Profil sekmesi — tercihleri değiştir + antrenman geçmişi + çıkış.
export default function Profile({ profile, email, onSave, history = [], avatar, onSaveAvatar }) {
  const admin = (email || "").toLowerCase() === ADMIN_EMAIL;
  return (
    <div>
      <h2>Profil</h2>
      {email && <p style={{ color: "var(--muted)", marginTop: -4, marginBottom: 12 }}>{email}</p>}

      {onSaveAvatar && <Avatar avatar={avatar} email={email} onSaveAvatar={onSaveAvatar} />}

      {admin && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent2)" }}>
          <Admin />
        </div>
      )}

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
