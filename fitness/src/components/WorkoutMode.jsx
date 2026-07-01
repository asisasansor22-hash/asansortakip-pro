import React, { useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

const REST_SEC = 60;

function parseSets(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  if (m) return { sets: parseInt(m[1], 10), reps: m[2].trim() };
  return { sets: 1, reps: s || "-" };
}

// Tekrar aralığını ayrıştır: "8-12" -> {low:8, high:12}, "10" -> {low:10, high:10}
function repRange(reps) {
  const m = String(reps || "").match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { low: parseInt(m[1], 10), high: parseInt(m[2], 10) };
  const one = String(reps || "").match(/\d+/);
  if (one) { const n = parseInt(one[0], 10); return { low: n, high: n }; }
  return null;
}
const firstInt = (s) => { const m = String(s || "").match(/\d+/); return m ? parseInt(m[0], 10) : null; };
// Tahmini 1 tekrar maksimumu (Epley)
const est1RM = (w, r) => (w > 0 && r > 0 ? Math.round(w * (1 + r / 30)) : null);

// Progressive overload önerisi: son sefere göre bir sonraki hedef
function overloadSuggestion(prev, metaReps) {
  if (!prev || !prev.weight) return null;
  const w = Number(prev.weight);
  const r = firstInt(prev.reps);
  if (!w || !r) return null;
  const range = repRange(metaReps) || { low: r, high: r };
  // Aralığın üstüne ulaştıysa kiloyu artır, tekrarı aralığın altına çek
  if (r >= range.high) return { weight: Math.round((w + 2.5) * 2) / 2, reps: String(range.low) };
  // Aksi halde aynı kiloda bir tekrar daha hedefle
  return { weight: w, reps: String(r + 1) };
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
  const suggestion = overloadSuggestion(prev, meta.reps);
  const curE1RM = est1RM(Number(weight), firstInt(reps));

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
      setRest((r) => {
        if (r <= 1) {
          clearInterval(timer.current); setResting(false);
          try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }
  function adjustRest(d) { setRest((r) => Math.max(0, r + d)); }
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

      {program.note && (
        <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", margin: "8px 12px 0" }}>ℹ️ {program.note}</p>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div className="figbox" style={{ width: 200, height: 200 }}>
          <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={190} />
        </div>
        <h2 style={{ margin: "6px 0 0", textAlign: "center" }}>{ex.name}</h2>

        {resting ? (
          <>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>Dinlenme</div>
            <div className="rest-count">{rest}<span> sn</span></div>
            <div className="row" style={{ justifyContent: "center", gap: 8 }}>
              <button className="btn-ghost" style={{ padding: "8px 14px" }} onClick={() => adjustRest(-15)}>−15</button>
              <button className="btn-ghost" style={{ padding: "8px 14px" }} onClick={() => adjustRest(15)}>+15</button>
              <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={skipRest}>Atla →</button>
            </div>
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
            {suggestion && (
              <button className="chip on" style={{ marginTop: 4 }}
                onClick={() => { setWeight(String(suggestion.weight)); setReps(String(suggestion.reps)); }}>
                🎯 Hedef: {suggestion.weight} kg × {suggestion.reps} (uygula)
              </button>
            )}
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 6, width: "100%", maxWidth: 320 }}>
              <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <input className="input" type="text" placeholder="Tekrar" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            {curE1RM && (
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                Tahmini 1RM: <b style={{ color: "var(--accent)" }}>~{curE1RM} kg</b>
              </div>
            )}
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
