import React, { useState } from "react";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";
import WeeklyPlan from "./WeeklyPlan";

const DAY_LETTERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const todayIdx = () => (new Date().getDay() + 6) % 7; // Pzt=0

// "4 x 8-10" -> { n: 4, reps: "8-10" }. Sayı x tekrar biçimi değilse (ör.
// "10-20 dk" kardiyo) null döner → set sayısı ayarlanamaz, ham metin gösterilir.
function parseSetCount(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  return m ? { n: parseInt(m[1], 10), reps: m[2].trim() } : null;
}

export default function ProgramBuilder({
  programs, schedule, history, onSetSchedule, onCreate, onDelete, onRemoveExercise, onMoveExercise, onSetCount, onStart,
}) {
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState(null);
  const [dayPickerId, setDayPickerId] = useState(null);
  const [selDay, setSelDay] = useState(todayIdx()); // Haftalık Plan'da seçili gün
  const [showAll, setShowAll] = useState(false);    // gün filtresini kapat, tümünü listele
  const sch = schedule || {};

  // Seçili günün programı — varsa (ve 'tümü' kapalıysa) liste sadece onu gösterir
  const selProg = programs.find((p) => p.id === sch[selDay]);
  const visible = (!showAll && selProg) ? [selProg] : programs;

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
        Kendi programını oluştur; hareketleri Bölgeler'den "Programıma Ekle" ile seç. Üstte gün seçince o günün programı listelenir.
      </p>

      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Yeni program adı (örn. Pazartesi - Göğüs)"
          value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="icon-btn" onClick={create}>+ Oluştur</button>
      </div>

      {programs.length > 0 && (
        <WeeklyPlan programs={programs} schedule={schedule} history={history}
          onSetSchedule={onSetSchedule} onStart={onStart} sel={selDay} onSel={(d) => { setSelDay(d); setShowAll(false); }} />
      )}

      {programs.length === 0 && (
        <div className="empty">Henüz programın yok.<br />Yukarıdan bir program oluştur, sonra bölgelerden hareket ekle. 💪</div>
      )}

      {programs.length > 0 && (
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", margin: "0 2px 10px" }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {(!showAll && selProg) ? "📅 " + DAY_FULL[selDay] + " programı" : "Tüm programlar (" + programs.length + ")"}
          </span>
          {selProg && (
            <button className="icon-btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Sadece " + DAY_LETTERS[selDay] : "Tümünü göster (" + programs.length + ")"}
            </button>
          )}
        </div>
      )}

      {visible.map((p) => {
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
                  const parsed = parseSetCount(ex.sets);
                  const cur = (p.sets && p.sets[exId] != null) ? p.sets[exId] : (parsed ? parsed.n : null);
                  const repsShown = (p.reps && p.reps[exId] != null) ? String(p.reps[exId]) : (parsed ? parsed.reps : null);
                  return (
                    <div key={exId + "-" + i} className="prog-ex-row">
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                        <button className="icon-btn" disabled={i === 0}
                          style={{ padding: "2px 8px", fontSize: 13, opacity: i === 0 ? 0.3 : 1 }}
                          onClick={() => onMoveExercise(p.id, i, -1)}>▲</button>
                        <button className="icon-btn" disabled={i === p.exercises.length - 1}
                          style={{ padding: "2px 8px", fontSize: 13, opacity: i === p.exercises.length - 1 ? 0.3 : 1 }}
                          onClick={() => onMoveExercise(p.id, i, 1)}>▼</button>
                      </div>
                      <div className="figbox" style={{ width: 56, height: 56, padding: 0 }}>
                        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={52} still />
                      </div>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
                        {cur != null ? (
                          <div className="row" style={{ gap: 6, alignItems: "center", marginTop: 4 }}>
                            <button className="icon-btn" disabled={cur <= 1}
                              style={{ padding: "2px 9px", fontSize: 15, opacity: cur <= 1 ? 0.3 : 1 }}
                              onClick={() => onSetCount && onSetCount(p.id, exId, cur - 1)}>−</button>
                            <span style={{ fontWeight: 700, fontSize: 13, minWidth: 42, textAlign: "center" }}>{cur} set</span>
                            <button className="icon-btn" disabled={cur >= 12}
                              style={{ padding: "2px 9px", fontSize: 15, opacity: cur >= 12 ? 0.3 : 1 }}
                              onClick={() => onSetCount && onSetCount(p.id, exId, cur + 1)}>＋</button>
                            {repsShown && <span style={{ color: "var(--muted)", fontSize: 12 }}>× {repsShown}</span>}
                          </div>
                        ) : (
                          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{i + 1}. sıra · {ex.sets}</div>
                        )}
                      </div>
                      <button className="icon-btn danger" onClick={() => onRemoveExercise(p.id, i)} style={{ alignSelf: "flex-start" }}>×</button>
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
