import React, { useState } from "react";
import ExerciseAnimation from "./ExerciseAnimation";
import { topNote, getAlternatives } from "../data/exercises";
import { getMuscles } from "../data/exerciseMuscles";

export default function ExerciseDetail({ ex, onBack, onAddToProgram, onOpenExercise }) {
  const [added, setAdded] = useState(false);
  const top = topNote(ex.id);
  const alts = getAlternatives(ex.id);
  const muscles = getMuscles(ex.id);

  function add() {
    if (onAddToProgram) onAddToProgram(ex);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      <button className="btn-back" onClick={onBack}>← Geri</button>
      <div className="detail-hero">
        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={220} />
      </div>
      <h2>{ex.name}</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="pill">{ex.equip}</span>
        <span className="pill lvl">{ex.level}</span>
        <span className="pill">{ex.sets}</span>
      </div>
      <p style={{ color: "var(--text)", lineHeight: 1.5 }}>{ex.desc}</p>

      {muscles && (muscles.p.length > 0 || muscles.s.length > 0) && (
        <div style={{ marginTop: 12 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Çalışan kaslar</div>
          <div className="row">
            {muscles.p.map((m) => <span key={m} className="pill musc-p">{m}</span>)}
            {muscles.s.map((m) => <span key={m} className="pill musc-s">{m}</span>)}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>● Birincil &nbsp; ○ İkincil</div>
        </div>
      )}

      {top && (
        <div className="evidence">⭐ <b>En Etkili</b> — {top}</div>
      )}

      <div className="section-title">İpuçları</div>
      <ul className="tips">
        {ex.tips.map((t, i) => <li key={i}>✅ {t}</li>)}
      </ul>

      {alts.length > 0 && (
        <div>
          <div className="section-title">🔄 Alet yoksa alternatif</div>
          <div className="grid">
            {alts.map((a) => (
              <button key={a.id} className="card ex-card" style={{ padding: 8 }}
                onClick={() => onOpenExercise && onOpenExercise(a)}>
                <div className="figbox"><ExerciseAnimation type={a.anim} gear={a.equip} exId={a.id} size={84} /></div>
                <div className="exname" style={{ fontSize: 12 }}>{a.name}</div>
                <div className="exmeta">{a.equip}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <button className="btn-primary" onClick={add}>
          {added ? "✓ Programına eklendi" : "+ Programıma Ekle"}
        </button>
      </div>
    </div>
  );
}
