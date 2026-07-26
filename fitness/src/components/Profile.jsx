import React, { useState } from "react";
import ProfileForm from "./ProfileForm";
import { firebaseLogout, changePassword, ADMIN_EMAIL, getDisplayName, setMyName } from "../firebase";
import PasswordInput from "./PasswordInput";
import Admin from "./Admin";
import Achievements from "./Achievements";
import { downloadBackup, parseBackup, readFile, pickFields, fmtBackupDate } from "../utils/backup";
import { remOn, setRemOn, remTime, setRemTime } from "../utils/reminder";
import { MODES, themeMode, setThemeMode, resolvedTheme } from "../utils/theme";
import { notifSupported, notifPermission, requestNotif } from "../utils/alerts";

// Tema seçici — koyu / açık / sistem. Seçim anında uygulanır.
function ThemePicker({ onChange }) {
  const [mode, setMode] = useState(() => themeMode());
  function pick(id) {
    setThemeMode(id);
    setMode(id);
    if (onChange) onChange(id);
  }
  return (
    <div className="row" style={{ gap: 8 }}>
      {MODES.map((m) => (
        <button key={m.id} onClick={() => pick(m.id)}
          className={"seg" + (mode === m.id ? " on" : "")}
          style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
          {m.emoji} {m.label}
        </button>
      ))}
    </div>
  );
}

// Antrenman günü hatırlatması ayarları.
// Uygulama içi şerit her zaman açıktır (ReminderBar); buradaki anahtar
// yalnızca BİLDİRİMİ kontrol eder — sınırı da açıkça yazar.
function ReminderSettings({ onChange }) {
  const [on, setOn] = useState(() => remOn());
  const [time, setTime] = useState(() => remTime());
  const [perm, setPerm] = useState(() => notifPermission());

  async function toggle() {
    if (!on) {
      if (!notifSupported()) return;
      let p = notifPermission();
      if (p === "default") p = await requestNotif();
      setPerm(p);
      if (p !== "granted") return; // izin yoksa açık göstermenin anlamı yok
    }
    const v = !on;
    setOn(v); setRemOn(v);
    if (onChange) onChange();
  }

  function pickTime(e) {
    const v = e.target.value;
    setTime(v); setRemTime(v);
    if (onChange) onChange();
  }

  const blocked = notifSupported() && perm === "denied";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>🔔 Bildirim gönder</span>
        <input type="checkbox" checked={on} onChange={toggle} disabled={!notifSupported() || blocked}
          style={{ width: 22, height: 22, accentColor: "var(--accent)" }} />
      </label>

      <label className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>⏰ Saat</span>
        <input className="input" type="time" value={time} onChange={pickTime}
          style={{ width: 130, textAlign: "center" }} />
      </label>

      {!notifSupported() && (
        <div style={{ color: "var(--muted)", fontSize: 12 }}>Bu tarayıcı bildirimi desteklemiyor.</div>
      )}
      {blocked && (
        <div style={{ color: "var(--warn)", fontSize: 12 }}>
          Bildirim izni reddedilmiş. Tarayıcı/telefon ayarlarından GYMO için bildirimlere izin ver.
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
        <b>Nasıl çalışır:</b> Uygulama açıkken (arka planda da olur) seçtiğin saatte bildirim düşer.
        Uygulama tamamen kapalıysa tarayıcı bildirimi gönderemez — bunun için sunucu gerekir.
        Ama <b>uygulamayı her açtığında</b> o günkü antrenmanın en üstte şerit olarak çıkar; bu her koşulda çalışır.
        {" "}iPhone'da bildirimler yalnızca uygulamayı <b>ana ekrana eklediysen</b> gelir.
      </p>
    </div>
  );
}

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
function DisplayName({ onSaved }) {
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
    if (res.success) { setMsg("Görünen adın güncellendi ✓"); if (onSaved) onSaved(); }
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

// Yedekleme — tüm veriyi tek JSON dosyasına indir, istenirse geri yükle.
// Geri yükleme ÜZERİNE YAZAR, o yüzden iki aşamalı: önce dosya okunup özeti
// gösterilir, kullanıcı onaylamadan hiçbir şey değişmez.
function Backup({ snapshot, onRestore }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(null); // { data, summary }
  const [busy, setBusy] = useState(false);

  function doExport() {
    setErr(""); setPending(null);
    try {
      const d = downloadBackup(snapshot());
      const n = Array.isArray(d.history) ? d.history.length : 0;
      setMsg("Yedek indirildi ✓ (" + n + " antrenman)");
    } catch (e) { setErr("İndirme başarısız oldu."); }
  }

  async function pickFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    if (!f) return;
    setMsg(""); setErr(""); setPending(null);
    try {
      const res = parseBackup(await readFile(f));
      if (!res.ok) { setErr(res.error); return; }
      setPending(res);
    } catch (x) { setErr("Dosya okunamadı."); }
  }

  async function confirmRestore() {
    if (!pending) return;
    setBusy(true);
    const r = await onRestore(pickFields(pending.data));
    setBusy(false);
    setPending(null);
    if (r && r.success) setMsg("Veriler geri yüklendi ✓");
    else setErr((r && r.error) || "Geri yükleme başarısız oldu.");
  }

  const s = pending && pending.summary;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button className="btn-primary" onClick={doExport}>⬇️ Yedeği İndir</button>

      <label className="btn-ghost" style={{ cursor: "pointer", textAlign: "center", padding: 12 }}>
        ⬆️ Yedekten Geri Yükle
        <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={pickFile} />
      </label>

      {pending && (
        <div className="card" style={{ padding: 12, borderColor: "var(--accent2)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Bu yedek yüklensin mi?</div>
          <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>
            {s.at && <>📅 {fmtBackupDate(s.at)}<br /></>}
            📋 {s.programs} program · 🏋️ {s.workouts} antrenman<br />
            ⚖️ {s.weights} kilo kaydı · 📏 {s.measures} ölçüm
          </div>
          <p style={{ color: "var(--warn)", fontSize: 12, margin: "10px 0 0" }}>
            ⚠️ Şu anki verilerinin <b>üzerine yazılır</b>. Emin değilsen önce mevcut hâlin yedeğini indir.
          </p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={confirmRestore}>
              {busy ? "Yükleniyor..." : "Evet, geri yükle"}
            </button>
            <button className="btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setPending(null)}>Vazgeç</button>
          </div>
        </div>
      )}

      {err && <div className="err">{err}</div>}
      {msg && <div style={{ color: "var(--ok)", fontSize: 13 }}>{msg}</div>}
    </div>
  );
}

// Katlanabilir bölüm — nadiren kullanılan formlar (ad, şifre) sürekli açık
// durup sayfayı uzatmasın; başlığa dokununca açılsın.
function Section({ title, sub, hint, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "none", color: "var(--text)", textAlign: "left",
          padding: "14px 14px", display: "flex", alignItems: "center", gap: 10, minHeight: 52,
        }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          {sub && <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{sub}</span>}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 13, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          {hint && <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 10px" }}>{hint}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

// Profil sekmesi — profil fotoğrafı, tercihler, şifre, güncelle & çıkış.
export default function Profile({ profile, email, onSave, avatar, onSaveAvatar, history = [], snapshot, onRestore }) {
  const admin = (email || "").toLowerCase() === ADMIN_EMAIL;
  // Bölüm başlıklarındaki özet (ad, tema, saat) localStorage'dan okunuyor;
  // React bunu izleyemez. Bir ayar kaydedilince setBump ile yeniden render
  // tetiklenir ve özetler tazelenir.
  const [, setBump] = useState(0);
  return (
    <div>
      <h2>Profil</h2>
      {email && <p style={{ color: "var(--muted)", marginTop: -4, marginBottom: 12 }}>{email}</p>}

      {onSaveAvatar && <Avatar avatar={avatar} email={email} onSaveAvatar={onSaveAvatar} />}

      {/* Section'a key VERİLMEZ — verilirse bölüm yeniden kurulup kapanır ve
          "güncellendi" mesajı görünmeden kaybolur. */}
      <Section title="👤 Görünen adı değiştir" sub={getDisplayName()}
        hint="Akışta, GYMO Ligi'nde, mesajlarda ve yorumlarda e-posta yerine bu ad görünür.">
        <DisplayName onSaved={() => setBump((n) => n + 1)} />
      </Section>

      <Section title="🔑 Şifreyi değiştir"
        hint={"Yeni bir şifre belirle. (Şifreni unuttuysan giriş ekranındaki “Şifremi unuttum?”’u kullan.)"}>
        <ChangePassword />
      </Section>

      <Section title="🎨 Görünüm" sub={MODES.find((m) => m.id === themeMode()).label}
        hint="“Sistem” seçiliyken telefonun gece moduna geçtiğinde uygulama da kendiliğinden koyulaşır.">
        <ThemePicker onChange={() => setBump((n) => n + 1)} />
      </Section>

      <Section title="⏰ Antrenman günü hatırlatması" sub={remOn() ? remTime() : "kapalı"}
        hint="Planında bugüne bir program atanmışsa ve henüz yapmadıysan hatırlatır.">
        <ReminderSettings onChange={() => setBump((n) => n + 1)} />
      </Section>

      {snapshot && onRestore && (
        <Section title="💾 Yedekle & geri yükle" sub={history.length + " antrenman"}
          hint="Tüm programların, antrenman geçmişin ve ölçümlerin tek bir dosyaya iner. Hesabına bir şey olursa bu dosyadan geri yüklersin. Dosyayı bulut deponda (iCloud, Drive) sakla.">
          <Backup snapshot={snapshot} onRestore={onRestore} />
        </Section>
      )}

      {admin && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent2)" }}>
          <Admin />
        </div>
      )}

      <div style={{ marginBottom: 16 }}><Achievements history={history} /></div>


      <div className="section-title">Tercihleri güncelle</div>
      <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -4, marginBottom: 12 }}>
        Bu seçimler yalnızca <b>Hazır (otomatik) programları</b> filtreler. Kendi programını oluştururken hiçbir kısıtlama yoktur.
      </p>
      <ProfileForm initial={profile} onSave={onSave} submitLabel="Güncelle" />

      {/* "Uygulamayı Güncelle" düğmesi KALDIRILDI: App.jsx'teki otomatik
          güncelleme (version.json + BUILD_ID karşılaştırması) açılışta,
          90 sn'de bir ve uygulama öne geldiğinde zaten kontrol edip yeniliyor. */}

      <button className="btn-ghost" style={{ width: "100%", marginTop: 20, padding: 14 }} onClick={firebaseLogout}>
        Çıkış Yap
      </button>
    </div>
  );
}
