import React, { useState } from "react";
import { REGIONS, exercisesByRegion } from "../data/exercises";
import ExerciseCard from "./ExerciseCard";
import ExerciseDetail from "./ExerciseDetail";

export default function BodyRegions({ onAddToProgram }) {
  const [region, setRegion] = useState(null);
  const [exercise, setExercise] = useState(null);

  if (exercise) {
    return <ExerciseDetail ex={exercise} onBack={() => setExercise(null)} onAddToProgram={onAddToProgram} />;
  }

  if (region) {
    const list = exercisesByRegion(region.id);
    return (
      <div>
        <button className="btn-back" onClick={() => setRegion(null)}>← Bölgeler</button>
        <h2>{region.emoji} {region.name}</h2>
        <div className="grid">
          {list.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} onClick={() => setExercise(ex)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Bölge Seç</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Çalışmak istediğin kası seç, hareketleri gör.</p>
      <div className="grid">
        {REGIONS.map((r) => {
          const count = exercisesByRegion(r.id).length;
          return (
            <button key={r.id} className="card region-card" onClick={() => setRegion(r)}>
              <span className="emoji">{r.emoji}</span>
              <span className="rname">{r.name}</span>
              <span className="rcount">{count} hareket</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
