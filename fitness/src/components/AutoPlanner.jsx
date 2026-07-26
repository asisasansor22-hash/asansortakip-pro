import React, { useState, useMemo } from "react";
import { buildAutoPlan, EMPHASIS, TARGET_MIN } from "../data/autoPlan";
import { getExercise } from "../data/exercises";
import { tensionOf, TENSION_LABEL } from "../data/tension";
import VolumeSummary from "./VolumeSummary";

const DAYS = [2, 3, 4, 5, 6];
const GOALS = [
  { id: "kasyap", name: "Kas kütlesi" },
  { id: "yagver", name: "Yağ yakım" },
  { id: "guc", name: "Güç" },
  { id: "fitkal", name: "Genel form" },
];
const EQUIPS = [
  { id: "full", name: "Salon (tam ekipman)" },
  { id: "dumbbell", name: "Ev (dumbbell)" },
  { id: "bodyweight", name: "Ekipmansız" },
];

// 🗓️ Haftada kaç gün gideceksen ona göre, kas başına haftada en az 10 set
// verecek şekilde otomatik program üretir (bkz. docs/antrenman-bilimi.md).
export default function AutoPlanner({ onCopy, onClose }) {
  const [days, setDays] = useState(4);
  const [goal, setGoal] = useState("kasyap");
  const [equip, setEquip] = useState("full");
  const [emphasis, setEmphasis] = useState("denge");
  const [added, setAdded] = useState(false);

  const plan = useMemo(
    () => buildAutoPlan({ days, goal, equip, emphasis }),
    [days, goal, equip, emphasis]
  );

  function addAll() {
    if (!onCopy) return;
    onCopy({ name: plan.name, days: plan.days });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0", maxHeight: "92vh", overflowY: "auto",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>🗓️ Gün Sayısına Göre Program</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -2, marginBottom: 12 }}>
          Haftada kaç gün gideceğini seç; program kas başına <b>haftada en az {TARGET_MIN} set</b> verecek
          şekilde otomatik kurulur ve her bölgeye <b>gerilme (uzun boy)</b> hareketi eklenir.
        </p>

        {/* Gün sayısı */}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Haftada kaç gün?</div>
        <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {DAYS.map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={"chip" + (days === d ? " on" : "")}
              style={{ minWidth: 52, fontWeight: 700 }}>
              {d} gün
            </button>
          ))}
        </div>

        {/* Hedef */}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Hedef</div>
        <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)} className={"chip" + (goal === g.id ? " on" : "")}>{g.name}</button>
          ))}
        </div>

        {/* Ekipman */}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Ekipman</div>
        <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {EQUIPS.map((e) => (
            <button key={e.id} onClick={() => setEquip(e.id)} className={"chip" + (equip === e.id ? " on" : "")}>{e.name}</button>
          ))}
        </div>

        {/* Vurgu */}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Vurgu</div>
        <div className="row" style={{ gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
          {Object.keys(EMPHASIS).map((k) => (
            <button key={k} onClick={() => setEmphasis(k)} className={"chip" + (emphasis === k ? " on" : "")}>{EMPHASIS[k].name}</button>
          ))}
        </div>
        <p style={{ color: "var(--muted)", fontSize: 11, margin: "0 0 14px" }}>
          Vurgu bir tercihtir, cinsiyete bağlı zorunluluk değil. Kadınlar ve erkekler benzer
          göreli hızda kas geliştirir; hacim hedefi ikisinde de aynıdır.
        </p>

        {/* Sonuç */}
        <div className="card" style={{ background: "var(--card2)", marginBottom: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{plan.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{plan.split}</div>
            </div>
            <span className="pill" style={{ fontSize: 11, color: plan.meets ? "var(--ok)" : "var(--attn)" }}>
              {plan.meets ? "✓ Hacim yeterli" : "⚠ Bazı bölgeler eksik"}
            </span>
          </div>
          <VolumeSummary days={plan.days} title="" showTension />
          {!plan.meets && (
            <p style={{ color: "var(--attn)", fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
              {days <= 2
                ? "Haftada 2 günle tüm kaslara 10+ set vermek zordur — bu bölünme bileşiklere öncelik verir. Hipertrofi önceliğinse 3+ gün öneririz."
                : "Gün başına hareket sınırı nedeniyle bazı bölgeler hedefin altında kaldı; gün sayısını artırabilirsin."}
            </p>
          )}
        </div>

        {/* Günler */}
        {plan.days.map((d, di) => (
          <div key={di} className="card" style={{ marginBottom: 8, padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{d.name}</div>
            {d.exercises.map((id) => {
              const ex = getExercise(id);
              if (!ex) return null;
              const t = tensionOf(id);
              const lab = t ? TENSION_LABEL[t.p] : null;
              return (
                <div key={id} className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 }}>
                  <span style={{ fontSize: 13, minWidth: 0 }}>
                    {lab ? lab.emoji + " " : ""}{ex.name}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>
                    {d.sets[id]} × {d.reps[id]}
                  </span>
                </div>
              );
            })}
            <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>{d.note}</div>
          </div>
        ))}

        <p style={{ color: "var(--muted)", fontSize: 11, margin: "8px 0 10px" }}>
          🔵 gerilme (uzun boy) · ⚪ orta açı · 🟠 kasılma (kısa boy) — her bölgede en az bir 🔵 bulunur.
        </p>

        <button className="btn-primary" style={{ width: "100%", padding: 14 }} onClick={addAll}>
          {added ? "✓ Programıma eklendi" : "Bu programı ekle (" + plan.days.length + " gün)"}
        </button>
      </div>
    </div>
  );
}
