import React, { useState } from "react";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ExerciseDetail({ ex, onBack, onAddToProgram }) {
  const [added, setAdded] = useState(false);

  function add() {
    if (onAddToProgram) onAddToProgram(ex);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <button className="btn-back" onClick={onBack}>← Geri</button>
      <div className="detail-hero">
        <ExerciseAnimation type={ex.anim} size={220} />
      </div>
      <h2>{ex.name}</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="pill">{ex.equip}</span>
        <span className="pill lvl">{ex.level}</span>
        <span className="pill">{ex.sets}</span>
      </div>
      <p style={{ color: "var(--text)", lineHeight: 1.5 }}>{ex.desc}</p>

      <div className="section-title">İpuçları</div>
      <ul className="tips">
        {ex.tips.map((t, i) => <li key={i}>✅ {t}</li>)}
      </ul>

      <div style={{ marginTop: 18 }}>
        <button className="btn-primary" onClick={add}>
          {added ? "✓ Programına eklendi" : "+ Programıma Ekle"}
        </button>
      </div>
    </div>
  );
}
