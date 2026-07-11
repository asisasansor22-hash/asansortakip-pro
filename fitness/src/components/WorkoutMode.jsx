import React, { useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import { feedPost } from "../firebase";
import ExerciseAnimation from "./ExerciseAnimation";
import SpotifyBar from "./SpotifyBar";

const REST_SEC = 60;

// Bölgeye göre dinamik ısınma önerileri (antrenman öncesi ~5 dk)
const WARMUPS = {
  genel: ["60 sn hafif tempo: yerinde yürüyüş / jumping jack"],
  gogus: ["10 kol çevirme (öne + arkaya)", "10 hafif şınav (gerekirse diz üstü)"],
  sirt: ["10 omuz sıkıştırma (kürekleri geri-aşağı çek)", "10 kol çevirme"],
  omuz: ["15 kol çevirme (küçük daireden büyüğe)", "10 duvar kaydırma (wall slide)"],
  kol: ["10 boş elle curl + 10 triceps uzatma (hafif)"],
  bacak: ["15 vücut ağırlığı squat", "10 hamle (her bacak)", "10 bacak sallama (öne-yana)"],
  karin: ["10 cat-camel (kedi-deve)", "20 sn plank"],
  kardiyo: ["3-5 dk düşük tempolu yürüyüş / hafif jog"],
};

// Bölgeye göre antrenman sonrası soğuma / esneme önerileri
const COOLDOWNS = {
  gogus: "Kapı boşluğunda göğüs esnetme — 30 sn",
  sirt: "Çocuk pozu (child's pose) — 30 sn",
  omuz: "Kolu çapraz alıp omuz esnetme — her kol 20 sn",
  kol: "Bilek ve ön kol esnetme — 20 sn",
  bacak: "Quad + hamstring + baldır esnetme — her biri 30 sn",
  karin: "Kobra esnetmesi — 30 sn",
  kardiyo: "3-5 dk yavaş yürüyüşle nabzı düşür",
};

function parseSets(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  if (m) return { sets: parseInt(m[1], 10), reps: m[2].trim() };
  return { sets: 1, reps: s || "-" };
}

// Tekrar aralığını ayrıştır: "8-12" -> {low:8, high:12}, "10" -> {low:10, high:10}
function repRange(reps) {
  const m = String(reps || "").match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { low: parseInt(m[1], 10), high: parseInt(m[2], 10) };
  const one = String(reps || "").match(/\d+/);
  if (one) { const n = parseInt(one[0], 10); return { low: n, high: n }; }
  return null;
}
const firstInt = (s) => { const m = String(s || "").match(/\d+/); return m ? parseInt(m[0], 10) : null; };
// Tahmini 1 tekrar maksimumu (Epley)
const est1RM = (w, r) => (w > 0 && r > 0 ? Math.round(w * (1 + r / 30)) : null);

// Progressive overload önerisi: son sefere göre bir sonraki hedef
function overloadSuggestion(prev, metaReps) {
  if (!prev || !prev.weight) return null;
  const w = Number(prev.weight);
  const r = firstInt(prev.reps);
  if (!w || !r) return null;
  const range = repRange(metaReps) || { low: r, high: r };
  // Aralığın üstüne ulaştıysa kiloyu artır, tekrarı aralığın altına çek
  if (r >= range.high) return { weight: Math.round((w + 2.5) * 2) / 2, reps: String(range.low) };
  // Aksi halde aynı kiloda bir tekrar daha hedefle
  return { weight: w, reps: String(r + 1) };
}

// Antrenman modu: ısınma → hareket hareket çalış → özet/soğuma/paylaş.
export default function WorkoutMode({ program, onExit, onFinish, onPersist, resume, lastLog, bestE1RM }) {
  const exIds = (program.exercises || []).filter((id) => getExercise(id));
  const maxIdx = Math.max(0, exIds.length - 1);
  const [i, setI] = useState(resume && resume.i != null ? Math.min(resume.i, maxIdx) : 0);
  const [setNo, setSetNo] = useState(resume && resume.setNo ? resume.setNo : 1);
  const [resting, setResting] = useState(false);
  const [rest, setRest] = useState(0);
  const [done, setDone] = useState(false);
  const [warmup, setWarmup] = useState(resume ? !!resume.warmup : true);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [prFlash, setPrFlash] = useState(null); // yeni rekor bildirimi
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const timer = useRef(null);
  const prTimer = useRef(null); // rekor bildirimi zamanlayıcısı (unmount'ta temizlenir)
  const log = useRef(resume && Array.isArray(resume.log) ? resume.log.slice() : []); // {exId, weight, reps}
  const sessionPRs = useRef({}); // exId -> {name, w, r, e1rm}
  const stepsRef = useRef(null); // üstteki sıradaki-hareketler şeridi

  // Aktif hareket değişince şeridi ortala (isimler üst üste binmesin, kayar)
  useEffect(() => {
    const c = stepsRef.current;
    if (!c || !c.children[i]) return;
    const el = c.children[i];
    c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [i]);

  // Programın çalıştırdığı bölgeler (ısınma/soğuma önerileri için)
  const regions = [...new Set(exIds.map((id) => getExercise(id).region))];

  const ex = exIds.length ? getExercise(exIds[i]) : null;
  const meta = ex ? parseSets(ex.sets) : { sets: 1, reps: "-" };
  // Programda bu hareket için özel set sayısı ayarlandıysa onu kullan
  const targetSets = (ex && program.sets && program.sets[ex.id] != null) ? program.sets[ex.id] : meta.sets;
  const prev = ex && lastLog ? lastLog(ex.id) : null;
  const suggestion = overloadSuggestion(prev, meta.reps);
  const curE1RM = est1RM(Number(weight), firstInt(reps));

  // Hareket değişince kilo/tekrar alanlarını son kayıttan / hedeften doldur
  useEffect(() => {
    if (!ex) return;
    setWeight(prev && prev.weight ? String(prev.weight) : "");
    setReps(prev && prev.reps ? String(prev.reps) : meta.reps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => () => { clearInterval(timer.current); clearTimeout(prTimer.current); }, []);

  // Aktif antrenman ilerlemesini cihaza yaz — uygulama kapanırsa yeniden
  // açılışta "kaldığın yerden devam et?" için. Bitince (done) yazılmaz.
  useEffect(() => {
    if (done) return;
    if (onPersist) onPersist({ i, setNo, warmup, log: log.current.slice() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, setNo, warmup, done]);

  if (exIds.length === 0) {
    return (
      <div className="workout">
        <div className="empty">Bu programda hareket yok.</div>
        <button className="btn-primary" onClick={onExit}>Kapat</button>
      </div>
    );
  }

  function startRest() {
    clearInterval(timer.current);
    setResting(true);
    setRest(REST_SEC);
    timer.current = setInterval(() => {
      setRest((r) => {
        if (r <= 1) {
          clearInterval(timer.current); setResting(false);
          try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }
  function adjustRest(d) { setRest((r) => Math.max(0, r + d)); }
  function skipRest() { clearInterval(timer.current); setResting(false); setRest(0); }

  function finishWorkout() {
    if (onFinish && log.current.length) {
      onFinish({ date: Date.now(), program: program.name, sets: log.current.slice() });
    }
    setDone(true);
  }
  function nextExercise() {
    skipRest();
    if (i < exIds.length - 1) { setI(i + 1); setSetNo(1); }
    else finishWorkout();
  }
  function completeSet() {
    log.current.push({ exId: ex.id, weight: weight ? Number(weight) : null, reps: reps || meta.reps });
    // Rekor kontrolü: bu set tüm zamanların en iyi 1RM'ini geçiyor mu?
    const w = Number(weight);
    const r = firstInt(reps);
    const e = est1RM(w, r);
    if (e && bestE1RM) {
      const oldBest = bestE1RM(ex.id) || 0;
      const sessBest = (sessionPRs.current[ex.id] && sessionPRs.current[ex.id].e1rm) || 0;
      if (e > oldBest && e > sessBest && oldBest > 0) {
        sessionPRs.current[ex.id] = { name: ex.name, w, r, e1rm: e };
        setPrFlash(ex.name + " — " + w + " kg × " + r);
        try { if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 160]); } catch (err) {}
        clearTimeout(prTimer.current);
        prTimer.current = setTimeout(() => setPrFlash(null), 3200);
      }
    }
    if (setNo < targetSets) { setSetNo(setNo + 1); startRest(); }
    else nextExercise();
  }

  // Antrenman özeti (özet ekranı + paylaşım metni)
  function summary() {
    let vol = 0;
    log.current.forEach((s) => {
      const w = Number(s.weight) || 0;
      const r = firstInt(s.reps) || 0;
      vol += w * r;
    });
    return { sets: log.current.length, vol: Math.round(vol), prs: Object.values(sessionPRs.current) };
  }

  async function shareToFeed() {
    const s = summary();
    let text = "🏋️ " + program.name + " tamamlandı!\n" + exIds.length + " hareket · " + s.sets + " set";
    if (s.vol > 0) text += " · " + s.vol + " kg toplam hacim";
    s.prs.forEach((p) => { text += "\n🏆 Yeni rekor: " + p.name + " " + p.w + " kg × " + p.r; });
    let avatar = null;
    try { avatar = localStorage.getItem("fitbe_avatar") || null; } catch (e) {}
    setSharing(true);
    const r = await feedPost({ text, media: null, avatar });
    setSharing(false);
    if (r.success) setShared(true);
  }

  // --- Isınma ekranı (antrenman öncesi ~5 dk) ---
  if (warmup) {
    const items = [...WARMUPS.genel, ...regions.flatMap((rg) => WARMUPS[rg] || [])];
    return (
      <div className="workout" style={{ justifyContent: "center", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔥</div>
          <h2>Isınma (~5 dk)</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            Isınma performansı artırır, sakatlık riskini azaltır.
          </p>
        </div>
        <div className="card" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <ul className="tips">
            {items.map((t, k) => <li key={k}>• {t}</li>)}
          </ul>
        </div>
        <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}><SpotifyBar /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <button className="btn-primary" onClick={() => setWarmup(false)}>✓ Isınma bitti, başla</button>
          <button className="btn-ghost" style={{ padding: 12 }} onClick={() => setWarmup(false)}>Isınmayı atla →</button>
        </div>
      </div>
    );
  }

  if (done) {
    const s = summary();
    const stretches = regions.map((rg) => COOLDOWNS[rg]).filter(Boolean);
    return (
      <div className="workout" style={{ justifyContent: "center", gap: 12, overflowY: "auto" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🎉</div>
          <h2>Antrenman tamamlandı!</h2>
          <p style={{ color: "var(--muted)", marginTop: 2 }}>
            {exIds.length} hareket · {s.sets} set{s.vol > 0 ? " · " + s.vol + " kg toplam hacim" : ""}. Helal olsun! 💪
          </p>
        </div>

        {s.prs.length > 0 && (
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "0 auto", borderColor: "#fbbf24" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🏆 Yeni rekorlar</div>
            {s.prs.map((p) => (
              <div key={p.name} style={{ fontSize: 14, padding: "2px 0" }}>
                {p.name}: <b>{p.w} kg × {p.r}</b> <span style={{ color: "var(--muted)", fontSize: 12 }}>(~{p.e1rm} kg 1RM)</span>
              </div>
            ))}
          </div>
        )}

        {stretches.length > 0 && (
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🧘 Soğuma & Esneme</div>
            <ul className="tips">
              {stretches.map((t, k) => <li key={k}>• {t}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, width: "100%", margin: "0 auto" }}>
          {log.current.length > 0 && (
            <button className="btn-primary" disabled={sharing || shared} onClick={shareToFeed}
              style={shared ? { background: "var(--card2)", color: "var(--ok)" } : undefined}>
              {shared ? "✓ Akış'ta paylaşıldı" : (sharing ? "Paylaşılıyor…" : "💬 Akış'ta Paylaş")}
            </button>
          )}
          <button className={log.current.length > 0 ? "btn-ghost" : "btn-primary"} style={{ padding: 12 }} onClick={onExit}>Bitir</button>
        </div>
      </div>
    );
  }

  const pct = Math.round((i / exIds.length) * 100);

  return (
    <div className="workout">
      <div className="workout-top">
        <button className="btn-ghost" onClick={onExit}>✕</button>
        <div className="workout-prog"><div className="workout-prog-bar" style={{ width: pct + "%" }} /></div>
        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 48, textAlign: "right" }}>{i + 1}/{exIds.length}</span>
      </div>

      {/* Sıradaki hareketler — isimleriyle, yatay kayan şerit (üst üste binmez) */}
      <div ref={stepsRef} style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 12px 2px", WebkitOverflowScrolling: "touch" }}>
        {exIds.map((id, k) => {
          const e = getExercise(id);
          const state = k < i ? "done" : (k === i ? "cur" : "next");
          return (
            <div key={id + "-" + k} onClick={() => { if (k !== i) { skipRest(); setI(k); setSetNo(1); } }}
              style={{
                flexShrink: 0, maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                padding: "6px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: state === "cur" ? "var(--accent)" : "var(--card2)",
                color: state === "cur" ? "#04321f" : (state === "done" ? "var(--muted)" : "var(--text)"),
                opacity: state === "done" ? 0.6 : 1,
                cursor: k !== i ? "pointer" : "default",
              }}>
              {state === "done" ? "✓ " : (k + 1) + ". "}{e.name}
            </div>
          );
        })}
      </div>

      <SpotifyBar />

      {program.note && (
        <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", margin: "8px 12px 0" }}>ℹ️ {program.note}</p>
      )}

      {prFlash && (
        <div style={{
          position: "fixed", top: "calc(16px + env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)",
          background: "#fbbf24", color: "#451a03", padding: "10px 18px", borderRadius: 12,
          fontWeight: 800, fontSize: 13, zIndex: 80, maxWidth: "90%", textAlign: "center",
          boxShadow: "0 6px 24px rgba(0,0,0,.4)",
        }}>
          🏆 YENİ REKOR! {prFlash}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div className="figbox" style={{ width: 200, height: 200 }}>
          <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={190} />
        </div>
        <h2 style={{ margin: "6px 0 0", textAlign: "center" }}>{ex.name}</h2>

        {resting ? (
          <>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>Dinlenme</div>
            <div className="rest-count">{rest}<span> sn</span></div>
            <div className="row" style={{ justifyContent: "center", gap: 8 }}>
              <button className="btn-ghost" style={{ padding: "8px 14px" }} onClick={() => adjustRest(-15)}>−15</button>
              <button className="btn-ghost" style={{ padding: "8px 14px" }} onClick={() => adjustRest(15)}>+15</button>
              <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={skipRest}>Atla →</button>
            </div>
          </>
        ) : (
          <>
            <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 2 }}>
              <span className="pill" style={{ fontSize: 14 }}>Set {setNo} / {targetSets}</span>
              <span className="pill lvl" style={{ fontSize: 14 }}>Hedef: {meta.reps}</span>
            </div>
            {prev && (prev.weight || prev.reps) && (
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Son: {prev.weight ? prev.weight + " kg" : ""}{prev.weight && prev.reps ? " × " : ""}{prev.reps || ""}
              </div>
            )}
            {suggestion && (
              <button className="chip on" style={{ marginTop: 4 }}
                onClick={() => { setWeight(String(suggestion.weight)); setReps(String(suggestion.reps)); }}>
                🎯 Hedef: {suggestion.weight} kg × {suggestion.reps} (uygula)
              </button>
            )}
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 6, width: "100%", maxWidth: 320 }}>
              <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <input className="input" type="text" placeholder="Tekrar" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            {curE1RM && (
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                Tahmini 1RM: <b style={{ color: "var(--accent)" }}>~{curE1RM} kg</b>
              </div>
            )}
          </>
        )}
      </div>

      {!resting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn-primary" onClick={completeSet}>
            {setNo < targetSets ? "✓ Set tamamlandı" : "✓ Hareketi bitir"}
          </button>
          <button className="btn-ghost" style={{ padding: 12 }} onClick={nextExercise}>Sonraki hareket →</button>
        </div>
      )}
    </div>
  );
}
