import React from "react";
import ProfileForm from "./ProfileForm";

// İlk girişte tek seferlik kişiselleştirme ekranı (tam ekran overlay).
export default function Onboarding({ onSave }) {
  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="brand" style={{ fontSize: 26, textAlign: "center" }}>Fit<span style={{ color: "var(--accent)" }}>+be</span></div>
        <h2 style={{ textAlign: "center", marginTop: 6 }}>Seni tanıyalım</h2>
        <p style={{ color: "var(--muted)", textAlign: "center", marginTop: -2, marginBottom: 6 }}>
          Sana uygun <b style={{ color: "var(--accent)" }}>otomatik programları</b> önerebilmemiz için.
          İstediğin zaman Profil'den değiştirebilirsin.
        </p>
        <ProfileForm onSave={onSave} submitLabel="Başla →" />
      </div>
    </div>
  );
}
