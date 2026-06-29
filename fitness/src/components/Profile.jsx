import React from "react";
import ProfileForm, { GENDERS, GOALS, STYLES } from "./ProfileForm";
import { firebaseLogout } from "../firebase";

const labelOf = (arr, id) => { const x = arr.find((a) => a.id === id); return x ? x.label : "—"; };

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

      <button className="btn-ghost" style={{ width: "100%", marginTop: 20, padding: 14 }} onClick={firebaseLogout}>
        Çıkış Yap
      </button>
    </div>
  );
}
