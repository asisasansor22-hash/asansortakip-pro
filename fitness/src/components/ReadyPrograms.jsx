import React, { useState } from "react";
import { READY_PROGRAMS } from "../data/programs";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ReadyPrograms({ onCopy, profile }) {
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showAll, setShowAll] = useState(false);

  function copy(p) {
    if (onCopy) onCopy(p);
    setCopied(p.id);
    setTimeout(() => setCopied(null), 1800);
  }

  // Profil filtresi: cinsiyet (uygun veya herkes) + stil eşleşmesi.
  // Hedef eşleşmesi sıralamada öne alır. "Tümünü gör" tüm programları açar.
  let list = READY_PROGRAMS;
  if (profile && !showAll) {
    list = READY_PROGRAMS.filter((p) =>
      (p.gender === "herkes" || p.gender === profile.gender) && p.style === profile.style
    );
    if (list.length === 0) {
      list = READY_PROGRAMS.filter((p) => p.gender === "herkes" || p.gender === profile.gender);
    }
    list = [...list].sort((a, b) => (b.goalTag === profile.goal) - (a.goalTag === profile.goal));
  }

  return (
    <div>
      <h2>Hazır Programlar</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        {profile && !showAll ? "Profiline göre önerilen programlar." : "Tüm hazır programlar."} Kopyala, "Programım"da düzenle.
      </p>

      {profile && (
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={"seg" + (!showAll ? " on" : "")} onClick={() => setShowAll(false)}>Bana özel</button>
          <button className={"seg" + (showAll ? " on" : "")} onClick={() => setShowAll(true)}>Tümünü gör</button>
        </div>
      )}

      {list.map((p) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{p.goal} · {p.freq}</div>
              </div>
              <span className="pill lvl">{p.level}</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0" }}>{p.desc}</p>

            <div className="row">
              <button className="icon-btn" onClick={() => setOpen(isOpen ? null : p.id)}>
                {isOpen ? "Gizle" : "Detay"}
              </button>
              <button className="icon-btn" style={{ color: "var(--accent)" }} onClick={() => copy(p)}>
                {copied === p.id ? "✓ Kopyalandı" : "Programlarıma Kopyala"}
              </button>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12 }}>
                {p.days.map((d, di) => (
                  <div key={di} style={{ marginBottom: 14 }}>
                    <div className="section-title" style={{ margin: "6px 4px" }}>{d.name}</div>
                    {d.note && <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 4px 8px" }}>{d.note}</p>}
                    {d.exercises && d.exercises.length > 0 && (
                      <div className="grid">
                        {d.exercises.map((exId) => {
                          const ex = getExercise(exId);
                          if (!ex) return null;
                          return (
                            <div key={exId} className="card ex-card" style={{ padding: 8 }}>
                              <div className="figbox"><ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={84} still /></div>
                              <div className="exname" style={{ fontSize: 12 }}>{ex.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
