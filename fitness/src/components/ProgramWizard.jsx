import React, { useMemo, useState } from "react";
import { generateProgram } from "../data/programGenerator";
import { getExercise } from "../data/exercises";

const GOALS = [
  { id: "kasyap", label: "💪 Kütle" },
  { id: "guc", label: "🏋️ Güç" },
  { id: "yagver", label: "🔥 Yağ Yakım" },
  { id: "fitkal", label: "🧘 Form" },
];
const DAYS = [2, 3, 4, 5];
const EQUIPS = [
  { id: "full", label: "🏢 Salon" },
  { id: "dumbbell", label: "🏠 Ev (Dumbbell)" },
  { id: "bodyweight", label: "🤸 Ekipmansız" },
];

// 🪄 Program Sihirbazı — hedef/gün/ekipman sor, otomatik program üret, önizle, ekle.
export default function ProgramWizard({ onGenerate, onClose }) {
  const [goal, setGoal] = useState("kasyap");
  const [days, setDays] = useState(3);
  const [equip, setEquip] = useState("full");

  const program = useMemo(() => generateProgram({ goal, days, equip }), [goal, days, equip]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0", maxHeight: "88vh", overflowY: "auto",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>🪄 Program Sihirbazı</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Hedefin</div>
        <div className="chips" style={{ marginBottom: 12 }}>
          {GOALS.map((g) => <button key={g.id} className={"chip" + (goal === g.id ? " on" : "")} onClick={() => setGoal(g.id)}>{g.label}</button>)}
        </div>

        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Haftada kaç gün</div>
        <div className="chips" style={{ marginBottom: 12 }}>
          {DAYS.map((d) => <button key={d} className={"chip" + (days === d ? " on" : "")} onClick={() => setDays(d)}>{d} gün</button>)}
        </div>

        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Ekipman</div>
        <div className="chips" style={{ marginBottom: 14 }}>
          {EQUIPS.map((e) => <button key={e.id} className={"chip" + (equip === e.id ? " on" : "")} onClick={() => setEquip(e.id)}>{e.label}</button>)}
        </div>

        <div className="section-title" style={{ marginTop: 4 }}>Önizleme · {program.days.length} gün</div>
        {program.days.map((d, i) => (
          <div key={i} className="card" style={{ marginBottom: 8, padding: 10, background: "var(--card2)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{d.name}</div>
            {d.exercises.map((id) => {
              const ex = getExercise(id);
              if (!ex) return null;
              return (
                <div key={id} className="row" style={{ justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                  <span>{ex.name}</span>
                  <span style={{ color: "var(--muted)" }}>{d.sets[id]} × {d.reps[id]}</span>
                </div>
              );
            })}
          </div>
        ))}

        <button className="btn-primary" style={{ marginTop: 8, padding: 14 }}
          onClick={() => { onGenerate(program); onClose(); }}>
          ✓ Bu Programı Ekle
        </button>
        <p style={{ color: "var(--muted)", fontSize: 11, textAlign: "center", marginTop: 8 }}>
          Her gün ayrı program olarak eklenir; sonra Haftalık Plan'dan günlere atayabilirsin.
        </p>
      </div>
    </div>
  );
}
