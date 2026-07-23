import React, { useState } from "react";
import { firebaseSignIn, firebaseRegister, sendPasswordReset } from "../firebase";
import ExerciseAnimation from "./ExerciseAnimation";
import PasswordInput from "./PasswordInput";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const isReg = mode === "register";

  function switchMode(m) { setMode(m); setErr(""); setMsg(""); }

  async function submit(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (isReg && !name.trim()) { setErr("Görünen adını gir (akışta ve ligde bu görünecek)."); return; }
    if (!email.trim()) { setErr("E-posta gir."); return; }
    if (pass.length < 6) { setErr("Şifre en az 6 hane olmalı."); return; }
    if (isReg && pass !== pass2) { setErr("Şifreler eşleşmiyor."); return; }
    setBusy(true);
    const res = isReg
      ? await firebaseRegister(email.trim(), pass, name.trim())
      : await firebaseSignIn(email.trim(), pass);
    setBusy(false);
    if (!res.success) setErr(res.error || "Bir hata oluştu.");
    // Başarılıysa onAuthChange devralır, ekran otomatik değişir.
  }

  async function forgot() {
    setErr(""); setMsg("");
    if (!email.trim()) { setErr("Önce e-posta adresini gir, sonra 'Şifremi unuttum'a dokun."); return; }
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

      {/* Giriş / Kayıt Ol sekmesi */}
      <div className="row" style={{ width: "100%", maxWidth: 360, gap: 8, marginBottom: 4 }}>
        <button type="button" className={"seg" + (!isReg ? " on" : "")} style={{ flex: 1 }} onClick={() => switchMode("login")}>Giriş Yap</button>
        <button type="button" className={"seg" + (isReg ? " on" : "")} style={{ flex: 1 }} onClick={() => switchMode("register")}>Kayıt Ol</button>
      </div>

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
        {isReg && (
          <input className="input" type="text" placeholder="Görünen ad (örn. Berat)" value={name}
            onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={30} />
        )}
        <input className="input" type="email" placeholder="E-posta" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput placeholder={isReg ? "Şifre (min. 6 hane)" : "Şifre"} value={pass}
          onChange={(e) => setPass(e.target.value)} autoComplete={isReg ? "new-password" : "current-password"} />
        {isReg && (
          <PasswordInput placeholder="Şifre (tekrar)" value={pass2}
            onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
        )}
        {err && <div className="err">{err}</div>}
        {msg && <div style={{ color: "var(--ok)", fontSize: 13 }}>{msg}</div>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "İşleniyor..." : (isReg ? "✓ Hesap Oluştur" : "Giriş Yap")}
        </button>
      </form>

      {!isReg ? (
        <>
          <button onClick={forgot} disabled={busy}
            style={{ background: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
            Şifremi unuttum?
          </button>
          <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
            Hesabın yok mu? <button type="button" onClick={() => switchMode("register")}
              style={{ background: "none", color: "var(--accent)", fontWeight: 700, fontSize: 12 }}>Kayıt Ol</button>
          </p>
        </>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 2 }}>
          Zaten hesabın var mı? <button type="button" onClick={() => switchMode("login")}
            style={{ background: "none", color: "var(--accent)", fontWeight: 700, fontSize: 12 }}>Giriş Yap</button>
        </p>
      )}
    </div>
  );
}
