import React, { useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

const REST_SEC = 60;

function parseSets(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  if (m) return { sets: parseInt(m[1], 10), reps: m[2].trim() };
  return { sets: 1, reps: s || "-" };
}

// Antrenman modu: bir programı hareket hareket çalış, setleri işaretle, dinlen.
export default function WorkoutMode({ program, onExit }) {
  const exIds = program.exercises.filter((id) => getExercise(id));
  const [i, setI] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [resting, setResting] = useState(false);
  const [rest, setRest] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  if (exIds.length === 0) {
    return (
      <div className="workout">
        <div className="empty">Bu programda hareket yok.</div>
        <button className="btn-primary" onClick={onExit}>Kapat</button>
      </div>
    );
  }

  const ex = getExercise(exIds[i]);
  const meta = parseSets(ex.sets);

  function startRest() {
    clearInterval(timer.current);
    setResting(true);
    setRest(REST_SEC);
    timer.current = setInterval(() => {
      setRest((r) => {
        if (r <= 1) { clearInterval(timer.current); setResting(false); return 0; }
        return r - 1;
      });
    }, 1000);
  }
  function skipRest() { clearInterval(timer.current); setResting(false); setRest(0); }

  function nextExercise() {
    skipRest();
    if (i < exIds.length - 1) { setI(i + 1); setSetNo(1); }
    else setDone(true);
  }
  function completeSet() {
    if (setNo < meta.sets) { setSetNo(setNo + 1); startRest(); }
    else nextExercise();
  }

  if (done) {
    return (
      <div className="workout" style={{ justifyContent: "center", textAlign: "center", gap: 14 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2>Antrenman tamamlandı!</h2>
        <p style={{ color: "var(--muted)" }}>{exIds.length} hareketi bitirdin. Helal olsun! 💪</p>
        <button className="btn-primary" style={{ maxWidth: 320 }} onClick={onExit}>Bitir</button>
      </div>
    );
  }

  const pct = Math.round((i / exIds.length) * 100);

  return (
    <div className="workout">
      <div className="workout-top">
        <button className="btn-ghost" onClick={onExit}>✕</button>
        <div className="workout-prog">
          <div className="workout-prog-bar" style={{ width: pct + "%" }} />
        </div>
        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 48, textAlign: "right" }}>{i + 1}/{exIds.length}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div className="figbox" style={{ width: 220, height: 220 }}>
          <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={210} />
        </div>
        <h2 style={{ margin: "8px 0 0", textAlign: "center" }}>{ex.name}</h2>

        {resting ? (
          <>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>Dinlenme</div>
            <div className="rest-count">{rest}<span> sn</span></div>
            <button className="btn-ghost" style={{ padding: "10px 18px" }} onClick={skipRest}>Atla →</button>
          </>
        ) : (
          <div className="row" style={{ justifyContent: "center", gap: 14, marginTop: 4 }}>
            <span className="pill" style={{ fontSize: 14 }}>Set {setNo} / {meta.sets}</span>
            <span className="pill lvl" style={{ fontSize: 14 }}>{meta.reps}</span>
          </div>
        )}
      </div>

      {!resting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn-primary" onClick={completeSet}>
            {setNo < meta.sets ? "✓ Set tamamlandı" : "✓ Hareketi bitir"}
          </button>
          <button className="btn-ghost" style={{ padding: 12 }} onClick={nextExercise}>Sonraki hareket →</button>
        </div>
      )}
    </div>
  );
}
