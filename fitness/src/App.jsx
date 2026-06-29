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
import WorkoutMode from "./components/WorkoutMode";
import { getExercise } from "./data/exercises";

const TABS = [
  { id: "regions", ic: "🗺️", label: "Bölgeler" },
  { id: "ready", ic: "📋", label: "Hazır" },
  { id: "mine", ic: "📝", label: "Programım" },
  { id: "nutrition", ic: "🥗", label: "Beslenme" },
  { id: "profile", ic: "👤", label: "Profil" },
];

function uid() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState("regions");

  const [programs, setPrograms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const loaded = useRef(false);
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [workout, setWorkout] = useState(null);

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
      if (!u) { loaded.current = false; setPrograms([]); setActiveId(null); setProfile(null); setProfileLoaded(false); }
    });
  }, []);

  // --- Kullanıcı verisini yükle (programlar + profil) ---
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const data = await dbGet("programs");
      const prof = await dbGet("profile");
      if (cancelled) return;
      if (data && Array.isArray(data.list)) {
        setPrograms(data.list);
        setActiveId(data.activeId || (data.list[0] && data.list[0].id) || null);
      }
      if (prof && prof.gender) setProfile(prof);
      setProfileLoaded(true);
      loaded.current = true;
    })();
    return () => { cancelled = true; };
  }, [user]);

  function saveProfile(p) {
    setProfile(p);
    dbSet("profile", p);
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
      {workout && <WorkoutMode program={workout} onExit={() => setWorkout(null)} />}
      <div className="topbar">
        <div className="brand">Fit<span>+be</span></div>
        <button className="btn-ghost" onClick={() => setTab("profile")}>👤</button>
      </div>

      {tab === "regions" && <BodyRegions onAddToProgram={addToProgram} />}
      {tab === "ready" && <ReadyPrograms onCopy={copyReady} profile={profile} />}
      {tab === "mine" && (
        <ProgramBuilder
          programs={programs}
          activeId={activeId}
          onCreate={createProgram}
          onDelete={deleteProgram}
          onSetActive={setActiveId}
          onRemoveExercise={removeExercise}
          onStart={(p) => setWorkout(p)}
        />
      )}
      {tab === "nutrition" && <Nutrition />}
      {tab === "profile" && <Profile profile={profile} email={user && user.email} onSave={saveProfile} />}

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
