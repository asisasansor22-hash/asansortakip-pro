import React, { useState } from "react";
import { firebaseLogin } from "../firebase";
import ExerciseAnimation from "./ExerciseAnimation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!email || pass.length < 6) {
      setErr("Geçerli e-posta ve en az 6 haneli şifre girin.");
      return;
    }
    setBusy(true);
    const res = await firebaseLogin(email.trim(), pass);
    setBusy(false);
    if (!res.success) setErr("Giriş başarısız: " + (res.error || "bilinmeyen hata"));
  }

  return (
    <div className="login-wrap">
      <div className="figbox" style={{ width: 160 }}>
        <ExerciseAnimation type="squat" size={130} />
      </div>
      <h1 style={{ fontSize: 26 }}>Fit<span style={{ color: "var(--accent)" }}>be</span></h1>
      <p style={{ color: "var(--muted)", marginTop: -6, textAlign: "center" }}>
        Antrenman programını oluştur, beslenmeni planla.
      </p>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
        <input className="input" type="email" placeholder="E-posta" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input className="input" type="password" placeholder="Şifre (min. 6 hane)" value={pass}
          onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        {err && <div className="err">{err}</div>}
        <button className="btn-primary" disabled={busy}>{busy ? "Giriş yapılıyor..." : "Giriş Yap / Kaydol"}</button>
      </form>
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
        Hesabın yoksa otomatik oluşturulur.
      </p>
    </div>
  );
}
