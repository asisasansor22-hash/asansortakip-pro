import React, { useMemo } from "react";
import { computeAchievements } from "../data/achievements";

// Rozetler — Profil'de gösterilir. Kazanılanlar renkli, kilitliler soluk + ilerleme.
export default function Achievements({ history }) {
  const { list, earned } = useMemo(() => computeAchievements(history), [history]);
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", margin: "0 2px 8px" }}>
        <div className="section-title" style={{ margin: 0 }}>🏅 Rozetler</div>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{earned}/{list.length}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {list.map((a) => (
          <div key={a.id} style={{
            background: "var(--card2)", borderRadius: 12, padding: "10px 6px", textAlign: "center",
            opacity: a.earned ? 1 : 0.5, border: a.earned ? "1px solid var(--accent)" : "1px solid transparent",
            filter: a.earned ? "none" : "grayscale(0.7)",
          }}>
            <div style={{ fontSize: 26, lineHeight: 1 }}>{a.earned ? a.emoji : "🔒"}</div>
            <div style={{ fontWeight: 700, fontSize: 11, marginTop: 4 }}>{a.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 9, marginTop: 2, lineHeight: 1.25 }}>{a.desc}</div>
            {!a.earned && a.progress > 0 && (
              <div style={{ height: 3, background: "var(--card)", borderRadius: 999, marginTop: 5, overflow: "hidden" }}>
                <div style={{ width: Math.round(a.progress * 100) + "%", height: "100%", background: "var(--accent)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
