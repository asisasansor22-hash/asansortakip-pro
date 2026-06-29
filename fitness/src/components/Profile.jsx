import React from "react";
import ProfileForm, { GENDERS, GOALS, STYLES } from "./ProfileForm";
import { firebaseLogout } from "../firebase";

const labelOf = (arr, id) => { const x = arr.find((a) => a.id === id); return x ? x.label : "—"; };

// Profil sekmesi — tercihleri değiştir + çıkış.
export default function Profile({ profile, email, onSave }) {
  return (
    <div>
      <h2>Profil</h2>
      {email && <p style={{ color: "var(--muted)", marginTop: -4 }}>{email}</p>}

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
