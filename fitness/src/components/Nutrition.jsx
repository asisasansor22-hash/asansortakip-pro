import React, { useState } from "react";
import { NUTRITION_PLANS } from "../data/nutrition";
import { SUPPLEMENTS } from "../data/supplements";
import CalorieCalculator from "./CalorieCalculator";

const SUBTABS = [
  { id: "plans", label: "Diyet" },
  { id: "calorie", label: "Kalori" },
  { id: "supps", label: "Supplement" },
];

function DietPlans() {
  const [open, setOpen] = useState(NUTRITION_PLANS[0].id);
  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Hedefine göre hazır yemek düzeni ve makro hedefleri.</p>
      {NUTRITION_PLANS.map((n) => {
        const isOpen = open === n.id;
        return (
          <div key={n.id} className="card" style={{ marginBottom: 12 }}>
            <button onClick={() => setOpen(isOpen ? null : n.id)}
              style={{ background: "none", color: "var(--text)", width: "100%", textAlign: "left" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{n.emoji} {n.name}</div>
                <span className="pill">{n.kcal}</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 0" }}>{n.desc}</p>
            </button>
            {isOpen && (
              <div style={{ marginTop: 12 }}>
                <div className="macro" style={{ marginBottom: 12 }}>
                  <div className="m"><b>{n.macros.protein}</b><s>Protein</s></div>
                  <div className="m"><b>{n.macros.carb}</b><s>Karbonhidrat</s></div>
                  <div className="m"><b>{n.macros.fat}</b><s>Yağ</s></div>
                </div>
                {n.meals.map((m, i) => (
                  <div key={i} className="meal"><h4>{m.title}</h4><p>{m.items}</p></div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 16 }}>
        ⚠️ Bu planlar genel öneridir. Sağlık durumuna göre bir diyetisyene danışman önerilir.
      </p>
    </div>
  );
}

function Supplements() {
  const [open, setOpen] = useState(null);
  const renk = (k) => k === "Güçlü" ? "#10b981" : k === "Orta" ? "#f59e0b" : "#94a3b8";
  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Kanıta dayalı supplement rehberi — dozaj ve araştırma notlarıyla.</p>
      {SUPPLEMENTS.map((s) => {
        const isOpen = open === s.id;
        return (
          <div key={s.id} className="card" style={{ marginBottom: 12 }}>
            <button onClick={() => setOpen(isOpen ? null : s.id)}
              style={{ background: "none", color: "var(--text)", width: "100%", textAlign: "left" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{s.emoji} {s.name}</div>
                <span className="pill" style={{ color: renk(s.kanit) }}>Kanıt: {s.kanit}</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 0" }}>{s.fayda}</p>
            </button>
            {isOpen && (
              <div style={{ marginTop: 10 }}>
                <div className="meal"><h4>💊 Dozaj</h4><p>{s.doz}</p></div>
                <ul className="tips" style={{ marginTop: 6 }}>
                  {s.notlar.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      })}
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 16 }}>
        ⚠️ Supplementler dengeli beslenmenin yerini tutmaz. Sağlık sorunun varsa doktora danış.
      </p>
    </div>
  );
}

export default function Nutrition() {
  const [tab, setTab] = useState("plans");
  return (
    <div>
      <h2>Beslenme</h2>
      <div className="subtabs">
        {SUBTABS.map((t) => (
          <button key={t.id} className={"subtab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "plans" && <DietPlans />}
      {tab === "calorie" && <CalorieCalculator />}
      {tab === "supps" && <Supplements />}
    </div>
  );
}
