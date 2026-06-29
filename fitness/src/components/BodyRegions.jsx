import React, { useState } from "react";
import { REGIONS, exercisesByRegion } from "../data/exercises";
import { regionImage } from "../data/exerciseImages";
import ExerciseCard from "./ExerciseCard";
import ExerciseDetail from "./ExerciseDetail";

export default function BodyRegions({ onAddToProgram }) {
  const [region, setRegion] = useState(null);
  const [exercise, setExercise] = useState(null);

  if (exercise) {
    return <ExerciseDetail key={exercise.id} ex={exercise} onBack={() => setExercise(null)}
      onAddToProgram={onAddToProgram} onOpenExercise={(ex) => setExercise(ex)} />;
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
          const img = regionImage(r.id);
          return (
            <button key={r.id} className="card region-card" onClick={() => setRegion(r)}>
              <div className="region-thumb">
                <span className="region-emoji">{r.emoji}</span>
                {img && <img src={img} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                <span className="region-tag">{r.name}</span>
              </div>
              <span className="rcount">{count} hareket</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
