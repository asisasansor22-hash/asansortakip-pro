import React, { useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

const REST_SEC = 60;

function parseSets(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  if (m) return { sets: parseInt(m[1], 10), reps: m[2].trim() };
  return { sets: 1, reps: s || "-" };
}

// Antrenman modu: hareket hareket çalış, kilo/tekrar gir, setleri işaretle, dinlen.
export default function WorkoutMode({ program, onExit, onFinish, lastLog }) {
  const exIds = program.exercises.filter((id) => getExercise(id));
  const [i, setI] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [resting, setResting] = useState(false);
  const [rest, setRest] = useState(0);
  const [done, setDone] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const timer = useRef(null);
  const log = useRef([]); // {exId, weight, reps}

  const ex = exIds.length ? getExercise(exIds[i]) : null;
  const meta = ex ? parseSets(ex.sets) : { sets: 1, reps: "-" };
  const prev = ex && lastLog ? lastLog(ex.id) : null;

  // Hareket değişince kilo/tekrar alanlarını son kayıttan / hedeften doldur
  useEffect(() => {
    if (!ex) return;
    setWeight(prev && prev.weight ? String(prev.weight) : "");
    setReps(prev && prev.reps ? String(prev.reps) : meta.reps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => () => clearInterval(timer.current), []);

  if (exIds.length === 0) {
    return (
      <div className="workout">
        <div className="empty">Bu programda hareket yok.</div>
        <button className="btn-primary" onClick={onExit}>Kapat</button>
      </div>
    );
  }

  function startRest() {
    clearInterval(timer.current);
    setResting(true);
    setRest(REST_SEC);
    timer.current = setInterval(() => {
      setRest((r) => { if (r <= 1) { clearInterval(timer.current); setResting(false); return 0; } return r - 1; });
    }, 1000);
  }
  function skipRest() { clearInterval(timer.current); setResting(false); setRest(0); }

  function finishWorkout() {
    if (onFinish && log.current.length) {
      onFinish({ date: Date.now(), program: program.name, sets: log.current.slice() });
    }
    setDone(true);
  }
  function nextExercise() {
    skipRest();
    if (i < exIds.length - 1) { setI(i + 1); setSetNo(1); }
    else finishWorkout();
  }
  function completeSet() {
    log.current.push({ exId: ex.id, weight: weight ? Number(weight) : null, reps: reps || meta.reps });
    if (setNo < meta.sets) { setSetNo(setNo + 1); startRest(); }
    else nextExercise();
  }

  if (done) {
    return (
      <div className="workout" style={{ justifyContent: "center", textAlign: "center", gap: 14 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2>Antrenman tamamlandı!</h2>
        <p style={{ color: "var(--muted)" }}>{exIds.length} hareket · {log.current.length} set bitti. Helal olsun! 💪</p>
        <button className="btn-primary" style={{ maxWidth: 320 }} onClick={onExit}>Bitir</button>
      </div>
    );
  }

  const pct = Math.round((i / exIds.length) * 100);

  return (
    <div className="workout">
      <div className="workout-top">
        <button className="btn-ghost" onClick={onExit}>✕</button>
        <div className="workout-prog"><div className="workout-prog-bar" style={{ width: pct + "%" }} /></div>
        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 48, textAlign: "right" }}>{i + 1}/{exIds.length}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div className="figbox" style={{ width: 200, height: 200 }}>
          <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={190} />
        </div>
        <h2 style={{ margin: "6px 0 0", textAlign: "center" }}>{ex.name}</h2>

        {resting ? (
          <>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>Dinlenme</div>
            <div className="rest-count">{rest}<span> sn</span></div>
            <button className="btn-ghost" style={{ padding: "10px 18px" }} onClick={skipRest}>Atla →</button>
          </>
        ) : (
          <>
            <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 2 }}>
              <span className="pill" style={{ fontSize: 14 }}>Set {setNo} / {meta.sets}</span>
              <span className="pill lvl" style={{ fontSize: 14 }}>Hedef: {meta.reps}</span>
            </div>
            {prev && (prev.weight || prev.reps) && (
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Son: {prev.weight ? prev.weight + " kg" : ""}{prev.weight && prev.reps ? " × " : ""}{prev.reps || ""}
              </div>
            )}
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 6, width: "100%", maxWidth: 320 }}>
              <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <input className="input" type="text" placeholder="Tekrar" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
          </>
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
