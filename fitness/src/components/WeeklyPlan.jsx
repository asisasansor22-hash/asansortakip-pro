import React, { useState, useMemo } from "react";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const todayIdx = () => (new Date().getDay() + 6) % 7; // Pzt=0
const DAY = 86400000;
const dayKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

// Geçmişten güncel seri (streak) ve bu hafta antrenman sayısı
function computeStreak(history) {
  const days = new Set((history || []).map((s) => dayKey(s.date)));
  if (days.size === 0) return { streak: 0, week: 0 };
  const t0 = dayKey(Date.now());
  let streak = 0;
  // Bugün veya dün ile başlasın
  let cur = days.has(t0) ? t0 : (days.has(t0 - DAY) ? t0 - DAY : null);
  while (cur != null && days.has(cur)) { streak++; cur -= DAY; }
  // bu hafta (Pzt'den itibaren)
  const weekStart = t0 - todayIdx() * DAY;
  let week = 0;
  days.forEach((d) => { if (d >= weekStart) week++; });
  return { streak, week };
}

export default function WeeklyPlan({ programs, schedule, onSetSchedule, history, onStart }) {
  const [sel, setSel] = useState(todayIdx());
  const ti = todayIdx();
  const sch = schedule || {};
  const { streak, week } = useMemo(() => computeStreak(history), [history]);

  const progName = (id) => { const p = programs.find((x) => x.id === id); return p ? p.name : null; };
  const todayProg = programs.find((p) => p.id === sch[ti]);

  return (
    <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent2)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>📅 Haftalık Plan</div>
        <span className="pill" style={{ color: streak > 0 ? "#fdba74" : "var(--muted)" }}>
          🔥 {streak} gün · bu hafta {week}
        </span>
      </div>

      <div className="row" style={{ gap: 4, marginBottom: 10 }}>
        {DAYS.map((d, i) => {
          const assigned = !!sch[i];
          const isToday = i === ti;
          const isSel = i === sel;
          return (
            <button key={i} onClick={() => setSel(i)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: isSel ? "var(--accent)" : "var(--card2)",
                color: isSel ? "#04321f" : "var(--text)",
                border: isToday ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                position: "relative",
              }}>
              {d}
              <span style={{
                display: "block", width: 5, height: 5, borderRadius: 999, margin: "3px auto 0",
                background: assigned ? (isSel ? "#04321f" : "var(--accent2)") : "transparent",
              }} />
            </button>
          );
        })}
      </div>

      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 84 }}>{DAYS_FULL[sel]}</span>
        <select className="input" style={{ flex: 1 }} value={sch[sel] || ""}
          onChange={(e) => onSetSchedule(sel, e.target.value || null)}>
          <option value="">Dinlenme</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>Bugün ({DAYS_FULL[ti]})</div>
        {todayProg ? (
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div style={{ fontWeight: 700 }}>{todayProg.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({todayProg.exercises.length})</span></div>
            {todayProg.exercises.length > 0 && (
              <button className="btn-primary" style={{ width: "auto", padding: "0 18px", height: 40 }} onClick={() => onStart(todayProg)}>▶ Başlat</button>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 4, fontWeight: 700, color: "var(--muted)" }}>{sch[ti] === undefined ? "Plan atanmadı" : "Dinlenme günü 🧘"}</div>
        )}
      </div>
    </div>
  );
}
