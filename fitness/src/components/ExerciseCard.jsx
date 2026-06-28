import React from "react";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ExerciseCard({ ex, onClick }) {
  return (
    <button className="card ex-card" onClick={onClick}>
      <div className="figbox">
        <ExerciseAnimation type={ex.anim} gear={ex.equip} size={120} />
      </div>
      <div className="exname">{ex.name}</div>
      <div className="exmeta">{ex.equip} · {ex.sets}</div>
      <span className="pill lvl">{ex.level}</span>
    </button>
  );
}
