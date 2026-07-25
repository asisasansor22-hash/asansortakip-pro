import React, { useState } from "react";
import ProfileForm from "./ProfileForm";
import { firebaseLogout, changePassword, ADMIN_EMAIL, getDisplayName, setMyName } from "../firebase";
import PasswordInput from "./PasswordInput";
import Admin from "./Admin";
import Achievements from "./Achievements";

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

// Görünen ad — akış, lig, mesaj ve yorumlarda e-posta yerine bu ad görünür.
function DisplayName() {
  const [name, setName] = useState(() => getDisplayName());
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    const nm = name.trim();
    if (!nm) { setErr("Bir ad gir."); return; }
    setBusy(true);
    const res = await setMyName(nm);
    setBusy(false);
    if (res.success) setMsg("Görünen adın güncellendi ✓");
    else setErr(res.error || "Bir hata oluştu.");
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input className="input" type="text" placeholder="Görünen ad (örn. Berat)" value={name}
        onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={30} />
      {err && <div className="err">{err}</div>}
      {msg && <div style={{ color: "var(--ok)", fontSize: 13 }}>{msg}</div>}
      <button className="btn-primary" disabled={busy}>{busy ? "Kaydediliyor..." : "Adı Kaydet"}</button>
    </form>
  );
}

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

// Apple Sağlık (iPhone Kısayolu) ile antrenman içe aktarma bölümü
function AppleHealth({ importUrl, importUrlSecure, onImportApple }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);
  if (!importUrl) return null;
  async function copy() {
    try { await navigator.clipboard.writeText(importUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  }
  async function copySecure() {
    try { await navigator.clipboard.writeText(importUrlSecure); setCopiedSec(true); setTimeout(() => setCopiedSec(false), 2000); } catch (e) {}
  }
  async function imp() { setBusy(true); try { await onImportApple(); } catch (e) {} setBusy(false); }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>🍎 Apple Sağlık'tan Aktar</div>
        <button className="icon-btn" onClick={() => setOpen((v) => !v)}>{open ? "Gizle" : "Kurulum"}</button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 12, margin: "6px 0 10px" }}>
        iPhone'daki antrenmanlarını bir kez kuracağın Apple Kısayolu ile buraya gönder.
      </p>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={imp}>
          {busy ? "Aktarılıyor…" : "⤵️ Şimdi içe aktar"}
        </button>
        <button className="icon-btn" onClick={copy}>{copied ? "Kopyalandı ✓" : "🔗 URL kopyala"}</button>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Kısayol kurulumu (tek seferlik)</div>
          <p style={{ color: "#fbbf24", fontSize: 11.5, margin: "0 0 8px", lineHeight: 1.5 }}>
            ⚠️ iOS Kısayollar <b>tek tek antrenmanları okuyamıyor</b> — yalnızca günlük toplamları verebiliyor.
            Bu yüzden aşağıdaki kurulum <b>günlük egzersiz dakikası ve aktif kaloriyi</b> aktarır.
            Bunlar İlerleme sekmesinde ayrı bir bölümde görünür; antrenman geçmişine ve lig puanına karışmaz.
          </p>
          <ol style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
            <li>iPhone'da <b>Kısayollar</b> → <b>+</b> ile yeni kısayol.</li>
            <li><b>“Sağlık Örneklerini Bul”</b> ekle → Tür <b>Exercise Time</b> (Egzersiz Süresi),
              Başlangıç Tarihi <b>önceki 7 gün</b> (“sonraki” DEĞİL), Birim <b>dk</b>, Grupla <b>Gün</b>.</li>
            <li><b>“Her Biriyle Yinele”</b> ekle.</li>
            <li>Yinele'nin içine <b>Sözlük</b> ekle — 3 anahtar:
              <br /><code>kind</code> = <code>daily</code> (düz metin)
              <br /><code>start</code> = Yinele Öğesi › <b>Başlangıç Tarihi</b>
              <br /><code>durationMin</code> = Yinele Öğesi › <b>Değer</b></li>
            <li>Yine Yinele'nin içine <b>“URL'nin İçeriğini Al”</b> ekle → Yöntem <b>POST</b>,
              İstek Gövdesi <b>JSON</b> = Sözlük, URL = aşağıdaki <b>sana özel</b> bağlantı.</li>
            <li>Kaydet ve çalıştır. Kalori de istersen aynı adımları <b>Active Calories</b> türü ve
              <code>kcal</code> anahtarıyla tekrarla — uygulama ikisini aynı günde birleştirir.</li>
          </ol>
          <div style={{ background: "var(--card2)", borderRadius: 8, padding: 8, marginTop: 8, fontSize: 10, wordBreak: "break-all", color: "var(--muted)" }}>
            {importUrl}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>
            🔒 Bu bağlantı <b>sana özeldir</b>, kimseyle paylaşma. Çalışması için veritabanı kuralında
            <code> /fitness/imports</code> düğümü açık olmalı (anahtar tahmin edilemez olduğu için korunur).
          </p>
          {importUrlSecure && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Daha güvenli yöntem (Cloud Function) — isteğe bağlı
              </summary>
              <p style={{ color: "var(--muted)", fontSize: 11, margin: "8px 0" }}>
                <code>appleImport</code> fonksiyonu deploy edildiyse aşağıdaki adresi kullan. Bu yöntemde
                token sunucuda doğrulanır ve veritabanında herkese açık yazma düğümüne gerek kalmaz.
                Uygulama her iki yolu da okur; hangisini kullanırsan kullan çalışır.
              </p>
              <div style={{ background: "var(--card2)", borderRadius: 8, padding: 8, fontSize: 10, wordBreak: "break-all", color: "var(--muted)" }}>
                {importUrlSecure}
              </div>
              <button className="btn-primary" style={{ width: "100%", padding: 12, marginTop: 8 }} onClick={copySecure}>
                {copiedSec ? "✓ Kopyalandı — Kısayol'a yapıştır" : "📋 Güvenli URL'yi kopyala"}
              </button>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// Profil sekmesi — profil fotoğrafı, tercihler, şifre, güncelle & çıkış.
export default function Profile({ profile, email, onSave, avatar, onSaveAvatar, importUrl, importUrlSecure, onImportApple, history = [] }) {
  const admin = (email || "").toLowerCase() === ADMIN_EMAIL;
  return (
    <div>
      <h2>Profil</h2>
      {email && <p style={{ color: "var(--muted)", marginTop: -4, marginBottom: 12 }}>{email}</p>}

      {onSaveAvatar && <Avatar avatar={avatar} email={email} onSaveAvatar={onSaveAvatar} />}

      <div className="section-title">Görünen ad</div>
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -4, marginBottom: 10 }}>
        Akışta, GYMO Ligi'nde, mesajlarda ve yorumlarda e-posta yerine bu ad görünür.
      </p>
      <DisplayName />

      {admin && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent2)" }}>
          <Admin />
        </div>
      )}

      <div style={{ marginBottom: 16 }}><Achievements history={history} /></div>

      {importUrl && <AppleHealth importUrl={importUrl} importUrlSecure={importUrlSecure} onImportApple={onImportApple} />}

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

      <button className="btn-ghost" style={{ width: "100%", marginTop: 20, padding: 14 }}
        onClick={async () => {
          try {
            if ("serviceWorker" in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
            if (window.caches && caches.keys) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
          } catch (e) {}
          window.location.reload();
        }}>
        🔄 Uygulamayı Güncelle
      </button>

      <button className="btn-ghost" style={{ width: "100%", marginTop: 10, padding: 14 }} onClick={firebaseLogout}>
        Çıkış Yap
      </button>
    </div>
  );
}
