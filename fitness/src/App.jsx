import React, { useEffect, useState, useRef } from "react";
import { onAuthChange, firebaseLogout, dbGet, dbSet } from "./firebase";
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

// Profil cihazda da saklanır (Firebase yazılamasa bile her açılışta sormamak için)
function lsGetProfile() {
  try { const d = localStorage.getItem("fitbe_profile"); return d ? JSON.parse(d) : null; } catch (e) { return null; }
}
function lsSetProfile(p) {
  try { localStorage.setItem("fitbe_profile", JSON.stringify(p)); } catch (e) {}
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
      if (!u) { loaded.current = false; setPrograms([]); setActiveId(null); setProfile(null); setProfileLoaded(false); setHistory([]); setProgress({ weights: [], measures: [] }); setSchedule({}); setAvatar(null); }
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

      const data = await dbGet("programs");
      const prof = await dbGet("profile");
      const hist = await dbGet("workouts");
      const prog = await dbGet("progress");
      const sched = await dbGet("schedule");
      const av = await dbGet("avatar");
      if (cancelled) return;
      if (sched && typeof sched === "object") setSchedule(sched);
      if (typeof av === "string" && av) { setAvatar(av); lsSetAvatar(av); }
      if (prog && (Array.isArray(prog.weights) || Array.isArray(prog.measures))) {
        setProgress({ weights: prog.weights || [], measures: prog.measures || [] });
      }
      if (data && Array.isArray(data.list)) {
        setPrograms(data.list);
        setActiveId(data.activeId || (data.list[0] && data.list[0].id) || null);
      }
      if (prof && prof.gender) { setProfile(prof); lsSetProfile(prof); }
      else if (localProf) { dbSet("profile", localProf); } // buluta da yedekle
      if (Array.isArray(hist)) setHistory(hist);
      setProfileLoaded(true);
      loaded.current = true;
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
  }

  // Haftalık plana program ata (day: 0=Pzt … 6=Paz)
  function setScheduleDay(day, programId) {
    setSchedule((prev) => {
      const next = { ...prev };
      if (programId) next[day] = programId; else delete next[day];
      dbSet("schedule", next);
      return next;
    });
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

  // --- Değişiklikte Firebase'e kaydet ---
  useEffect(() => {
    if (!user || !loaded.current) return;
    dbSet("programs", { list: programs, activeId });
  }, [programs, activeId, user]);

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
          setTimeout(() => window.location.reload(), 1800);
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
  }

  function removeExercise(programId, index) {
    setPrograms((prev) => prev.map((p) =>
      p.id === programId ? { ...p, exercises: p.exercises.filter((_, i) => i !== index) } : p
    ));
  }

  function addToProgram(ex) {
    setPrograms((prev) => {
      let list = prev;
      let targetId = activeId;
      if (!targetId || !list.find((p) => p.id === targetId)) {
        const np = { id: uid(), name: "Favori Hareketlerim", exercises: [] };
        list = [...list, np];
        targetId = np.id;
        setActiveId(np.id);
      }
      return list.map((p) => p.id === targetId ? { ...p, exercises: [...p.exercises, ex.id] } : p);
    });
    flash("“" + ex.name + "” programına eklendi");
  }

  function copyReady(rp) {
    const allIds = [];
    rp.days.forEach((d) => d.exercises.forEach((id) => { if (getExercise(id)) allIds.push(id); }));
    const p = { id: uid(), name: rp.name, exercises: allIds };
    setPrograms((prev) => [...prev, p]);
    setActiveId(p.id);
    flash("“" + rp.name + "” programlarına kopyalandı");
    setTab("mine");
  }

  if (!authReady) {
    return <>{splash && <Splash hiding={splashHide} />}<div className="login-wrap"><div style={{ color: "var(--muted)" }}>Yükleniyor…</div></div></>;
  }
  if (!user) return <>{splash && <Splash hiding={splashHide} />}<Login /></>;

  return (
    <div className="app">
      {splash && <Splash hiding={splashHide} />}
      {profileLoaded && !profile && <Onboarding onSave={saveProfile} />}
      {workout && <WorkoutMode program={workout} onExit={() => setWorkout(null)} onFinish={saveWorkout} lastLog={lastLog} />}
      <div className="topbar">
        <div className="brand">Fit<span>+be</span></div>
        <button className="btn-ghost" onClick={() => setTab("profile")} style={{ padding: avatar ? 4 : undefined }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            : "👤"}
        </button>
      </div>

      {tab === "regions" && <BodyRegions onAddToProgram={addToProgram} />}
      {tab === "ready" && <ReadyPrograms onCopy={copyReady} profile={profile} />}
      {tab === "mine" && (
        <ProgramBuilder
          programs={programs}
          activeId={activeId}
          schedule={schedule}
          history={history}
          onSetSchedule={setScheduleDay}
          onCreate={createProgram}
          onDelete={deleteProgram}
          onSetActive={setActiveId}
          onRemoveExercise={removeExercise}
          onStart={(p) => setWorkout(p)}
        />
      )}
      {tab === "nutrition" && <Nutrition />}
      {tab === "progress" && <Progress data={progress} history={history} onSave={saveProgress} />}
      {tab === "feed" && <Timeline />}
      {tab === "profile" && <Profile profile={profile} email={user && user.email} onSave={saveProfile} history={history} avatar={avatar} onSaveAvatar={saveAvatar} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)",
          background: "var(--ok)", color: "#04321f", padding: "10px 16px", borderRadius: 12,
          fontWeight: 700, fontSize: 13, zIndex: 50, maxWidth: "90%", textAlign: "center",
        }}>{toast}</div>
      )}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            <span className="ic">{t.ic}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
