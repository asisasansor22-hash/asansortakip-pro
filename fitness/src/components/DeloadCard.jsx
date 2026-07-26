import React, { useMemo, useState } from "react";
import { assessFatigue } from "../data/deload";

const STYLE = {
  ok:      { emoji: "✅", title: "Toparlanma iyi", color: "var(--ok)",     bg: "rgba(34,197,94,.10)" },
  watch:   { emoji: "⚠️", title: "Yorgunluk birikiyor", color: "var(--attn)", bg: "rgba(251,191,36,.10)" },
  deload:  { emoji: "🛑", title: "Deload haftası zamanı", color: "var(--bad)", bg: "rgba(248,113,113,.10)" },
};

// 🔋 Yorgunluk radarı — hacim ve RIR trendinden birikmiş yorgunluğu okur,
// gerekiyorsa hafifletme (deload) haftası önerir.
export default function DeloadCard({ history = [] }) {
  const a = useMemo(() => assessFatigue(history), [history]);
  const [open, setOpen] = useState(false);

  if (a.level === "none") {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🔋 Yorgunluk Radarı</div>
        <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
          En az 3 haftalık antrenman kaydı biriktiğinde burada toparlanma durumun ve gerekirse
          deload (hafifletme) önerisi görünecek. Setlerde <b>RIR</b> girmen tahmini belirgin iyileştirir.
        </p>
      </div>
    );
  }

  const s = STYLE[a.level];

  return (
    <div className="card" style={{ marginBottom: 16, borderColor: s.color, background: s.bg }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{s.emoji} {s.title}</div>
        <button className="icon-btn" onClick={() => setOpen((v) => !v)}>{open ? "Gizle" : "Detay"}</button>
      </div>

      {a.reasons.length > 0 ? (
        <ul style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.55, margin: "8px 0 0", paddingLeft: 18 }}>
          {a.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 12, margin: "8px 0 0" }}>
          Hacim ve zorlanma seviyen dengeli görünüyor — yüklenmeye devam edebilirsin.
        </p>
      )}

      <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
          {a.level === "deload" ? "Bu hafta ne yapmalı" : "Öneri"}
        </div>
        <ul style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
          {a.tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Son 8 hafta</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 300, width: "100%" }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={{ padding: "4px 6px", fontWeight: 600 }}>Hafta</th>
                  <th style={{ padding: "4px 6px", fontWeight: 600 }}>Antr.</th>
                  <th style={{ padding: "4px 6px", fontWeight: 600 }}>Set</th>
                  <th style={{ padding: "4px 6px", fontWeight: 600 }}>Hacim</th>
                  <th style={{ padding: "4px 6px", fontWeight: 600 }}>RIR</th>
                </tr>
              </thead>
              <tbody>
                {a.weeks.map((w, i) => (
                  <tr key={w.ws} style={{ borderTop: "1px solid var(--line)", opacity: w.sessions ? 1 : 0.45 }}>
                    <td style={{ padding: "5px 6px" }}>
                      {new Date(w.ws).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                      {i === a.weeks.length - 1 ? " (bu)" : ""}
                    </td>
                    <td style={{ padding: "5px 6px" }}>{w.sessions || "–"}</td>
                    <td style={{ padding: "5px 6px" }}>{w.sets || "–"}</td>
                    <td style={{ padding: "5px 6px" }}>{w.vol ? (w.vol / 1000).toFixed(1) + " t" : "–"}</td>
                    <td style={{ padding: "5px 6px" }}>{w.rir !== null ? w.rir.toFixed(1) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 10, marginBottom: 0 }}>
            Nasıl çalışır: aralıksız geçen hafta sayısı, toplam hacim trendi ve RIR (yedekte kalan tekrar)
            değişimi birlikte değerlendirilir. Aynı işi yaparken RIR düşüyorsa yorgunluk birikiyor demektir.
            Deload'da <b>ağırlık korunur, set sayısı azaltılır</b> — kazanımı kaybetmeden toparlanırsın.
          </p>
        </div>
      )}
    </div>
  );
}
