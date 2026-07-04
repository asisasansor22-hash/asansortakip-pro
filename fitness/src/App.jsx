import React, { useEffect, useState, useRef } from "react";
import { onAuthChange, firebaseLogout, dbGet, dbSet, feedList, feedCommentsGet, setPublicAvatar } from "./firebase";
import Login from "./components/Login";
import BodyRegions from "./components/BodyRegions";
import ProgramBuilder from "./components/ProgramBuilder";
import ReadyPrograms from "./components/ReadyPrograms";
import Nutrition from "./components/Nutrition";
import Splash from "./components/Splash";
import Onboarding from "./components/Onboarding";
import Profile from "./components/Profile";
import Progress from "./components/Progress";
import Timeline from "./components/Timeline";
import PublicPost from "./components/PublicPost";
import WorkoutMode from "./components/WorkoutMode";
import { getExercise } from "./data/exercises";

const TABS = [
  { id: "regions", ic: "🗺️", label: "Bölgeler" },
  { id: "ready", ic: "📋", label: "Hazır" },
  { id: "mine", ic: "📝", label: "Programım" },
  { id: "nutrition", ic: "🥗", label: "Beslenme" },
  { id: "progress", ic: "📈", label: "İlerleme" },
  { id: "feed", ic: "💬", label: "Akış" },
  { id: "profile", ic: "👤", label: "Profil" },
];

function uid() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Profil cihazda da saklanır (Firebase yazılamasa bile her açılışta sormamak için)
function lsGetProfile() {
  try { const d = localStorage.getItem("fitbe_profile"); return d ? JSON.parse(d) : null; } catch (e) { return null; }
}
function lsSetProfile(p) {
  try { localStorage.setItem("fitbe_profile", JSON.stringify(p)); } catch (e) {}
}
// Firebase, tüm alt anahtarları ardışık sayı (0,1,2…) olan objeleri diziye
// çevirir; bu yüzden {0:"a",2:"b"} gibi bir plan geri okunduğunda [ "a", null, "b" ]
// olarak gelebilir. Her zaman temiz bir obje haline getir (boş günleri at).
function normalizeSchedule(v) {
  const out = {};
  if (!v || typeof v !== "object") return out;
  Object.keys(v).forEach((k) => { if (v[k]) out[k] = v[k]; });
  return out;
}
// Service worker'ları kaldırıp sayfayı ağdan tazeleyerek zorla güncelle.
async function hardReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {}
  window.location.reload();
}

// Programlar + plan cihazda da yedeklenir: bulut okunamazsa boş ekran yerine
// son bilinen hal gösterilir (kaydetme yine kilitli kalır — üzerine yazma yok).
function lsGetPack() {
  try { const d = localStorage.getItem("fitbe_programs"); return d ? JSON.parse(d) : null; } catch (e) { return null; }
}
function lsSetPack(p) {
  try { localStorage.setItem("fitbe_programs", JSON.stringify(p)); } catch (e) {}
}
// Firebase boş dizileri sakladığı için exercises alanını normalize et
function normalizeList(list) {
  return (list || []).filter(Boolean).map((p) => ({
    ...p,
    exercises: Array.isArray(p.exercises) ? p.exercises : (p.exercises ? Object.values(p.exercises) : []),
  }));
}

function lsGetAvatar() {
  try { return localStorage.getItem("fitbe_avatar") || null; } catch (e) { return null; }
}
function lsSetAvatar(v) {
  try { if (v) localStorage.setItem("fitbe_avatar", v); else localStorage.removeItem("fitbe_avatar"); } catch (e) {}
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState("regions");

  const [programs, setPrograms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const loaded = useRef(false);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState(lsGetProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState({ weights: [], measures: [] });
  const [schedule, setSchedule] = useState({});
  const [avatar, setAvatar] = useState(lsGetAvatar);
  const [mentionCount, setMentionCount] = useState(0);
  const [addPick, setAddPick] = useState(null); // eklenmek istenen hareket (program seçimi bekliyor)
  const [copyPick, setCopyPick] = useState(null); // hazır program ekleme: {rp, days:[idx], sel:{idx:weekday}}
  const [favorites, setFavorites] = useState([]); // favori hareket id'leri

  // --- Açılış (splash) ekranı ---
  const [splash, setSplash] = useState(true);
  const [splashHide, setSplashHide] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setSplashHide(true), 1300);
    const t2 = setTimeout(() => setSplash(false), 1750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // --- Auth ---
  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) { loaded.current = false; setPrograms([]); setActiveId(null); setProfile(null); setProfileLoaded(false); setHistory([]); setProgress({ weights: [], measures: [] }); setSchedule({}); setAvatar(null); setFavorites([]); }
    });
  }, []);

  // --- Kullanıcı verisini yükle (programlar + profil) ---
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // Cihazdaki profili anında uygula (Firebase beklemeden)
      const localProf = lsGetProfile();
      if (localProf && !cancelled) setProfile(localProf);
      // Cihazdaki program yedeğini hemen göster (bulut gelince güncellenir)
      const pack = lsGetPack();
      if (pack && Array.isArray(pack.list) && !cancelled) {
        setPrograms(normalizeList(pack.list));
        setActiveId(pack.activeId || null);
        if (pack.schedule) setSchedule(normalizeSchedule(pack.schedule));
      }

      const data = await dbGet("programs");
      const prof = await dbGet("profile");
      const hist = await dbGet("workouts");
      const prog = await dbGet("progress");
      const sched = await dbGet("schedule");
      const av = await dbGet("avatar");
      const favs = await dbGet("favorites");
      if (cancelled) return;
      if (Array.isArray(favs)) setFavorites(favs);
      if (sched && typeof sched === "object") setSchedule(normalizeSchedule(sched));
      if (typeof av === "string" && av) { setAvatar(av); lsSetAvatar(av); setPublicAvatar(av); /* herkese açık kopyaya yedekle */ }
      if (prog && typeof prog === "object") {
        setProgress({
          weights: Array.isArray(prog.weights) ? prog.weights : [],
          measures: Array.isArray(prog.measures) ? prog.measures : [],
          goalKg: (typeof prog.goalKg === "number" && prog.goalKg > 0) ? prog.goalKg : null,
        });
      }
      // Bulutta programlar varsa uygula ve cihaza yedekle. Yoksa cihaz yedeği
      // (varsa) ekranda kalır — sessiz, kilit yok.
      if (data && Array.isArray(data.list)) {
        const list = normalizeList(data.list);
        setPrograms(list);
        setActiveId(data.activeId || (list[0] && list[0].id) || null);
        lsSetPack({ list, activeId: data.activeId || null, schedule: sched || (pack && pack.schedule) || {} });
      }
      if (prof && prof.gender) { setProfile(prof); lsSetProfile(prof); }
      else if (localProf) { dbSet("profile", localProf); } // buluta da yedekle
      if (Array.isArray(hist)) setHistory(hist);
      setProfileLoaded(true);
      loaded.current = true; // yerel-öncelik: kaydetme her durumda açık (önce cihaza)
      // Kullanıcı kimliğini (e-posta) kaydet — admin paneli için. Şifre ASLA saklanmaz.
      dbSet("info", { email: user.email || "", lastSeen: Date.now() });
    })();
    return () => { cancelled = true; };
  }, [user]);

  function saveProfile(p) {
    setProfile(p);
    lsSetProfile(p);
    dbSet("profile", p);
  }

  // Antrenman oturumunu kaydet (en yeni başta, son 50 tutulur)
  function saveWorkout(session) {
    setHistory((prev) => {
      const next = [session, ...prev].slice(0, 50);
      dbSet("workouts", next);
      return next;
    });
  }

  // İlerleme verisini kaydet (kilo + ölçüler)
  function saveProgress(next) {
    setProgress(next);
    dbSet("progress", next);
  }

  // Profil fotoğrafı (avatar) kaydet/sil
  function saveAvatar(dataUrl) {
    setAvatar(dataUrl || null);
    lsSetAvatar(dataUrl || null);
    dbSet("avatar", dataUrl || "");
    setPublicAvatar(dataUrl || null); // herkese açık avatar düğümü
  }

  // Favori hareket ekle/çıkar
  function toggleFavorite(exId) {
    setFavorites((prev) => {
      const next = prev.includes(exId) ? prev.filter((x) => x !== exId) : [...prev, exId];
      dbSet("favorites", next);
      return next;
    });
  }

  // Haftalık plana program ata (day: 0=Pzt … 6=Paz)
  // Kalıcılığı birleşik kaydetme akışı üstlenir (önce cihaz, sonra bulut).
  function setScheduleDay(day, programId) {
    setSchedule((prev) => {
      const next = { ...prev };
      if (programId) next[day] = programId; else delete next[day];
      return next;
    });
  }

  // Bir hareketteki tüm zamanların en iyi tahmini 1RM'i (rekor tespiti için)
  function bestE1RM(exId) {
    let best = 0;
    for (const s of history) {
      for (const st of (s.sets || [])) {
        if (st.exId !== exId) continue;
        const w = Number(st.weight);
        const m = String(st.reps || "").match(/\d+/);
        const r = m ? parseInt(m[0], 10) : 0;
        if (w > 0 && r > 0) {
          const e = Math.round(w * (1 + r / 30));
          if (e > best) best = e;
        }
      }
    }
    return best;
  }

  // Bir hareket için en son girilen kilo/tekrar
  function lastLog(exId) {
    for (const s of history) {
      if (!s.sets) continue;
      for (let k = s.sets.length - 1; k >= 0; k--) {
        if (s.sets[k].exId === exId) return s.sets[k];
      }
    }
    return null;
  }

  // --- Değişiklikte kaydet: hem cihaza (localStorage) hem buluta (sessiz,
  // kilit/banner yok — eskiden çalışan basit davranış). ---
  useEffect(() => {
    if (!user || !loaded.current) return;
    lsSetPack({ list: programs, activeId, schedule });
    dbSet("programs", { list: programs, activeId });
    dbSet("schedule", schedule);
  }, [programs, activeId, schedule, user]);

  // --- Otomatik güncelleme: yeni sürüm yayınlandıysa algıla, bildir, yenile ---
  useEffect(() => {
    let triggered = false;
    async function check() {
      if (triggered) return;
      try {
        const r = await fetch("/version.json?ts=" + Date.now(), { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (j && j.v && typeof __BUILD_ID__ !== "undefined" && j.v !== __BUILD_ID__) {
          triggered = true;
          setToast("Yeni sürüm yüklendi, güncelleniyor…");
          setTimeout(hardReload, 1500);
        }
      } catch (e) {}
    }
    check();
    const iv = setInterval(check, 90000);
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  // --- @etiket bildirimi (uygulama içi): akışta adımın geçtiği yeni gönderiler ---
  useEffect(() => {
    if (!user) { setMentionCount(0); return; }
    const myName = (user.email || "").split("@")[0].toLowerCase();
    if (!myName) return;
    const seenKey = "fitbe_feedseen_" + (user.email || "");
    let stopped = false;
    async function scan() {
      if (stopped) return;
      const r = await feedList();
      if (!r.success || stopped) return;
      let seen = 0;
      try { seen = Number(localStorage.getItem(seenKey) || 0); } catch (e) {}
      const mentionsMe = (text) => {
        const tags = (text || "").match(/@[a-zA-Z0-9_.çğıöşüÇĞİÖŞÜ]+/g) || [];
        return tags.some((tag) => tag.slice(1).toLowerCase() === myName);
      };
      // 1) Gönderilerde etiket
      let n = r.posts.filter((p) => p.uid !== user.uid && (p.t || 0) > seen && mentionsMe(p.text)).length;
      // 2) Yorumlar: benim gönderime yorum + yorumda etiket
      const myPostIds = new Set(r.posts.filter((p) => p.uid === user.uid).map((p) => p.id));
      const allComments = await feedCommentsGet();
      if (stopped) return;
      Object.keys(allComments || {}).forEach((postId) => {
        const cs = allComments[postId] || {};
        Object.keys(cs).forEach((cid) => {
          const c = cs[cid] || {};
          if (c.uid === user.uid || (c.t || 0) <= seen) return;
          if (myPostIds.has(postId) || mentionsMe(c.text)) n++;
        });
      });
      setMentionCount(n);
    }
    scan();
    const iv = setInterval(scan, 60000);
    const onVis = () => { if (document.visibilityState === "visible") scan(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { stopped = true; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [user]);

  // Akış sekmesi açılınca etiketleri "görüldü" işaretle
  useEffect(() => {
    if (tab !== "feed" || !user) return;
    try { localStorage.setItem("fitbe_feedseen_" + (user.email || ""), String(Date.now())); } catch (e) {}
    setMentionCount(0);
  }, [tab, user]);

  // --- Program işlemleri ---
  function createProgram(name) {
    const p = { id: uid(), name, exercises: [] };
    setPrograms((prev) => [...prev, p]);
    setActiveId(p.id);
    return p.id;
  }

  function deleteProgram(id) {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
    // Silinen programa atanmış gün varsa haftalık plandan da temizle
    setSchedule((prev) => {
      const next = {};
      let changed = false;
      Object.keys(prev).forEach((k) => {
        if (prev[k] === id) { changed = true; return; }
        next[k] = prev[k];
      });
      if (!changed) return prev;
      return next;
    });
  }

  function removeExercise(programId, index) {
    setPrograms((prev) => prev.map((p) =>
      p.id === programId ? { ...p, exercises: p.exercises.filter((_, i) => i !== index) } : p
    ));
  }

  // Programdaki hareketi bir üste/alta taşı (dir: -1 | +1)
  function moveExercise(programId, index, dir) {
    setPrograms((prev) => prev.map((p) => {
      if (p.id !== programId) return p;
      const j = index + dir;
      if (j < 0 || j >= p.exercises.length) return p;
      const ex = [...p.exercises];
      const t = ex[index]; ex[index] = ex[j]; ex[j] = t;
      return { ...p, exercises: ex };
    }));
  }

  // Hareket eklerken hangi programa ekleneceğini sor. Program yoksa uyar.
  function addToProgram(ex) {
    if (programs.length === 0) {
      flash("Önce “Programım” sekmesinden bir program oluştur.");
      setTab("mine");
      return;
    }
    setAddPick(ex);
  }
  // Seçilen programa hareketi ekle
  function addExerciseToProgram(programId, ex) {
    setPrograms((prev) => prev.map((p) =>
      p.id === programId ? { ...p, exercises: [...p.exercises, ex.id] } : p
    ));
    setActiveId(programId);
    const prog = programs.find((p) => p.id === programId);
    flash("“" + ex.name + "” → " + (prog ? prog.name : "program") + " eklendi");
    setAddPick(null);
  }

  // Hazır program ekleme: önce gün atama penceresi aç (her gün ayrı program
  // olur; kullanıcı isterse eklerken haftanın gününe de atar).
  function copyReady(rp) {
    const days = rp.days
      .map((d, idx) => idx)
      .filter((idx) => (rp.days[idx].exercises || []).some((id) => getExercise(id)));
    if (days.length === 0) { flash("Bu programda eklenebilir hareket yok"); return; }
    setCopyPick({ rp, days, sel: {} });
  }

  // Hazır programın TEK bir gününü ekle (yine gün atama penceresiyle)
  function copyReadyDay(rp, dayIndex) {
    const d = rp.days[dayIndex];
    if (!d || !(d.exercises || []).some((id) => getExercise(id))) { flash("Bu günde eklenebilir hareket yok"); return; }
    setCopyPick({ rp, days: [dayIndex], sel: {} });
  }

  // Gün atama penceresinde "Ekle" — programları oluştur, seçilen günlere ata
  function confirmCopy() {
    if (!copyPick) return;
    const { rp, days, sel } = copyPick;
    const created = days.map((di) => {
      const d = rp.days[di];
      return {
        weekday: (sel[di] != null) ? sel[di] : null,
        p: { id: uid(), name: rp.name + " — " + d.name, note: d.note || null, exercises: (d.exercises || []).filter((x) => getExercise(x)) },
      };
    });
    setPrograms((prev) => [...prev, ...created.map((c) => c.p)]);
    setSchedule((prev) => {
      const next = { ...prev };
      let changed = false;
      created.forEach(({ p, weekday }) => { if (weekday != null) { next[weekday] = p.id; changed = true; } });
      if (!changed) return prev;
      return next;
    });
    const assigned = created.filter((c) => c.weekday != null).length;
    setCopyPick(null);
    flash(created.length + " program eklendi" + (assigned ? " · " + assigned + " güne atandı" : ""));
    setTab("mine");
  }

  // Herkese açık tek gönderi linki (#/p/<id>) — giriş gerektirmez
  const pubMatch = (typeof window !== "undefined" ? (window.location.hash || "") : "").match(/^#\/p\/(.+)$/);
  if (pubMatch) return <PublicPost id={decodeURIComponent(pubMatch[1])} />;

  if (!authReady) {
    return <>{splash && <Splash hiding={splashHide} />}<div className="login-wrap"><div style={{ color: "var(--muted)" }}>Yükleniyor…</div></div></>;
  }
  if (!user) return <>{splash && <Splash hiding={splashHide} />}<Login /></>;

  return (
    <div className="app">
      {splash && <Splash hiding={splashHide} />}
      {profileLoaded && !profile && <Onboarding onSave={saveProfile} />}
      {workout && <WorkoutMode program={workout} onExit={() => setWorkout(null)} onFinish={saveWorkout} lastLog={lastLog} bestE1RM={bestE1RM} />}
      <div className="topbar">
        <div className="brand">Fit<span>+be</span></div>
        <button className="btn-ghost" onClick={() => setTab("profile")} style={{ padding: avatar ? 4 : undefined }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            : "👤"}
        </button>
      </div>

      {tab === "regions" && <BodyRegions onAddToProgram={addToProgram} favorites={favorites} onToggleFavorite={toggleFavorite} />}
      {tab === "ready" && <ReadyPrograms onCopy={copyReady} onCopyDay={copyReadyDay} profile={profile} />}
      {tab === "mine" && (
        <ProgramBuilder
          programs={programs}
          schedule={schedule}
          history={history}
          onSetSchedule={setScheduleDay}
          onCreate={createProgram}
          onDelete={deleteProgram}
          onRemoveExercise={removeExercise}
          onMoveExercise={moveExercise}
          onStart={(p) => setWorkout(p)}
        />
      )}
      {tab === "nutrition" && <Nutrition />}
      {tab === "progress" && <Progress data={progress} history={history} onSave={saveProgress} />}
      {tab === "feed" && <Timeline />}
      {tab === "profile" && <Profile profile={profile} email={user && user.email} onSave={saveProfile} history={history} avatar={avatar} onSaveAvatar={saveAvatar} />}

      {addPick && (
        <div onClick={() => setAddPick(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 55,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{
            width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0", maxHeight: "70vh", overflowY: "auto",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Hangi programa?</div>
              <button className="icon-btn" onClick={() => setAddPick(null)}>✕</button>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
              “{addPick.name}” eklenecek program:
            </div>

            {Object.keys(schedule).some((k) => programs.find((p) => p.id === schedule[k])) && (
              <>
                <div style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 6px" }}>📅 Haftalık plandan güne ekle:</div>
                {DAY_SHORT.map((dn, di) => {
                  const p = programs.find((x) => x.id === schedule[di]);
                  if (!p) return null;
                  return (
                    <button key={"d" + di} className="card" style={{
                      width: "100%", textAlign: "left", marginBottom: 6, padding: 10,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }} onClick={() => addExerciseToProgram(p.id, addPick)}>
                      <span style={{ fontSize: 14 }}><b style={{ color: "var(--accent)" }}>{dn}</b> · {p.name}</span>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>({p.exercises.length})</span>
                    </button>
                  );
                })}
                <div style={{ color: "var(--muted)", fontSize: 12, margin: "10px 0 6px" }}>Tüm programlar:</div>
              </>
            )}

            {programs.map((p) => {
              const pDays = DAY_SHORT.filter((_, di) => schedule[di] === p.id);
              return (
                <button key={p.id} className="card" style={{
                  width: "100%", textAlign: "left", marginBottom: 8, padding: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }} onClick={() => addExerciseToProgram(p.id, addPick)}>
                  <span style={{ fontWeight: 700 }}>{p.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({p.exercises.length})</span></span>
                  {pDays.length > 0 && <span className="pill" style={{ color: "var(--accent2)" }}>{pDays.join(", ")}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {copyPick && (
        <div onClick={() => setCopyPick(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 55,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{
            width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0", maxHeight: "78vh", overflowY: "auto",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>📅 Günlere ata ve ekle</div>
              <button className="icon-btn" onClick={() => setCopyPick(null)}>✕</button>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>
              Her gün ayrı bir program olarak eklenecek. İstersen şimdi haftanın gününe ata — sonradan da değiştirebilirsin.
            </div>
            {copyPick.days.map((di) => {
              const d = copyPick.rp.days[di];
              return (
                <div key={di} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{d.name}
                    <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}> ({(d.exercises || []).filter((x) => getExercise(x)).length} hareket)</span>
                  </div>
                  <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                    {DAY_SHORT.map((dn, wi) => {
                      const on = copyPick.sel[di] === wi;
                      const takenElsewhere = Object.keys(copyPick.sel).some((k) => Number(k) !== di && copyPick.sel[k] === wi);
                      return (
                        <button key={wi} disabled={takenElsewhere}
                          onClick={() => setCopyPick((c) => ({ ...c, sel: { ...c.sel, [di]: on ? null : wi } }))}
                          style={{
                            padding: "7px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: on ? "var(--accent)" : "var(--card2)",
                            color: on ? "#04321f" : "var(--text)",
                            opacity: takenElsewhere ? 0.35 : 1,
                          }}>{dn}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button className="btn-primary" onClick={confirmCopy}>
              ✓ Ekle ({copyPick.days.length} program{Object.values(copyPick.sel).filter((v) => v != null).length > 0 ? " · " + Object.values(copyPick.sel).filter((v) => v != null).length + " güne atanacak" : ""})
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)",
          background: "var(--ok)", color: "#04321f", padding: "10px 16px", borderRadius: 12,
          fontWeight: 700, fontSize: 13, zIndex: 50, maxWidth: "90%", textAlign: "center",
        }}>{toast}</div>
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)} style={{ position: "relative" }}>
            <span className="ic">{t.ic}</span>
            {t.id === "feed" && mentionCount > 0 && (
              <span style={{
                position: "absolute", top: 0, right: "50%", marginRight: -22,
                background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 800,
                minWidth: 15, height: 15, borderRadius: 999, padding: "0 4px",
                display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>{mentionCount > 9 ? "9+" : mentionCount}</span>
            )}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
