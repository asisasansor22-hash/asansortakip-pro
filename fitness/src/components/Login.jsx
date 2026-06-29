import React, { useState } from "react";
import { firebaseLogin, sendPasswordReset } from "../firebase";
import ExerciseAnimation from "./ExerciseAnimation";
import PasswordInput from "./PasswordInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!email || pass.length < 6) {
      setErr("Geçerli e-posta ve en az 6 haneli şifre girin.");
      return;
    }
    setBusy(true);
    const res = await firebaseLogin(email.trim(), pass);
    setBusy(false);
    if (!res.success) setErr("Giriş başarısız: " + (res.error || "bilinmeyen hata"));
  }

  async function forgot() {
    setErr(""); setMsg("");
    if (!email) { setErr("Önce e-posta adresini gir, sonra 'Şifremi unuttum'a dokun."); return; }
    setBusy(true);
    const res = await sendPasswordReset(email.trim());
    setBusy(false);
    if (res.success) setMsg("Şifre sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu (ve spam'i) kontrol et.");
    else setErr("Gönderilemedi: " + (res.error || "bilinmeyen hata"));
  }

  return (
    <div className="login-wrap">
      <div className="figbox" style={{ width: 160 }}>
        <ExerciseAnimation type="squat" exId="squat" size={130} />
      </div>
      <h1 style={{ fontSize: 26 }}>Fit<span style={{ color: "var(--accent)" }}>+be</span></h1>
      <p style={{ color: "var(--muted)", marginTop: -6, textAlign: "center" }}>
        Antrenman programını oluştur, beslenmeni planla.
      </p>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="input" type="email" placeholder="E-posta" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput placeholder="Şifre (min. 6 hane)" value={pass}
          onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        {err && <div className="err">{err}</div>}
        {msg && <div style={{ color: "var(--ok)", fontSize: 13 }}>{msg}</div>}
        <button className="btn-primary" disabled={busy}>{busy ? "İşleniyor..." : "Giriş Yap / Kaydol"}</button>
      </form>
      <button onClick={forgot} disabled={busy}
        style={{ background: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
        Şifremi unuttum?
      </button>
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
        Hesabın yoksa otomatik oluşturulur.
      </p>
    </div>
  );
}
