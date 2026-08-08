import React, { useState, useEffect, useRef } from "react";
import { getExercise } from "../data/exercises";
import { substitutesFor } from "../data/muscles";
import { feedPost } from "../firebase";
import ExerciseAnimation from "./ExerciseAnimation";
import SpotifyBar from "./SpotifyBar";
import { restFor, clampRest } from "../data/rest";
import { overloadSuggestion } from "../data/overload";
import { alertRestDone, primeAudio, keepAwake, releaseAwake,
         notifOn, setNotifOn, notifPermission, requestNotif, soundOn, setSoundOn } from "../utils/alerts";

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

// Yüklenme önerisi artık data/overload.js'te: RIR'a, hareketin büyüklüğüne ve
// ekipmanına bakıyor, takılmayı fark ediyor ve gerekçesini yazıyor.

// Antrenman modu: ısınma → hareket hareket çalış → özet/soğuma/paylaş.
export default function WorkoutMode({ program, onExit, onFinish, onPersist, resume, lastLog, bestE1RM, exHistory }) {
  const baseIds = (program.exercises || []).filter((id) => getExercise(id));
  // Bu oturuma özel hareket değişiklikleri (sıra no → yeni hareket id).
  // Kaydedilmiş programı DEĞİŞTİRMEZ; sadece bugünkü antrenman için geçerlidir.
  const [swaps, setSwaps] = useState(() => (resume && resume.swaps) || {});
  const [swapOpen, setSwapOpen] = useState(false);
  const exIds = baseIds.map((id, k) => (swaps[k] && getExercise(swaps[k])) ? swaps[k] : id);
  const maxIdx = Math.max(0, exIds.length - 1);
  const [i, setI] = useState(resume && resume.i != null ? Math.min(resume.i, maxIdx) : 0);
  const [setNo, setSetNo] = useState(resume && resume.setNo ? resume.setNo : 1);
  // Hareket sırası → o harekette kaçıncı sette kalındığı.
  //
  // NEDEN VAR: üstteki şeritten başka bir harekete dokunup geri dönünce set
  // sayacı 1'e düşüyordu — kullanıcı için antrenman "sıfırlanmış" görünüyordu.
  // Tek bir setNo tutulduğu için harekete geri dönüldüğünde nerede kalındığı
  // bilinmiyordu. Kayıt (log) zaten tutuluyordu, kaybolan yalnızca YERdi.
  const setNoMem = useRef((resume && resume.setNoMem) || {});
  const [resting, setResting] = useState(false);
  const [rest, setRest] = useState(0);
  const [done, setDone] = useState(false);
  const [warmup, setWarmup] = useState(resume ? !!resume.warmup : true);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");   // yedekte kalan tekrar (bu set)
  const [note, setNote] = useState(""); // sete özel kısa not
  const [prFlash, setPrFlash] = useState(null); // yeni rekor bildirimi
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const timer = useRef(null);
  const prTimer = useRef(null); // rekor bildirimi zamanlayıcısı (unmount'ta temizlenir)
  const log = useRef(resume && Array.isArray(resume.log) ? resume.log.slice() : []); // {exId, weight, reps}
  const sessionPRs = useRef({}); // exId -> {name, w, r, e1rm}
  const stepsRef = useRef(null); // üstteki sıradaki-hareketler şeridi
  const endAtRef = useRef(0);        // dinlenmenin biteceği an (ms)
  const firedRef = useRef(false);    // bu dinlenme için uyarı verildi mi
  const restOverride = useRef({});   // hareket id → kullanıcının seçtiği süre
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsBump, setAlertsBump] = useState(0); // ayar değişince paneli tazele

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

  // Bu hareketin yerine yapılabilecekler. Mantık data/muscles.js'te
  // (substitutesFor): aday, değiştirilen hareketin BİRİNCİL kasını en az yarım
  // set değerinde yüklemeli. Burada da aynı listeyi kullanıyoruz — bu ekranın
  // kendi kopyası vardı ve doğrulamasızdı (fly yerine elmas şınav öneriyordu).
  const swapOptions = ex ? substitutesFor(ex.id, exIds, 12) : [];

  // Hareketi bu oturum için değiştir (kaydedilmiş program etkilenmez).
  function swapTo(newId) {
    setSwaps((prev) => ({ ...prev, [i]: newId }));
    setSwapOpen(false);
    setWeight(""); setReps(""); setRir(""); setNote("");
    setNoMem.current[i] = 1;   // başka hareket: set sayacı gerçekten sıfırlanmalı
    setSetNo(1);
  }
  function undoSwap() {
    setSwaps((prev) => { const n = { ...prev }; delete n[i]; return n; });
    setSwapOpen(false);
    setWeight(""); setReps(""); setRir(""); setNote("");
    setNoMem.current[i] = 1;
    setSetNo(1);
  }
  // Programda bu hareket için özel set/tekrar ayarlandıysa (ör. 3×5, 5×5) onu kullan
  const targetSets = (ex && program.sets && program.sets[ex.id] != null) ? program.sets[ex.id] : meta.sets;
  const targetReps = (ex && program.reps && program.reps[ex.id] != null) ? String(program.reps[ex.id]) : meta.reps;

  // Süperset grupları: program.ssLinks'teki [a,b] çiftlerine göre ardışık bağlı
  // hareketler bir grup. Grup dinlenmesiz turlar halinde yapılır.
  const ssLinks = program.ssLinks || [];
  const isLink = (k) => k >= 0 && k < exIds.length - 1 && ssLinks.some((l) => l[0] === exIds[k] && l[1] === exIds[k + 1]);
  function groupBounds(idx) {
    if (idx == null || idx < 0 || idx >= exIds.length) return null;
    let s = idx, e = idx;
    while (s > 0 && isLink(s - 1)) s--;
    while (e < exIds.length - 1 && isLink(e)) e++;
    return e > s ? { start: s, end: e } : null;
  }
  function setsForIdx(k) {
    const e2 = getExercise(exIds[k]); if (!e2) return 1;
    return (program.sets && program.sets[exIds[k]] != null) ? program.sets[exIds[k]] : parseSets(e2.sets).sets;
  }
  const grp = ex ? groupBounds(i) : null;
  const groupSets = grp ? Math.max.apply(null, Array.from({ length: grp.end - grp.start + 1 }, (_, k) => setsForIdx(grp.start + k))) : targetSets;
  const curTotalSets = grp ? groupSets : targetSets;
  // Bu hareket için önerilen dinlenme (bileşik/izolasyon + hedef tekrara göre)
  const restPlan = (() => {
    if (!ex) return { sec: 90, why: "", label: "" };
    const base = restFor(ex.id, targetReps);
    const ov = restOverride.current[ex.id];
    return ov != null ? { ...base, sec: ov } : base;
  })();

  const prev = ex && lastLog ? lastLog(ex.id) : null;
  // Son 3 seans: takılma (üst üste başarısızlık) tespiti için birden fazla
  // seans gerekiyor; tek set yetmiyor.
  const exSessions = ex && exHistory ? exHistory(ex.id, 3) : [];
  const suggestion = ex ? overloadSuggestion(ex.id, targetReps, exSessions) : null;
  const curE1RM = est1RM(Number(weight), firstInt(reps));

  // Hareket değişince kilo/tekrar alanlarını son kayıttan / hedeften doldur
  useEffect(() => {
    if (!ex) return;
    setWeight(prev && prev.weight ? String(prev.weight) : "");
    setReps(prev && prev.reps ? String(prev.reps) : targetReps);
    setRir(""); setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => () => { clearInterval(timer.current); clearTimeout(prTimer.current); }, []);

  // Antrenman boyunca ekran kapanmasın (sayaç kesilmesin) ve iOS ses motoru
  // kullanıcı hareketiyle açılmış olsun — dinlenme bitince ses çıkabilsin.
  useEffect(() => {
    primeAudio();
    keepAwake();
    return () => releaseAwake();
  }, []);

  // Uygulama geri geldiğinde süreyi zaman damgasından tazele (kaçan uyarıyı ver)
  useEffect(() => {
    function onVis() { if (document.visibilityState === "visible" && resting) tickRest(); }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting]);

  // Aktif antrenman ilerlemesini cihaza yaz — uygulama kapanırsa yeniden
  // açılışta "kaldığın yerden devam et?" için. Bitince (done) snapshot temizlenir
  // (boş log ile bitirilse bile), onPersist(null) ile.
  useEffect(() => {
    if (!onPersist) return;
    if (done) { onPersist(null); return; }
    setNoMem.current[i] = setNo;
    onPersist({ i, setNo, setNoMem: { ...setNoMem.current }, warmup, swaps, log: log.current.slice() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, setNo, warmup, done, swaps]);

  if (exIds.length === 0) {
    return (
      <div className="workout">
        <div className="empty">Bu programda hareket yok.</div>
        <button className="btn-primary" onClick={onExit}>Kapat</button>
      </div>
    );
  }

  // Sayaç ZAMAN DAMGASINDAN hesaplanır (endAtRef), her saniye bir azaltılmaz.
  // Sebep: uygulama arka plana alınınca tarayıcı zamanlayıcıları kısar/durdurur;
  // sayaç kayardı. Bitiş anını saklayıp kalanı hesaplayınca geri dönüldüğünde
  // süre doğru olur ve kaçan uyarı hemen verilir.
  function tickRest() {
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setRest(left);
    if (left <= 0) {
      clearInterval(timer.current);
      setResting(false);
      if (!firedRef.current) {
        firedRef.current = true;
        alertRestDone(ex ? ex.name : null);
      }
    }
  }

  function startRest(sec) {
    clearInterval(timer.current);
    const dur = clampRest(sec != null ? sec : restPlan.sec);
    endAtRef.current = Date.now() + dur * 1000;
    firedRef.current = false;
    setResting(true);
    setRest(dur);
    timer.current = setInterval(tickRest, 250);
  }

  // Dinlenmeyi uzat/kısalt — bitiş anını kaydır ve bu hareket için hatırla
  function adjustRest(d) {
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    const next = clampRest(left + d);
    endAtRef.current = Date.now() + next * 1000;
    if (next > 0) firedRef.current = false;
    setRest(next);
    // Kullanıcının tercihi bu antrenman boyunca aynı harekette tekrar kullanılsın
    if (ex) restOverride.current[ex.id] = clampRest(restPlan.sec + d);
  }

  function skipRest() { clearInterval(timer.current); setResting(false); setRest(0); }

  function finishWorkout() {
    if (onFinish && log.current.length) {
      onFinish({ date: Date.now(), program: program.name, sets: log.current.slice() });
    }
    setDone(true);
  }
  // Şeritten hareket seçme. Antrenmanı SIFIRLAMAZ:
  //  • ayrılırken bulunduğun set numarasını o harekete not eder,
  //  • gittiğin harekette daha önce kaldığın yerden devam ettirir,
  //  • dinlenme sayacını ÖLDÜRMEZ (ileriye bakmak dinlenmeyi iptal etmemeli;
  //    gerçekten bitirmek isteyen "Atla →" düğmesini kullanır).
  function goToExercise(k) {
    if (k === i) return;
    setNoMem.current[i] = setNo;
    setI(k);
    setSetNo(setNoMem.current[k] || 1);
  }
  function nextExercise() {
    skipRest();
    if (i < exIds.length - 1) {
      // Doğal ilerleme: bitirdiğin hareketi "tamamlandı" say, sonrakine geç.
      setNoMem.current[i] = setNo;
      setI(i + 1);
      setSetNo(setNoMem.current[i + 1] || 1);
    }
    else finishWorkout();
  }
  function completeSet() {
    log.current.push({ exId: ex.id, weight: weight ? Number(weight) : null, reps: reps || targetReps,
      rir: rir !== "" ? Number(rir) : null, note: note.trim() || null });
    setNote(""); setRir("");
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
    if (grp) {
      // Süperset akışı: grup içindeyken dinlenmesiz sonraki harekete geç;
      // grubun son hareketinden sonra dinlen ve başa dön (bir sonraki tur).
      // Süpersette tur numarası GRUP boyunca ortaktır; her harekete aynı
      // numarayı not ediyoruz ki şeritten grup içinde gezinmek turu bozmasın.
      if (i < grp.end) { skipRest(); setNoMem.current[i] = setNo; setI(i + 1); }   // aynı tur, sonraki hareket, dinlenme yok
      else if (setNo < groupSets) {                                                // tur bitti → dinlen, başa dön
        for (let g = grp.start; g <= grp.end; g++) setNoMem.current[g] = setNo + 1;
        setI(grp.start); setSetNo(setNo + 1); startRest();
      }
      else if (grp.end < exIds.length - 1) {                                       // grup bitti → sonraki istasyon
        skipRest(); setNoMem.current[i] = setNo;
        setI(grp.end + 1); setSetNo(setNoMem.current[grp.end + 1] || 1);
      }
      else finishWorkout();
    } else if (setNo < targetSets) { setSetNo(setNo + 1); startRest(); }
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
          <div className="card" style={{ maxWidth: 420, width: "100%", margin: "0 auto", borderColor: "var(--attn)" }}>
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
        <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 42, textAlign: "right" }}>{i + 1}/{exIds.length}</span>
        <button className="btn-ghost" title="Uyarı ayarları" style={{ padding: "8px 10px" }}
          onClick={() => setAlertsOpen(true)}>🔔</button>
      </div>

      {alertsOpen && (
        <div onClick={() => setAlertsOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 330,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div key={alertsBump} onClick={(e) => e.stopPropagation()} className="card" style={{
            width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>🔔 Dinlenme uyarısı</div>
              <button className="icon-btn" onClick={() => setAlertsOpen(false)}>✕</button>
            </div>

            <button className="btn-ghost" style={{ width: "100%", padding: 13, textAlign: "left", marginBottom: 8 }}
              onClick={() => { setSoundOn(!soundOn()); setAlertsBump((n) => n + 1); }}>
              {soundOn() ? "🔊" : "🔇"} Ses {soundOn() ? "açık" : "kapalı"}
            </button>

            {notifPermission() === "granted" ? (
              <button className="btn-ghost" style={{ width: "100%", padding: 13, textAlign: "left" }}
                onClick={() => { setNotifOn(!notifOn()); setAlertsBump((n) => n + 1); }}>
                {notifOn() ? "🔔" : "🔕"} Bildirim {notifOn() ? "açık" : "kapalı"}
              </button>
            ) : notifPermission() === "unsupported" ? (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                Bu tarayıcı bildirimleri desteklemiyor. Ses ve titreşim çalışır.
              </p>
            ) : (
              <button className="btn-primary" style={{ width: "100%", padding: 13 }}
                onClick={async () => { await requestNotif(); setAlertsBump((n) => n + 1); }}>
                🔔 Bildirime izin ver
              </button>
            )}

            <p style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 10, marginBottom: 0, lineHeight: 1.55 }}>
              Antrenman boyunca <b>ekran açık tutulur</b>, böylece sayaç kesilmez ve uyarı zamanında gelir.
              Telefonu kilitlersen tarayıcı durdurulabilir; o durumda uygulamaya döndüğünde uyarı hemen verilir.
              {notifPermission() === "default" && " Bildirimler iPhone'da yalnızca ana ekrana eklenmiş uygulamada çalışır."}
            </p>
          </div>
        </div>
      )}

      {/* Sıradaki hareketler — isimleriyle, yatay kayan şerit (üst üste binmez).
          minWidth:0 + maxWidth:100% flexbox taşmasını önler (ekran zoomlanmaz).
          flexShrink:0 ŞART: .workout dikey bir flex kapsayıcı; içerik ekranı
          aşınca (ör. Spotify kartı açıkken) tarayıcı bu şeridi sıfıra kadar
          ezip görünmez yapıyordu. */}
      <div ref={stepsRef} className="workout-steps" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 2px 2px", width: "100%", minWidth: 0, maxWidth: "100%", flexShrink: 0, boxSizing: "border-box", WebkitOverflowScrolling: "touch" }}>
        {exIds.map((id, k) => {
          const e = getExercise(id);
          // "✓" ARTIK SIRAYA GORE DEGIL, GERCEK ILERLEMEYE GORE.
          // Eskiden k < i olan her hareket bitmiş sayılıyordu: 4 setlik bir
          // hareketin 2. setinde ileri atlayınca o hareket "✓" görünüyordu.
          // Yarım kalanlar artık "2/4" diye kendi ilerlemesini gösteriyor.
          const yapilan = log.current.filter((l) => l.exId === id).length;
          const hedef = setsForIdx(k);
          const bitti = yapilan >= hedef;
          const state = k === i ? "cur" : (bitti ? "done" : "next");
          const etiket = k === i ? (k + 1) + ". "
            : bitti ? "✓ "
            : yapilan > 0 ? yapilan + "/" + hedef + " · "
            : (k + 1) + ". ";
          return (
            <div key={id + "-" + k} onClick={() => { if (k !== i) goToExercise(k); }}
              style={{
                flexShrink: 0, maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                padding: "6px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: state === "cur" ? "var(--accent)" : "var(--card2)",
                color: state === "cur" ? "#04321f" : (state === "done" ? "var(--muted)" : "var(--text)"),
                opacity: bitti && k !== i ? 0.6 : 1,
                cursor: k !== i ? "pointer" : "default",
              }}>
              {etiket}{e.name}
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
          // Rekor rozeti sabit amber kalır: dolu zemin + koyu yazı her iki
          // temada da okunur, --attn ise açık temada koyulaştığı için burada
          // yazıyla çakışırdı.
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
        <div className="row" style={{ gap: 8, alignItems: "center", justifyContent: "center", marginTop: 6, maxWidth: "100%" }}>
          <h2 style={{ margin: 0, textAlign: "center", minWidth: 0 }}>{ex.name}</h2>
          {!resting && swapOptions.length > 0 && (
            <button className="icon-btn" title="Bu hareketi değiştir"
              onClick={() => setSwapOpen((v) => !v)}
              style={{ flexShrink: 0, padding: "4px 10px", color: swaps[i] ? "var(--accent)" : "var(--muted)" }}>
              ⇄
            </button>
          )}
        </div>
        {swaps[i] && (
          <div style={{ color: "var(--accent)", fontSize: 11 }}>
            değiştirildi · asıl: {getExercise(baseIds[i]) ? getExercise(baseIds[i]).name : "-"}
          </div>
        )}

        {/* Alt sayfa olarak açılır: antrenman ekranı position:fixed ve dikey
            kaydırması yok — panel içeride kalsaydı uzun listede kırpılırdı. */}
        {swapOpen && (
          <div onClick={() => setSwapOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 320,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{
              width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0",
              maxHeight: "85vh", display: "flex", flexDirection: "column",
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>“{ex.name}” yerine:</span>
                <button className="icon-btn" onClick={() => setSwapOpen(false)}>✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 11.5, margin: "0 0 8px" }}>
                Aynı kası çalıştıran alternatifler. Yalnız bu antrenman için geçerli — kayıtlı programın değişmez.
              </p>
              <div className="scroll-list" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
                {swapOptions.map((o) => (
                  <button key={o.id} onClick={() => swapTo(o.id)}
                    style={{ display: "block", width: "100%", textAlign: "left", background: "var(--card2)",
                      border: "none", borderRadius: 8, padding: "11px 12px", marginBottom: 6, color: "var(--text)" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5 }}>{o.equip || "serbest"} · {o.sets || ""}</div>
                  </button>
                ))}
              </div>
              {swaps[i] && (
                <button className="btn-ghost" style={{ width: "100%", padding: 11, marginTop: 8, flexShrink: 0 }} onClick={undoSwap}>
                  ↩︎ Asıl harekete dön
                </button>
              )}
            </div>
          </div>
        )}
        {grp && (
          <div style={{ color: "var(--accent2)", fontSize: 12, fontWeight: 700 }}>
            🔗 Süperset · {(i - grp.start + 1)}/{grp.end - grp.start + 1} hareket{i < grp.end ? " · sonra dinlenme YOK" : ""}
          </div>
        )}

        {resting ? (
          <>
            <div style={{ color: "var(--muted)", marginTop: 4 }}>Dinlenme</div>
            <div className="rest-count">{rest}<span> sn</span></div>
            <div style={{ color: "var(--accent2)", fontSize: 12, fontWeight: 700 }}>
              {restPlan.label} · önerilen {Math.round(restPlan.sec / 5) * 5} sn
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 4 }}>
              <button className="btn-ghost" style={{ padding: "10px 16px" }} onClick={() => adjustRest(-15)}>−15</button>
              <button className="btn-ghost" style={{ padding: "10px 16px" }} onClick={() => adjustRest(15)}>+15</button>
              <button className="btn-ghost" style={{ padding: "10px 18px" }} onClick={skipRest}>Atla →</button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 11.5, textAlign: "center", maxWidth: 320, margin: "6px 12px 0", lineHeight: 1.5 }}>
              {restPlan.why}
            </p>
          </>
        ) : (
          <>
            <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 2 }}>
              <span className="pill" style={{ fontSize: 14 }}>{grp ? "Tur" : "Set"} {setNo} / {curTotalSets}</span>
              <span className="pill lvl" style={{ fontSize: 14 }}>Hedef: {targetReps}</span>
            </div>
            {prev && (prev.weight || prev.reps) && (
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Son: {prev.weight ? prev.weight + " kg" : ""}{prev.weight && prev.reps ? " × " : ""}{prev.reps || ""}
              </div>
            )}
            {suggestion && (
              <div style={{ marginTop: 4, textAlign: "center", maxWidth: 320 }}>
                <button className="chip on"
                  onClick={() => {
                    // weight null olabilir (vücut ağırlığı / izometrik) —
                    // String(null) girdiye "null" yazardı.
                    setWeight(suggestion.weight == null ? "" : String(suggestion.weight));
                    setReps(String(suggestion.reps));
                  }}>
                  {suggestion.tone === "down" ? "🔻 Hafifle: " : suggestion.tone === "hold" ? "🔁 Aynı: " : "🎯 Hedef: "}
                  {suggestion.weight != null ? suggestion.weight + " kg × " : ""}
                  {suggestion.reps}
                  {suggestion.weight == null && !/sn|dk/i.test(suggestion.reps) ? " tekrar" : ""} (uygula)
                </button>
                <p style={{ color: "var(--muted)", fontSize: 11.5, margin: "4px 0 0", lineHeight: 1.5 }}>
                  {suggestion.why}
                </p>
              </div>
            )}
            <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 6, width: "100%", maxWidth: 320 }}>
              <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
              {/* type="text" KALIYOR: hedef "8-12" ya da "30 sn" olabiliyor ve
                  number bunları kabul etmez. Ama inputMode="numeric" ekli —
                  set kaydı uygulamanın EN ÇOK tekrarlanan işlemi ve her sette
                  tam QWERTY klavye açılması salonda gereksiz sürtünmeydi.
                  Zaman/aralık gerektiren hareketlerde alan zaten hedefle dolu
                  geliyor, kullanıcı yalnızca yaptığı sayıyı yazıyor. */}
              <input className="input" type="text" inputMode="numeric" placeholder="Tekrar" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>RIR</span>
              {["0", "1", "2", "3", "4"].map((v) => (
                <button key={v} onClick={() => setRir(rir === v ? "" : v)}
                  style={{ padding: "4px 11px", borderRadius: 999, fontSize: 13, fontWeight: 700, border: "none",
                    background: rir === v ? "var(--accent)" : "var(--card2)", color: rir === v ? "#04321f" : "var(--text)" }}>
                  {v === "4" ? "4+" : v}
                </button>
              ))}
            </div>
            <input className="input" style={{ width: "100%", maxWidth: 320, marginTop: 6 }} placeholder="Not (isteğe bağlı)"
              value={note} onChange={(e) => setNote(e.target.value)} />
            {curE1RM && (
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2, textAlign: "center" }}>
                Tahmini 1RM: <b style={{ color: "var(--accent)" }}>~{curE1RM} kg</b>
                <div style={{ fontSize: 10, opacity: 0.75 }}>1 tekrar maksimum — bir kez kaldırabileceğin ağırlık tahmini</div>
              </div>
            )}
          </>
        )}
      </div>

      {!resting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn-primary" onClick={completeSet}>
            {grp && i < grp.end ? "✓ Sıradaki (süperset) →" : (setNo < curTotalSets ? "✓ Set tamamlandı" : "✓ Hareketi bitir")}
          </button>
          <button className="btn-ghost" style={{ padding: 12 }} onClick={nextExercise}>Sonraki hareket →</button>
        </div>
      )}
    </div>
  );
}
