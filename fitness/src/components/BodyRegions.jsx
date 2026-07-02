import React, { useState } from "react";
import { REGIONS, EXERCISES, exercisesByRegion, topNote } from "../data/exercises";
import { regionImage } from "../data/exerciseImages";
import ExerciseCard from "./ExerciseCard";
import ExerciseDetail from "./ExerciseDetail";

const EQUIP_CHIPS = [
  { id: "all", label: "Tümü" },
  { id: "ekipmansiz", label: "Ekipmansız" },
  { id: "dumbbell", label: "Dumbbell" },
  { id: "halter", label: "Halter" },
  { id: "makine", label: "Makine" },
];
const LEVEL_CHIPS = [
  { id: "all", label: "Her seviye" },
  { id: "Başlangıç", label: "Başlangıç" },
  { id: "Orta", label: "Orta" },
  { id: "İleri", label: "İleri" },
];

function matchEquip(equip, f) {
  if (f === "all") return true;
  if (f === "ekipmansiz") return /vücut/i.test(equip);
  if (f === "dumbbell") return /dumbbell/i.test(equip);
  if (f === "halter") return /halter/i.test(equip);
  if (f === "makine") return /makine/i.test(equip);
  return true;
}

export default function BodyRegions({ onAddToProgram, favorites = [], onToggleFavorite }) {
  const [region, setRegion] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [equipF, setEquipF] = useState("all");
  const [levelF, setLevelF] = useState("all");
  const [topOnly, setTopOnly] = useState(false);

  if (exercise) {
    return <ExerciseDetail key={exercise.id} ex={exercise} onBack={() => setExercise(null)}
      onAddToProgram={onAddToProgram} onOpenExercise={(ex) => setExercise(ex)}
      isFavorite={favorites.includes(exercise.id)} onToggleFavorite={onToggleFavorite} />;
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

  const q = search.trim().toLocaleLowerCase("tr");
  const filtering = q || equipF !== "all" || levelF !== "all" || topOnly;
  const results = filtering
    ? EXERCISES.filter((e) =>
        (!q || e.name.toLocaleLowerCase("tr").includes(q)) &&
        matchEquip(e.equip, equipF) &&
        (levelF === "all" || e.level === levelF) &&
        (!topOnly || topNote(e.id))
      )
    : null;

  return (
    <div>
      <h2>Bölge Seç</h2>
      <input className="search-input" placeholder="🔍 Hareket ara…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="chips">
        <button className={"chip" + (topOnly ? " on" : "")} onClick={() => setTopOnly((v) => !v)}>⭐ En Etkili</button>
        {EQUIP_CHIPS.map((c) => (
          <button key={c.id} className={"chip" + (equipF === c.id ? " on" : "")} onClick={() => setEquipF(c.id)}>{c.label}</button>
        ))}
      </div>
      <div className="chips">
        {LEVEL_CHIPS.map((c) => (
          <button key={c.id} className={"chip" + (levelF === c.id ? " on" : "")} onClick={() => setLevelF(c.id)}>{c.label}</button>
        ))}
      </div>

      {!filtering && favorites.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div className="section-title" style={{ margin: "8px 4px" }}>⭐ Favorilerim</div>
          <div className="grid">
            {favorites.map((id) => {
              const ex = EXERCISES.find((e) => e.id === id);
              if (!ex) return null;
              return <ExerciseCard key={id} ex={ex} onClick={() => setExercise(ex)} />;
            })}
          </div>
        </div>
      )}

      {filtering ? (
        <div>
          <div style={{ color: "var(--muted)", fontSize: 13, margin: "4px 2px 10px" }}>{results.length} hareket bulundu</div>
          {results.length > 0 ? (
            <div className="grid">
              {results.map((ex) => <ExerciseCard key={ex.id} ex={ex} onClick={() => setExercise(ex)} />)}
            </div>
          ) : (
            <div className="empty">Eşleşen hareket yok. Filtreleri değiştir.</div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
