import React, { useMemo, useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import { dbGet, dbSet } from "../firebase";

// Fotoğrafı cihazda küçült (en uzun kenar ~900px, JPEG) — DB'de yer kaplamasın
function resizeImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- yardımcılar ---
const DAY = 86400000;
const fmtDay = (t) => {
  try { return new Date(t).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }); }
  catch (e) { return ""; }
};
const todayInput = () => {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
};
const parseDay = (s) => { const t = new Date(s + "T12:00:00").getTime(); return isNaN(t) ? Date.now() : t; };
const num = (s) => { const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? null : n; };
const firstInt = (s) => { const m = String(s || "").match(/\d+/); return m ? parseInt(m[0], 10) : null; };
// Haftanın başlangıcı (Pazartesi) zaman damgası
function weekStart(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Pzt=0
  return d.getTime() - day * DAY;
}

// --- mini SVG çizgi grafiği (goal: kesikli hedef çizgisi) ---
function LineChart({ data, unit = "", color = "var(--accent)", goal = null }) {
  if (!data || data.length === 0)
    return <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>Henüz veri yok.</div>;
  const W = 320, H = 120, pad = 26;
  const vs = data.map((d) => d.v);
  if (goal != null) vs.push(goal);
  let min = Math.min(...vs), max = Math.max(...vs);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const ts = data.map((d) => d.t);
  const tmin = Math.min(...ts), tmax = Math.max(...ts);
  const tspan = (tmax - tmin) || 1;
  const X = (t) => data.length === 1 ? W / 2 : pad + (t - tmin) / tspan * (W - 2 * pad);
  const Y = (v) => pad + (1 - (v - min) / span) * (H - 2 * pad);
  const pts = data.map((d) => X(d.t) + "," + Y(d.v)).join(" ");
  const last = data[data.length - 1];
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1={pad} y1={pad} x2={W - pad} y2={pad} stroke="var(--line)" strokeWidth="1" />
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" strokeWidth="1" />
      <text x="2" y={pad + 4} fill="var(--muted)" fontSize="9">{Math.round(max * 10) / 10}</text>
      <text x="2" y={H - pad + 4} fill="var(--muted)" fontSize="9">{Math.round(min * 10) / 10}</text>
      {goal != null && (
        <>
          <line x1={pad} y1={Y(goal)} x2={W - pad} y2={Y(goal)} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={W - pad} y={Y(goal) - 4} fill="#fbbf24" fontSize="9" textAnchor="end">🎯 {goal}{unit}</text>
        </>
      )}
      {data.length > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {data.map((d, i) => <circle key={i} cx={X(d.t)} cy={Y(d.v)} r={i === data.length - 1 ? 3.5 : 2.2} fill={color} />)}
      <text x={W - pad} y={Y(last.v) - 7} fill={color} fontSize="11" fontWeight="700" textAnchor="end">{last.v}{unit}</text>
    </svg>
  );
}

// --- mini SVG bar grafiği ---
function BarChart({ data, color = "var(--accent2)", unit = "" }) {
  if (!data || data.every((d) => !d.v))
    return <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>Henüz antrenman kaydı yok.</div>;
  const W = 320, H = 120, pad = 22, gap = 6;
  const max = Math.max(...data.map((d) => d.v), 1);
  const bw = (W - 2 * pad - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }}>
      {data.map((d, i) => {
        const h = (d.v / max) * (H - 2 * pad);
        const x = pad + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={H - pad - h} width={bw} height={Math.max(h, d.v ? 2 : 0)} rx="3" fill={color} opacity={d.v ? 1 : 0.25} />
            <text x={x + bw / 2} y={H - pad + 10} fill="var(--muted)" fontSize="8" textAnchor="middle">{d.label}</text>
            {d.v > 0 && <text x={x + bw / 2} y={H - pad - h - 4} fill="var(--text)" fontSize="8" textAnchor="middle">{d.v >= 1000 ? Math.round(d.v / 100) / 10 + "k" : d.v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

const MEASURES = [
  { key: "weight", label: "Kilo", unit: "kg" },
  { key: "chest", label: "Göğüs", unit: "cm" },
  { key: "waist", label: "Bel", unit: "cm" },
  { key: "arm", label: "Kol", unit: "cm" },
  { key: "hip", label: "Kalça", unit: "cm" },
  { key: "thigh", label: "Bacak", unit: "cm" },
];

export default function Progress({ data, history = [], onSave }) {
  const weights = (data && data.weights) || [];
  const measures = (data && data.measures) || [];

  // --- Kilo girişi ---
  const [kg, setKg] = useState("");
  const [kgDate, setKgDate] = useState(todayInput());
  const goalKg = (typeof data.goalKg === "number" && data.goalKg > 0) ? data.goalKg : null;
  const [goalInput, setGoalInput] = useState(goalKg != null ? String(goalKg) : "");
  function saveGoalKg() {
    const v = num(goalInput);
    if (v == null || v <= 0) return;
    onSave({ ...data, goalKg: v });
  }

  function addWeight() {
    const v = num(kg);
    if (v == null || v <= 0) return;
    const t = parseDay(kgDate);
    const next = [...weights.filter((w) => w.t !== t), { t, kg: v }].sort((a, b) => a.t - b.t);
    onSave({ ...data, weights: next });
    setKg("");
  }
  function delWeight(t) {
    onSave({ ...data, weights: weights.filter((w) => w.t !== t) });
  }

  // --- Ölçü girişi ---
  const [mDate, setMDate] = useState(todayInput());
  const [mVals, setMVals] = useState({});
  const [mSel, setMSel] = useState("waist");

  // --- Hareket takibi (seçili hareketin kg × tekrar geçmişi) ---
  const [selEx, setSelEx] = useState(null);

  // --- Gelişim fotoğrafları (ayrı saklanır: /fitness/users/{uid}/photos) ---
  const [photos, setPhotos] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [viewer, setViewer] = useState(null); // tam ekran gösterilen foto
  // Mobil "hayalet tıklama" koruması (kapatınca alttaki foto yeniden açılmasın)
  const closedAt = useRef(0);
  const justClosed = () => Date.now() - closedAt.current < 450;
  const closeViewer = () => { closedAt.current = Date.now(); setViewer(null); };

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await dbGet("photos");
      if (alive && Array.isArray(p)) setPhotos(p);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!viewer) return;
    function onKey(e) { if (e.key === "Escape") closeViewer(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);

  async function onPhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const src = await resizeImage(file);
      const entry = { id: "ph_" + Date.now().toString(36), t: Date.now(), src };
      const next = [entry, ...photos].slice(0, 50);
      setPhotos(next);
      dbSet("photos", next);
    } catch (err) { /* yoksay */ }
    setPhotoBusy(false);
  }
  function delPhoto(id) {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    dbSet("photos", next);
    closeViewer();
  }

  function addMeasure() {
    const entry = { t: parseDay(mDate) };
    let any = false;
    MEASURES.forEach((m) => {
      if (m.key === "weight") return;
      const v = num(mVals[m.key]);
      if (v != null) { entry[m.key] = v; any = true; }
    });
    if (!any) return;
    const next = [...measures.filter((x) => x.t !== entry.t), entry].sort((a, b) => a.t - b.t);
    // ölçüde kilo da girildiyse kilo grafiğine de yansıt
    const wv = num(mVals.weight);
    const newW = wv != null
      ? [...weights.filter((w) => w.t !== entry.t), { t: entry.t, kg: wv }].sort((a, b) => a.t - b.t)
      : weights;
    onSave({ ...data, measures: next, weights: newW });
    setMVals({});
  }

  const weightPoints = weights.map((w) => ({ t: w.t, v: w.kg }));
  const measurePoints = measures
    .filter((m) => m[mSel] != null)
    .map((m) => ({ t: m.t, v: m[mSel] }));
  const selUnit = (MEASURES.find((m) => m.key === mSel) || {}).unit || "";
  const selPoints = mSel === "weight" ? weightPoints : measurePoints;

  // kilo özeti
  const wStat = useMemo(() => {
    if (weights.length === 0) return null;
    const cur = weights[weights.length - 1].kg;
    const first = weights[0].kg;
    const since = new Date(weights[0].t);
    return { cur, diff: Math.round((cur - first) * 10) / 10, sinceTxt: fmtDay(since.getTime()) };
  }, [weights]);

  // --- Antrenman hacmi (son 8 hafta) ---
  const volume = useMemo(() => {
    const now = weekStart(Date.now());
    const weeks = [];
    for (let i = 7; i >= 0; i--) weeks.push({ ws: now - i * 7 * DAY, vol: 0, sets: 0 });
    const idx = {};
    weeks.forEach((w, i) => { idx[w.ws] = i; });
    let totalSets = 0, thisWeek = 0;
    (history || []).forEach((s) => {
      if (!s.sets) return;
      const ws = weekStart(s.date);
      s.sets.forEach((st) => {
        const w = Number(st.weight) || 0;
        const r = firstInt(st.reps) || 0;
        const vol = w * r;
        if (idx[ws] != null) { weeks[idx[ws]].vol += vol; weeks[idx[ws]].sets += 1; }
      });
      if (ws === now) thisWeek += s.sets.length;
      totalSets += s.sets.length;
    });
    const bars = weeks.map((w) => ({ label: fmtDay(w.ws).split(" ")[0], v: Math.round(w.vol) }));
    return { bars, thisWeek, totalSets, sessions: (history || []).length };
  }, [history]);

  // --- Kişisel rekorlar (geçmişten) ---
  const prs = useMemo(() => {
    const best = {};
    (history || []).forEach((s) => {
      (s.sets || []).forEach((st) => {
        const w = Number(st.weight);
        const r = firstInt(st.reps);
        if (!w || !r) return;
        const e1rm = Math.round(w * (1 + r / 30));
        const cur = best[st.exId];
        if (!cur || e1rm > cur.e1rm) best[st.exId] = { exId: st.exId, w, r, e1rm };
      });
    });
    return Object.values(best).sort((a, b) => b.e1rm - a.e1rm).slice(0, 10);
  }, [history]);

  // --- Hareket bazında geçmiş: exId -> günlere göre setler ---
  const exHistory = useMemo(() => {
    const map = {};
    (history || []).forEach((s) => {
      (s.sets || []).forEach((st) => {
        if (!st.exId) return;
        const w = Number(st.weight) || 0;
        const r = firstInt(st.reps) || 0;
        const rec = map[st.exId] || (map[st.exId] = { exId: st.exId, sessions: {}, count: 0, lastDate: 0 });
        (rec.sessions[s.date] = rec.sessions[s.date] || []).push({ w, r, reps: st.reps, e1rm: (w && r) ? Math.round(w * (1 + r / 30)) : null });
        rec.count += 1;
        if (s.date > rec.lastDate) rec.lastDate = s.date;
      });
    });
    return map;
  }, [history]);

  // Geçmişi olan hareketler (en son çalışılan üstte)
  const exList = useMemo(() =>
    Object.values(exHistory)
      .map((r) => ({ exId: r.exId, name: (getExercise(r.exId) || {}).name || r.exId, count: r.count, lastDate: r.lastDate }))
      .sort((a, b) => b.lastDate - a.lastDate),
    [exHistory]);

  const selExId = selEx || (exList[0] && exList[0].exId) || null;

  // Seçili hareketin verisi: günlere göre setler (yeni→eski) + 1RM trendi + en iyi set
  const selData = useMemo(() => {
    const rec = exHistory[selExId];
    if (!rec) return null;
    const days = Object.keys(rec.sessions).map(Number).sort((a, b) => b - a);
    const sessions = days.map((d) => ({ date: d, sets: rec.sessions[d] }));
    const pts = days.slice().sort((a, b) => a - b).map((d) => {
      const best = Math.max(0, ...rec.sessions[d].map((s) => s.e1rm || 0));
      return best > 0 ? { t: d, v: best } : null;
    }).filter(Boolean);
    let bestSet = null;
    days.forEach((d) => rec.sessions[d].forEach((s) => { if (s.e1rm && (!bestSet || s.e1rm > bestSet.e1rm)) bestSet = { ...s, date: d }; }));
    return { sessions, pts, bestSet };
  }, [exHistory, selExId]);

  return (
    <div>
      <h2>İlerleme</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Kilonu, ölçülerini ve antrenman geçmişini takip et. 📈</p>

      {/* Kilo */}
      <div className="section-title">Kilo Takibi</div>
      {wStat && (
        <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span className="pill" style={{ fontSize: 13 }}>Güncel: <b>{wStat.cur} kg</b></span>
          <span className="pill" style={{ fontSize: 13, color: wStat.diff < 0 ? "var(--ok)" : wStat.diff > 0 ? "#fca5a5" : "var(--muted)" }}>
            {wStat.diff > 0 ? "+" : ""}{wStat.diff} kg ({wStat.sinceTxt}’den beri)
          </span>
          {goalKg != null && (
            <span className="pill" style={{ fontSize: 13, color: "#fbbf24" }}>
              🎯 Hedefe {Math.abs(Math.round((wStat.cur - goalKg) * 10) / 10)} kg
            </span>
          )}
        </div>
      )}
      <div className="card" style={{ marginBottom: 10 }}>
        <LineChart data={weightPoints} unit=" kg" goal={goalKg} />
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={kg} onChange={(e) => setKg(e.target.value)} style={{ flex: 1 }} />
        <input className="input" type="date" value={kgDate} onChange={(e) => setKgDate(e.target.value)} style={{ flex: 1 }} />
        <button className="btn-primary" style={{ width: "auto", padding: "0 18px" }} onClick={addWeight}>Ekle</button>
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <input className="input" type="number" inputMode="decimal" placeholder="🎯 Hedef kilo (kg)" value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)} style={{ flex: 1 }} />
        <button className="icon-btn" style={{ padding: "0 14px" }} onClick={saveGoalKg}>Kaydet</button>
        {goalKg != null && <button className="icon-btn danger" style={{ padding: "0 12px" }} onClick={() => { onSave({ ...data, goalKg: null }); setGoalInput(""); }}>✕</button>}
      </div>
      {weights.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {weights.slice().reverse().slice(0, 5).map((w) => (
            <div key={w.t} className="row" style={{ justifyContent: "space-between", padding: "4px 4px", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{fmtDay(w.t)}</span>
              <span><b>{w.kg} kg</b> <button className="icon-btn" style={{ padding: "2px 8px", marginLeft: 6 }} onClick={() => delWeight(w.t)}>✕</button></span>
            </div>
          ))}
        </div>
      )}

      {/* Ölçüler */}
      <div className="section-title">Vücut Ölçüleri</div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {MEASURES.map((m) => (
          <button key={m.key} className={"chip" + (mSel === m.key ? " on" : "")} onClick={() => setMSel(m.key)}>{m.label}</button>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 10 }}>
        <LineChart data={selPoints} unit={" " + selUnit} color="var(--accent2)" />
      </div>
      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>Yeni ölçüm ekle (boş bıraktıklarını atlar)</div>
        <div className="grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {MEASURES.map((m) => (
            <input key={m.key} className="input" type="number" inputMode="decimal"
              placeholder={m.label + " (" + m.unit + ")"}
              value={mVals[m.key] || ""}
              onChange={(e) => setMVals((v) => ({ ...v, [m.key]: e.target.value }))} />
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} style={{ flex: 1 }} />
          <button className="btn-primary" style={{ width: "auto", padding: "0 18px" }} onClick={addMeasure}>Kaydet</button>
        </div>
      </div>

      {/* Gelişim fotoğrafları */}
      <div className="section-title">Gelişim Fotoğrafları</div>
      <label className="btn-primary" style={{ display: "block", textAlign: "center", marginBottom: 10, opacity: photoBusy ? 0.6 : 1 }}>
        {photoBusy ? "Ekleniyor…" : "📷 Fotoğraf Ekle"}
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} disabled={photoBusy} onChange={onPhoto} />
      </label>
      {photos.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Düzenli aralıklarla fotoğraf ekle; zamanla değişimini yan yana görürsün.</p>
      ) : (
        <>
          {photos.length >= 2 && (
            <div className="card" style={{ marginBottom: 10, padding: 10 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>Önce → Sonra</div>
              <div className="row" style={{ gap: 8 }}>
                {[photos[photos.length - 1], photos[0]].map((p, k) => (
                  <div key={k} style={{ flex: 1, textAlign: "center" }}>
                    <img src={p.src} alt="" onClick={() => { if (justClosed()) return; setViewer(p); }}
                      style={{ width: "100%", borderRadius: 10, aspectRatio: "3/4", objectFit: "cover", cursor: "pointer" }} />
                    <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>{k === 0 ? "İlk · " : "Son · "}{fmtDay(p.t)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 4 }}>
            {photos.map((p) => (
              <img key={p.id} src={p.src} alt="" onClick={() => { if (justClosed()) return; setViewer(p); }}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
            ))}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 11, margin: "4px 4px 0" }}>Fotoğrafa dokununca büyür.</p>
        </>
      )}

      {viewer && (
        <div onClick={closeViewer} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 60,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12,
        }}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            style={{ position: "fixed", top: 14, right: 14, background: "rgba(255,255,255,.12)", zIndex: 61 }}>Kapat ✕</button>
          <img src={viewer.src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 12 }} />
          <div style={{ color: "#cbd5e1", fontSize: 13 }}>{fmtDay(viewer.t)}</div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn-ghost" style={{ padding: "10px 18px" }} onClick={(e) => { e.stopPropagation(); delPhoto(viewer.id); }}>🗑️ Sil</button>
            <button className="btn-ghost" style={{ padding: "10px 18px" }} onClick={closeViewer}>Kapat</button>
          </div>
        </div>
      )}

      {/* Antrenman hacmi */}
      <div className="section-title">Antrenman Hacmi (8 hafta)</div>
      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
        <span className="pill" style={{ fontSize: 13 }}>Bu hafta: <b>{volume.thisWeek} set</b></span>
        <span className="pill" style={{ fontSize: 13 }}>Toplam: <b>{volume.sessions}</b> antrenman</span>
      </div>
      <div className="card" style={{ marginBottom: 4 }}>
        <BarChart data={volume.bars} unit=" kg" />
      </div>
      <p style={{ color: "var(--muted)", fontSize: 11, margin: "4px 4px 0" }}>
        Hacim = kaldırılan toplam tonaj (kilo × tekrar). Vücut ağırlığı hareketleri tonaja girmez ama set sayısına sayılır.
      </p>

      {/* Son antrenmanlar (manuel + Apple Sağlık) */}
      {history.length > 0 && (
        <>
          <div className="section-title">Son Antrenmanlar</div>
          {history.slice(0, 8).map((s, k) => (
            <div key={s.id || k} className="card" style={{ marginBottom: 8, padding: 12 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.source === "apple" ? "🍎 " : ""}{s.program || "Antrenman"}</div>
                <span className="pill" style={{ fontSize: 12 }}>
                  {s.source === "apple"
                    ? ([s.durationMin ? s.durationMin + " dk" : null, s.kcal ? s.kcal + " kcal" : null].filter(Boolean).join(" · ") || "Apple")
                    : (((s.sets && s.sets.length) || 0) + " set")}
                </span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{fmtDay(s.date)}</div>
            </div>
          ))}
        </>
      )}

      {/* Hareket takibi — hangi hareket, kaç kg × kaç tekrar */}
      <div className="section-title">Hareket Takibi</div>
      {exList.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Antrenman modunda hareketleri kaydettikçe her hareketin kg × tekrar geçmişi burada birikir.
        </p>
      ) : (
        <>
          <select className="input" style={{ width: "100%", marginBottom: 10 }}
            value={selExId || ""} onChange={(e) => setSelEx(e.target.value)}>
            {exList.map((e) => (
              <option key={e.exId} value={e.exId}>{e.name} · {e.count} set</option>
            ))}
          </select>

          {selData && (
            <>
              {selData.bestSet && (
                <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span className="pill" style={{ fontSize: 13, color: "#fbbf24" }}>
                    🏆 En iyi: <b>{selData.bestSet.w ? selData.bestSet.w + " kg × " : ""}{selData.bestSet.reps}</b> (~{selData.bestSet.e1rm} kg 1RM)
                  </span>
                </div>
              )}
              {selData.pts.length > 1 && (
                <div className="card" style={{ marginBottom: 10 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>Tahmini 1RM gelişimi</div>
                  <LineChart data={selData.pts} unit=" kg" />
                </div>
              )}
              {selData.sessions.map((s) => (
                <div key={s.date} className="card" style={{ marginBottom: 8, padding: 12 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>{fmtDay(s.date)}</div>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    {s.sets.map((st, k) => (
                      <span key={k} className="pill" style={{ fontSize: 13 }}>
                        {st.w ? st.w + " kg × " : ""}{st.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* Rekorlar */}
      <div className="section-title">Kişisel Rekorlar</div>
      {prs.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Antrenman modunda kilo girdikçe rekorların burada birikecek.</p>
      ) : (
        prs.map((p) => {
          const ex = getExercise(p.exId);
          return (
            <div key={p.exId} className="card" style={{ marginBottom: 8, padding: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ex ? ex.name : p.exId}</div>
                <span className="pill musc-p" style={{ fontSize: 12 }}>~{p.e1rm} kg 1RM</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>En iyi set: {p.w} kg × {p.r} tekrar</div>
            </div>
          );
        })
      )}
    </div>
  );
}
