import React from "react";
import ExerciseAnimation from "./ExerciseAnimation";
import { topNote, focusOf } from "../data/exercises";

export default function ExerciseCard({ ex, onClick }) {
  const top = topNote(ex.id);
  const focus = focusOf(ex.id);
  return (
    <button className="card ex-card" onClick={onClick}>
      <div className="figbox" style={{ position: "relative" }}>
        {top && <span className="top-badge">⭐ En Etkili</span>}
        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={120} still />
      </div>
      <div className="exname">{ex.name}</div>
      <div className="exmeta">{ex.equip} · {ex.sets}</div>
      {focus && (
        <div style={{ color: "var(--accent2)", fontSize: 10, lineHeight: 1.25, marginTop: 3, opacity: 0.95 }}>
          🎯 {focus}
        </div>
      )}
      <span className="pill lvl">{ex.level}</span>
    </button>
  );
}
