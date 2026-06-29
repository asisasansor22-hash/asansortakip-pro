import React from "react";
import ExerciseAnimation from "./ExerciseAnimation";
import { topNote } from "../data/exercises";

export default function ExerciseCard({ ex, onClick }) {
  const top = topNote(ex.id);
  return (
    <button className="card ex-card" onClick={onClick}>
      <div className="figbox" style={{ position: "relative" }}>
        {top && <span className="top-badge">⭐ En Etkili</span>}
        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={120} />
      </div>
      <div className="exname">{ex.name}</div>
      <div className="exmeta">{ex.equip} · {ex.sets}</div>
      <span className="pill lvl">{ex.level}</span>
    </button>
  );
}
