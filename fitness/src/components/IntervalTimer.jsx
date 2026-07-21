import React, { useEffect, useRef, useState } from "react";

const PRESETS = [
  { name: "Tabata", work: 20, rest: 10, rounds: 8, prep: 10 },
  { name: "HIIT 30/30", work: 30, rest: 30, rounds: 8, prep: 10 },
  { name: "Devre 40/20", work: 40, rest: 20, rounds: 4, prep: 10 },
  { name: "EMOM 60", work: 60, rest: 0, rounds: 10, prep: 5 },
];

const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

// Faz dizisi kur: prep → (work, rest) × rounds (son turdan sonra rest yok)
function buildPhases(c) {
  const ph = [];
  if (c.prep > 0) ph.push({ type: "prep", dur: c.prep, round: 0 });
  for (let r = 1; r <= c.rounds; r++) {
    ph.push({ type: "work", dur: c.work, round: r });
    if (c.rest > 0 && r < c.rounds) ph.push({ type: "rest", dur: c.rest, round: r });
  }
  return ph;
}

// ⏱️ HIIT / devre sayacı — tam ekran. Titreşimli, otomatik tur geçişli.
export default function IntervalTimer({ onClose }) {
  const [cfg, setCfg] = useState({ work: 30, rest: 30, rounds: 8, prep: 10 });
  // Tüm çalışma durumu tek objede — güvenilir faz geçişi
  const [run, setRun] = useState(null); // { phases, idx, remain, done }
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: Math.max(k === "rounds" ? 1 : 0, Math.min(3600, v)) }));

  function start() {
    const ph = buildPhases(cfg);
    if (!ph.length) return;
    setPaused(false);
    setRun({ phases: ph, idx: 0, remain: ph[0].dur, done: false });
  }
  function stop() { clearInterval(timer.current); setRun(null); }

  const phases = run && run.phases;
  const done = run && run.done;

  useEffect(() => {
    if (!run || run.done || paused) { clearInterval(timer.current); return; }
    timer.current = setInterval(() => {
      setRun((s) => {
        if (!s || s.done) return s;
        if (s.remain > 1) { if (s.remain <= 4) vibrate(30); return { ...s, remain: s.remain - 1 }; }
        const next = s.idx + 1;
        if (next >= s.phases.length) { vibrate([200, 80, 200, 80, 300]); return { ...s, done: true }; }
        const np = s.phases[next];
        vibrate(np.type === "work" ? [180, 50, 180] : 120);
        return { ...s, idx: next, remain: np.dur };
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [run, paused]);

  useEffect(() => () => clearInterval(timer.current), []);

  const cur = run && !run.done && run.phases[run.idx];
  const remain = run ? run.remain : 0;
  const totalRounds = cfg.rounds;
  const bg = done ? "#16a34a" : !cur ? "var(--bg)"
    : cur.type === "work" ? "#ef4444" : cur.type === "rest" ? "#2563eb" : "#f59e0b";
  const label = done ? "Bitti! 🎉" : !cur ? "" : cur.type === "work" ? "ÇALIŞ" : cur.type === "rest" ? "DİNLEN" : "HAZIRLIK";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 90, background: phases ? bg : "var(--bg)",
      display: "flex", flexDirection: "column", transition: "background .25s",
      padding: "calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))",
    }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: phases ? "#fff" : "var(--text)" }}>⏱️ HIIT / Devre Sayacı</div>
        <button className="icon-btn" onClick={onClose} style={{ background: "rgba(255,255,255,.15)", color: phases ? "#fff" : "var(--text)" }}>✕</button>
      </div>

      {!phases ? (
        // --- Kurulum ---
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 12 }}>
          <div className="chips" style={{ marginBottom: 16 }}>
            {PRESETS.map((p) => (
              <button key={p.name} className="chip" onClick={() => setCfg({ work: p.work, rest: p.rest, rounds: p.rounds, prep: p.prep })}>{p.name}</button>
            ))}
          </div>
          {[
            { k: "prep", label: "Hazırlık (sn)", step: 5 },
            { k: "work", label: "Çalışma (sn)", step: 5 },
            { k: "rest", label: "Dinlenme (sn)", step: 5 },
            { k: "rounds", label: "Tur sayısı", step: 1 },
          ].map((f) => (
            <div key={f.k} className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>{f.label}</span>
              <div className="row" style={{ gap: 10, alignItems: "center" }}>
                <button className="icon-btn" style={{ fontSize: 18, padding: "2px 14px" }} onClick={() => set(f.k, cfg[f.k] - f.step)}>−</button>
                <span style={{ minWidth: 44, textAlign: "center", fontWeight: 800, fontSize: 18 }}>{cfg[f.k]}</span>
                <button className="icon-btn" style={{ fontSize: 18, padding: "2px 14px" }} onClick={() => set(f.k, cfg[f.k] + f.step)}>＋</button>
              </div>
            </div>
          ))}
          <div style={{ color: "var(--muted)", fontSize: 12, margin: "8px 2px 16px" }}>
            Toplam süre ≈ {Math.round((cfg.prep + cfg.rounds * cfg.work + Math.max(0, cfg.rounds - 1) * cfg.rest) / 6) / 10} dk
          </div>
          <button className="btn-primary" style={{ padding: 16 }} onClick={start}>▶ Başlat</button>
        </div>
      ) : (
        // --- Çalışıyor ---
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center" }}>
          {!done && <div style={{ fontSize: 15, opacity: 0.9, letterSpacing: 2, fontWeight: 700 }}>Tur {cur.round || 0} / {totalRounds}</div>}
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, margin: "6px 0" }}>{label}</div>
          {!done && <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{remain}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            {!done && (
              <button className="icon-btn" style={{ background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 16, padding: "12px 22px" }}
                onClick={() => setPaused((p) => !p)}>{paused ? "▶ Devam" : "⏸ Duraklat"}</button>
            )}
            <button className="icon-btn" style={{ background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 16, padding: "12px 22px" }}
              onClick={stop}>{done ? "↺ Yeni" : "■ Bitir"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
