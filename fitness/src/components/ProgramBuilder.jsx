import React, { useState } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ProgramBuilder({
  programs, activeId, onCreate, onDelete, onSetActive, onRemoveExercise, onStart,
}) {
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState(activeId);

  function create() {
    const n = newName.trim();
    if (!n) return;
    onCreate(n);
    setNewName("");
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

      {programs.length === 0 && (
        <div className="empty">Henüz programın yok.<br />Yukarıdan bir program oluştur, sonra bölgelerden hareket ekle. 💪</div>
      )}

      {programs.map((p) => {
        const isActive = p.id === activeId;
        const open = p.id === openId;
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12, borderColor: isActive ? "var(--accent)" : "var(--line)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button onClick={() => setOpenId(open ? null : p.id)}
                style={{ background: "none", color: "var(--text)", fontWeight: 700, fontSize: 16, flex: 1, textAlign: "left" }}>
                {p.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({p.exercises.length})</span>
              </button>
              {isActive
                ? <span className="pill" style={{ color: "var(--accent)" }}>Aktif</span>
                : <button className="icon-btn" onClick={() => onSetActive(p.id)}>Aktif yap</button>}
              <button className="icon-btn danger" onClick={() => onDelete(p.id)}>Sil</button>
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
                        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={52} />
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
