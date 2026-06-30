import React, { useState } from "react";

export const GENDERS = [
  { id: "erkek", label: "♂ Erkek" },
  { id: "kadin", label: "♀ Kadın" },
];
export const GOALS = [
  { id: "yagver", label: "Yağ ver" },
  { id: "kasyap", label: "Kas yap" },
  { id: "fitkal", label: "Fit kal" },
];
export const STYLES = [
  { id: "salon", label: "🏋️ Salon" },
  { id: "ev", label: "🏠 Evde" },
  { id: "kalistenik", label: "🤸 Kalistenik" },
  { id: "kosu", label: "🏃 Koşu" },
  { id: "pilates", label: "🧘 Pilates" },
];

// gender/goal/style seçimi — hem onboarding hem profil için ortak.
export default function ProfileForm({ initial, onSave, submitLabel = "Kaydet" }) {
  const [gender, setGender] = useState((initial && initial.gender) || "erkek");
  const [goal, setGoal] = useState((initial && initial.goal) || "fitkal");
  const [style, setStyle] = useState((initial && initial.style) || "salon");
  const [done, setDone] = useState(false);

  function save() {
    onSave({ gender, goal, style });
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="section-title" style={{ margin: "0 2px 8px" }}>Cinsiyet</div>
        <div className="row">
          {GENDERS.map((g) => (
            <button key={g.id} className={"seg" + (gender === g.id ? " on" : "")} onClick={() => setGender(g.id)}>{g.label}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="section-title" style={{ margin: "0 2px 8px" }}>Hedef</div>
        <div className="row">
          {GOALS.map((g) => (
            <button key={g.id} className={"seg" + (goal === g.id ? " on" : "")} onClick={() => setGoal(g.id)}>{g.label}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="section-title" style={{ margin: "0 2px 8px" }}>Antrenman stili</div>
        <div className="grid">
          {STYLES.map((s) => (
            <button key={s.id} className={"seg" + (style === s.id ? " on" : "")} onClick={() => setStyle(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={save}>{done ? "✓ Kaydedildi" : submitLabel}</button>
    </div>
  );
}
