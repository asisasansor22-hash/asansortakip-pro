import React, { useState } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";
import WeeklyPlan from "./WeeklyPlan";

const DAY_LETTERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function ProgramBuilder({
  programs, schedule, history, onSetSchedule, onCreate, onDelete, onRemoveExercise, onStart,
}) {
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState(activeId);
  const [dayPickerId, setDayPickerId] = useState(null);
  const sch = schedule || {};

  function create() {
    const n = newName.trim();
    if (!n) return;
    onCreate(n);
    setNewName("");
  }

  // Bu program hangi günlere atanmış (birden fazla olabilir, ör. Full Body Pzt+Çar+Cum)
  function daysOf(programId) {
    return Object.keys(sch).filter((k) => sch[k] === programId).map(Number);
  }
  function toggleDay(program, dayIdx) {
    const isAssigned = sch[dayIdx] === program.id;
    onSetSchedule(dayIdx, isAssigned ? null : program.id);
  }

  return (
    <div>
      <h2>Programlarım</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        Kendi programını oluştur. <b style={{ color: "var(--accent)" }}>Aktif</b> programa, hareket detayından "Programıma Ekle" ile hareket eklenir.
      </p>

      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Yeni program adı (örn. Pazartesi - Göğüs)"
          value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="icon-btn" onClick={create}>+ Oluştur</button>
      </div>

      {programs.length > 0 && (
        <WeeklyPlan programs={programs} schedule={schedule} history={history}
          onSetSchedule={onSetSchedule} onStart={onStart} />
      )}

      {programs.length === 0 && (
        <div className="empty">Henüz programın yok.<br />Yukarıdan bir program oluştur, sonra bölgelerden hareket ekle. 💪</div>
      )}

      {programs.map((p) => {
        const open = p.id === openId;
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button onClick={() => setOpenId(open ? null : p.id)}
                style={{ background: "none", color: "var(--text)", fontWeight: 700, fontSize: 16, flex: 1, textAlign: "left" }}>
                {p.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({p.exercises.length})</span>
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(p.id)}>Sil</button>
            </div>

            {p.note && (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "8px 0 0" }}>ℹ️ {p.note}</p>
            )}

            <div style={{ marginTop: 10 }}>
              <button className="icon-btn" style={{ fontSize: 12, padding: "5px 10px" }}
                onClick={() => setDayPickerId(dayPickerId === p.id ? null : p.id)}>
                📅 {daysOf(p.id).length > 0
                  ? daysOf(p.id).map((d) => DAY_LETTERS[d]).join(", ")
                  : "Güne ata"}
              </button>
              {dayPickerId === p.id && (
                <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {DAY_LETTERS.map((d, i) => {
                    const on = sch[i] === p.id;
                    return (
                      <button key={i} onClick={() => toggleDay(p, i)}
                        style={{
                          padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: on ? "var(--accent)" : "var(--card2)",
                          color: on ? "#04321f" : "var(--text)",
                        }}>{d}</button>
                    );
                  })}
                </div>
              )}
            </div>

            {p.exercises.length > 0 && (
              <button className="btn-primary" style={{ marginTop: 10, padding: 12 }} onClick={() => onStart(p)}>
                ▶ Antrenmanı Başlat
              </button>
            )}

            {open && (
              <div style={{ marginTop: 12 }}>
                {p.exercises.length === 0 && <div className="empty" style={{ padding: 18 }}>Bu programda hareket yok.</div>}
                {p.exercises.map((exId, i) => {
                  const ex = getExercise(exId);
                  if (!ex) return null;
                  return (
                    <div key={i} className="prog-ex-row">
                      <div className="figbox" style={{ width: 56, height: 56, padding: 0 }}>
                        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={52} still />
                      </div>
                      <div className="grow">
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{ex.sets}</div>
                      </div>
                      <button className="icon-btn danger" onClick={() => onRemoveExercise(p.id, i)}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
