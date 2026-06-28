import React, { useState } from "react";
import { NUTRITION_PLANS } from "../data/nutrition";

export default function Nutrition() {
  const [open, setOpen] = useState(NUTRITION_PLANS[0].id);

  return (
    <div>
      <h2>Beslenme Programları</h2>
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
                  <div key={i} className="meal">
                    <h4>{m.title}</h4>
                    <p>{m.items}</p>
                  </div>
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
