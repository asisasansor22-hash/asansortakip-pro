import React, { useEffect, useState, useRef } from "react";
import { onAuthChange, firebaseLogout, dbGet, dbGetR, dbSet, feedList, feedCommentsGet, setPublicAvatar, lbPublish, dirPublish, dmMetaGet } from "./firebase";
import { dmSeenGet } from "./components/Messages";
import { earnedCount } from "./data/achievements";
import { compactHistory, totalsOf, bestOf } from "./data/history";
import { mergeHistory, sameHistory, mergePrograms, mergeSchedule, mergeProgress, mergeFavorites } from "./data/merge";
import { push, flushOutbox, onReconnect, surelyOffline } from "./utils/sync";
import { clearAll as clearOutbox } from "./utils/outbox";
import Login from "./components/Login";
import BodyRegions from "./components/BodyRegions";
import ProgramBuilder from "./components/ProgramBuilder";
import ReadyPrograms from "./components/ReadyPrograms";
import Nutrition from "./components/Nutrition";
import Splash from "./components/Splash";
import Onboarding from "./components/Onboarding";
import Profile from "./components/Profile";
import Progress from "./components/Progress";
import Social from "./components/Social";
import PublicPost from "./components/PublicPost";
import WorkoutMode from "./components/WorkoutMode";
import ReminderBar from "./components/ReminderBar";
import { getExercise } from "./data/exercises";
import { spotifyHandleRedirect } from "./spotify";

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
// Geçmiş sınırı artık burada değil: data/history.js son 100 seansı tam detayla,
// öncesini özet (arşiv) satırı olarak tutar. Böylece toplam sayı, tonaj, seri,
// rozet ve rekorlar silinmez.

// GYMO Ligi (liderlik) istatistikleri: geçmişten seri/hafta/toplam/tonaj hesapla
const DAY_MS = 86400000;
const dayKey0 = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
function computeLbStats(hist) {
  const list = Array.isArray(hist) ? hist : [];
  const days = new Set(list.map((s) => dayKey0(s.date)));
  const t0 = dayKey0(Date.now());
  let streak = 0;
  let cur = days.has(t0) ? t0 : (days.has(t0 - DAY_MS) ? t0 - DAY_MS : null);
  while (cur != null && days.has(cur)) { streak++; cur -= DAY_MS; }
  const weekStart = t0 - ((new Date().getDay() + 6) % 7) * DAY_MS;
  let week = 0;
  list.forEach((s) => { if (dayKey0(s.date) >= weekStart) week++; });
  // totalsOf arşiv satırlarını da sayar → lig tonajı geçmiş sıkışsa da düşmez
  const { vol } = totalsOf(list);
  return { streak, week, total: list.length, vol, badges: earnedCount(list) };
}

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
// Antrenman geçmişi de cihazda yedeklenir: bulut okunamadığında yeni antrenman
// kaybolmasın (programlarla aynı güvenlik modeli).
function lsGetHist() {
  try { const a = JSON.parse(localStorage.getItem("fitbe_workouts") || "null"); return Array.isArray(a) ? a : null; } catch (e) { return null; }
}
function lsSetHist(a) {
  try { localStorage.setItem("fitbe_workouts", JSON.stringify(Array.isArray(a) ? a : [])); } catch (e) {}
}
// İlerleme (kilo/ölçü) ve favoriler de cihazda yedeklenir. Eskiden yalnızca
// bulutta duruyorlardı; çevrimdışıyken girilen ölçüm sekme kapanınca gidiyordu.
function lsGetProgress() {
  try { const o = JSON.parse(localStorage.getItem("fitbe_progress") || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; }
}
function lsSetProgress(o) {
  try { localStorage.setItem("fitbe_progress", JSON.stringify(o || { weights: [], measures: [] })); } catch (e) {}
}
function lsGetFavs() {
  try { const a = JSON.parse(localStorage.getItem("fitbe_favorites") || "null"); return Array.isArray(a) ? a : null; } catch (e) { return null; }
}
function lsSetFavs(a) {
  try { localStorage.setItem("fitbe_favorites", JSON.stringify(Array.isArray(a) ? a : [])); } catch (e) {}
}
// Yarım kalan (aktif) antrenman: uygulama kapanınca kaybolmasın, yeniden
// açılışta "devam edilsin mi?" diye sorulsun. { program, i, setNo, warmup, log, savedAt }
function lsGetActiveWorkout() {
  try { return JSON.parse(localStorage.getItem("fitbe_active_workout") || "null"); } catch (e) { return null; }
}
function lsSetActiveWorkout(o) {
  try { localStorage.setItem("fitbe_active_workout", JSON.stringify(o)); } catch (e) {}
}
function lsClearActiveWorkout() {
  try { localStorage.removeItem("fitbe_active_workout"); } catch (e) {}
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
  const loaded = useRef(false);        // ilk yükleme bitti mi (kaydetme açık)
  const cloudReady = useRef(false);    // buluta bu oturumda ULAŞILDI mı → yazma güvenli
  // Kurtarma ve gönderim (flushOutbox) sırasında bayat closure yerine güncel
  // değerleri okumak için. "edited" bayrağı KALDIRILDI: yalnızca program/plan
  // yazmalarında set ediliyordu, antrenman kaydını kapsamıyordu ve yeniden
  // bağlanmada yanlış dala sokup geçmişi kaybettiriyordu. Artık her zaman
  // birleştiriyoruz, bayrağa gerek yok.
  const scheduleRef = useRef({});
  const activeIdRef = useRef(null);
  const programsRef = useRef([]);
  const historyRef = useRef([]);
  const snapshotRef = useRef({});
  const [toast, setToast] = useState("");
  const [profile, setProfile] = useState(lsGetProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [resumeState, setResumeState] = useState(null); // WorkoutMode'a verilen kaldığı-yer bilgisi
  const [resumeAsk, setResumeAsk] = useState(null);      // "devam edilsin mi?" penceresi (snapshot)
  const workoutBusyRef = useRef(false);                  // antrenman/devam penceresi açık mı
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState({ weights: [], measures: [] });
  const [schedule, setSchedule] = useState({});
  const [avatar, setAvatar] = useState(lsGetAvatar);
  const [mentionCount, setMentionCount] = useState(0);
  const [dmCount, setDmCount] = useState(0);   // okunmamış DM sohbet sayısı
  const [dmBump, setDmBump] = useState(0);     // sohbet okununca rozeti tazele
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

  // Spotify OAuth dönüşü: açılışta ?code=... varsa token'a çevirip URL'i temizle
  useEffect(() => { spotifyHandleRedirect(); }, []);

  // --- Auth ---
  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        // Görünen adı cihaza eşitle: Firebase auth displayName kaynak alınır
        // (başka cihazda kaydolmuş olabilir); yerel yoksa oradan doldurulur.
        try {
          const dn = (u.displayName || "").trim();
          const cur = (localStorage.getItem("fitbe_name") || "").trim();
          if (dn && dn !== cur) localStorage.setItem("fitbe_name", dn);
        } catch (e) {}
      }
      if (!u) {
        loaded.current = false; cloudReady.current = false;
        setPrograms([]); setActiveId(null); setProfile(null); setProfileLoaded(false); setHistory([]); setProgress({ weights: [], measures: [] }); setSchedule({}); setAvatar(null); setFavorites([]);
        setWorkout(null); setResumeState(null); setResumeAsk(null);
        // Çıkışta cihaz önbelleğini temizle — başka bir kullanıcı aynı cihazda
        // giriş yapınca önceki kullanıcının verisi görünmesin/karışmasın.
        try { ["fitbe_programs", "fitbe_workouts", "fitbe_profile", "fitbe_avatar", "fitbe_active_workout", "fitbe_name", "fitbe_progress", "fitbe_favorites"].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
        // Bekleyen yazmalar da gitmeli: başka kullanıcı girince önceki
        // kullanıcının kuyruğu onun verisine gönderilmesin.
        clearOutbox();
      }
    });
  }, []);

  // Kurtarma ve gönderim yazmaları için güncel değerleri ref'te tut
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { programsRef.current = programs; }, [programs]);
  useEffect(() => { historyRef.current = history; }, [history]);
  // flushOutbox'ın bekleyen anahtar başına okuyacağı anlık görüntü.
  // Anahtar adları Firebase düğüm adlarıyla birebir aynı olmalı.
  useEffect(() => {
    snapshotRef.current = {
      workouts: history,
      programs: { list: programs, activeId },
      schedule,
      progress,
      favorites,
      profile,
      avatar: avatar || "",
    };
  }, [history, programs, activeId, schedule, progress, favorites, profile, avatar]);
  // Antrenman veya "devam et?" penceresi açıkken oto-güncelleme ERTELENİR
  useEffect(() => { workoutBusyRef.current = !!(workout || resumeAsk); }, [workout, resumeAsk]);

  // --- Kullanıcı verisini yükle (programlar + profil) ---
  // Tasarım ilkesi: bulut OKUNAMAZSA (ağ/izin hatası) hiçbir kritik veri
  // buluta YAZILMAZ (cloudReady=false) — böylece boş/eksik yerel görünüm
  // buluttaki iyi veriyi asla ezmez. Banner/kilit YOK; okuma başarısızsa
  // sessizce arka planda tekrar denenir ve ilk başarıda güvenle eşitlenir.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let retryTimer = null;

    // Bulut programlarını cihazdakiyle BİRLEŞTİRİP uygula + cihaza yedekle.
    // Eskiden bulut listesi yereli koşulsuz eziyordu; çevrimdışı oluşturulan
    // program ve o programa yapılan atamalar kayboluyordu (bkz. data/merge.js).
    function applyMergedPrograms(cloudData, cloudSched, localPack) {
      const cloudList = cloudData && Array.isArray(cloudData.list) ? normalizeList(cloudData.list) : null;
      if (!cloudList && !(localPack && Array.isArray(localPack.list))) return null;
      const { list, activeId: aid } = mergePrograms(
        { list: normalizeList((localPack && localPack.list) || []), activeId: localPack && localPack.activeId },
        { list: cloudList || [], activeId: cloudData && cloudData.activeId }
      );
      const sched = mergeSchedule(
        normalizeSchedule((localPack && localPack.schedule) || {}),
        normalizeSchedule(cloudSched || {})
      );
      setPrograms(list);
      setActiveId(aid || (list[0] && list[0].id) || null);
      setSchedule(sched);
      lsSetPack({ list, activeId: aid || null, schedule: sched });
      return { list, activeId: aid, schedule: sched };
    }

    // 0) Yarım kalan antrenman var mı? — SADECE cihaz kaydına bakar; bulut
    // beklenmez, ağ yavaş/kesik olsa bile "devam et?" penceresi ANINDA çıkar.
    // Koşul: gerçekten başlamış (ısınma geçilmiş ya da ≥1 set) + 18 saatten yeni.
    {
      const aw = lsGetActiveWorkout();
      if (aw && aw.program && Array.isArray(aw.program.exercises) && aw.program.exercises.length &&
          (Date.now() - (aw.savedAt || 0) < 18 * 3600 * 1000) &&
          ((aw.log && aw.log.length) || aw.warmup === false)) {
        setResumeAsk(aw);
      } else if (aw) {
        lsClearActiveWorkout(); // eski/boş kayıt → temizle
      }
    }

    (async () => {
      // 1) Cihazdaki profili + program yedeğini ANINDA göster (bulut beklenmez)
      const localProf = lsGetProfile();
      if (localProf && !cancelled) setProfile(localProf);
      const pack = lsGetPack();
      if (pack && Array.isArray(pack.list) && !cancelled) {
        setPrograms(normalizeList(pack.list));
        setActiveId(pack.activeId || null);
        if (pack.schedule) setSchedule(normalizeSchedule(pack.schedule));
      }
      const localHist = lsGetHist();
      if (localHist && !cancelled) setHistory(localHist);
      const localProgress = lsGetProgress();
      if (localProgress && !cancelled) setProgress(localProgress);
      const localFavs = lsGetFavs();
      if (localFavs && !cancelled) setFavorites(localFavs);

      // 2) Buluttan oku — kritik anahtarlar SONUÇ DURUMLU (ok/veri ayrımı).
      const pr = await dbGetR("programs");
      const sc = await dbGetR("schedule");
      const hist = await dbGetR("workouts");
      const prog = await dbGetR("progress");
      const favs = await dbGetR("favorites");
      const prof = await dbGet("profile");
      const av = await dbGet("avatar");
      if (cancelled) return;

      // programs okuması başarılıysa ağ ayakta → yazma güvenli
      if (pr.ok) cloudReady.current = true;

      // --- BİRLEŞTİR, EZME ---
      // Her anahtar için yerel ve bulut hâli data/merge.js kurallarıyla
      // birleştirilir. Okuma başarısızsa (ok=false) yereli olduğu gibi bırak.
      if (typeof av === "string" && av) { setAvatar(av); lsSetAvatar(av); setPublicAvatar(av); }

      if (favs.ok) {
        const mf = mergeFavorites(localFavs, favs.data, false);
        setFavorites(mf); lsSetFavs(mf);
      }
      if (prog.ok) {
        const mp = mergeProgress(localProgress, prog.data, false);
        setProgress(mp); lsSetProgress(mp);
      }

      let mergedHist = localHist || [];
      if (hist.ok) {
        mergedHist = mergeHistory(localHist, hist.data);
        setHistory(mergedHist); lsSetHist(mergedHist);
      }

      let mergedPack = null;
      if (pr.ok) {
        mergedPack = applyMergedPrograms(pr.data, sc.ok ? sc.data : null, pack);
      } else if (sc.ok && sc.data) {
        // programlar okunamadı ama plan okundu → yalnızca planı birleştir
        setSchedule(mergeSchedule(normalizeSchedule((pack && pack.schedule) || {}), normalizeSchedule(sc.data)));
      }

      if (prof && prof.gender) { setProfile(prof); lsSetProfile(prof); }

      setProfileLoaded(true);
      loaded.current = true;

      if (cloudReady.current) {
        // Birleşme sonucu buluttakinden farklıysa geri yaz — çevrimdışı yapılan
        // antrenman/program böylece buluta çıkar. Aynıysa boşuna PUT atma.
        if (hist.ok && !sameHistory(mergedHist, hist.data)) push("workouts", mergedHist);
        if (mergedPack) {
          const cloudCount = (pr.data && Array.isArray(pr.data.list)) ? pr.data.list.length : 0;
          if (mergedPack.list.length !== cloudCount) {
            push("programs", { list: mergedPack.list, activeId: mergedPack.activeId || null });
            push("schedule", mergedPack.schedule);
          }
        }
        if (localProf && !(prof && prof.gender)) push("profile", localProf);
        dbSet("info", { email: user.email || "", lastSeen: Date.now() });
        // Kullanıcı aramada görünsün + GYMO Ligi istatistiklerini yayınla
        dirPublish();
        lbPublish(computeLbStats(mergedHist));
      }

      // Açılışta bekleyen yazma varsa (önceki oturum çevrimdışı bitmişse) gönder
      if (cloudReady.current) flushOutbox(() => snapshotRef.current);

      // 3) Bulut okunamadıysa: sessizce arka planda tekrar dene (banner YOK).
      // Eskiden burada "kullanıcı düzenledi mi?" (edited) diye bir ayrım vardı;
      // düzenlemediyse bulut verisi yerelin üzerine yazılıyordu. edited bayrağı
      // antrenman kaydını hiç kapsamadığı için, sadece antrenman yapıp çıkan
      // kullanıcı YANLIŞ dala girip geçmişini kaybediyordu. Artık tek dal var:
      // her zaman birleştir. Bayrağa da gerek kalmadı, kaldırıldı.
      if (!pr.ok) {
        let attempt = 0;
        const retry = async () => {
          if (cancelled || cloudReady.current) return;
          attempt++;
          const r = await dbGetR("programs", 1);
          if (cancelled) return;
          if (!r.ok) { retryTimer = setTimeout(retry, Math.min(1500 * attempt, 8000)); return; }
          cloudReady.current = true;

          const sc2 = await dbGetR("schedule", 1);
          if (cancelled) return;
          const mp = applyMergedPrograms(r.data, sc2.ok ? sc2.data : null, {
            list: programsRef.current, activeId: activeIdRef.current, schedule: scheduleRef.current,
          });
          if (mp) {
            push("programs", { list: mp.list, activeId: mp.activeId || null });
            push("schedule", mp.schedule);
          }

          const h2 = await dbGetR("workouts", 1);
          if (cancelled || !h2.ok) return;
          const mh = mergeHistory(historyRef.current, h2.data);
          setHistory(mh); lsSetHist(mh);
          if (!sameHistory(mh, h2.data)) push("workouts", mh);
          lbPublish(computeLbStats(mh));

          flushOutbox(() => snapshotRef.current);
        };
        retryTimer = setTimeout(retry, 1500);
      }
    })();

    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); };
  }, [user]);

  // --- Kaydetme ---
  // Ortak kalıp: cihaza HER ZAMAN yaz (çevrimdışı da olsa kaybolmasın), buluta
  // ise push() ile. push başarısız olursa anahtar "bekliyor" olarak işaretlenir
  // ve bağlantı dönünce flushOutbox onu birleştirip gönderir (utils/sync.js).
  // cloudReady=false iken hiç denemeyip doğrudan işaretliyoruz.
  function saveProfile(p) {
    setProfile(p);
    lsSetProfile(p);
    push("profile", p);
  }

  // Antrenman oturumunu kaydet (en yeni başta).
  // compactHistory: son 100 seans tam detay, öncesi özet satır — hiçbir seans
  // tamamen silinmez (bkz. data/history.js).
  function saveWorkout(session) {
    setHistory((prev) => {
      const next = compactHistory([session, ...prev]);
      lsSetHist(next); // cihaza her zaman (güvenli)
      push("workouts", next);
      if (cloudReady.current) lbPublish(computeLbStats(next));
      return next;
    });
  }

  // İlerleme verisini kaydet (kilo + ölçüler)
  function saveProgress(next) {
    setProgress(next);
    lsSetProgress(next);
    push("progress", next);
  }

  // Profil fotoğrafı (avatar) kaydet/sil
  function saveAvatar(dataUrl) {
    setAvatar(dataUrl || null);
    lsSetAvatar(dataUrl || null);
    push("avatar", dataUrl || "");
    if (cloudReady.current) setPublicAvatar(dataUrl || null);
  }

  // Favori hareket ekle/çıkar
  function toggleFavorite(exId) {
    setFavorites((prev) => {
      const next = prev.includes(exId) ? prev.filter((x) => x !== exId) : [...prev, exId];
      lsSetFavs(next);
      push("favorites", next);
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

  // Bir hareketteki tüm zamanların en iyi tahmini 1RM'i (rekor tespiti için).
  // Arşivlenmiş seanslar da taranır — yoksa yıllar önceki bir rekor "unutulup"
  // daha hafif bir set yanlışlıkla yeni rekor sayılırdı.
  function bestE1RM(exId) {
    let best = 0;
    for (const s of history) {
      const a = bestOf(s)[exId];
      if (a > best) best = a;
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

  // --- Değişiklikte kaydet: cihaza HER ZAMAN (güvenli), buluta push() ile.
  // Çevrimdışıysa push anahtarı "bekliyor" işaretler; bağlantı dönünce
  // flushOutbox buluttakiyle birleştirip gönderir. ---
  useEffect(() => {
    if (!user || !loaded.current) return;
    lsSetPack({ list: programs, activeId, schedule });
    push("programs", { list: programs, activeId });
    push("schedule", schedule);
  }, [programs, activeId, schedule, user]);

  // --- Yedekleme ---
  // snapshot: Profil'deki "Yedeği İndir" bunu JSON'a çevirip indirir.
  function snapshot() {
    return { programs, activeId, schedule, history, progress, favorites, profile, avatar };
  }

  // Yedekten geri yükle. Yalnızca dosyada BULUNAN alanlar değişir; eksik alanlar
  // olduğu gibi kalır. programs/activeId/schedule yukarıdaki efektle kendiliğinden
  // kaydedilir; geri kalanı burada açıkça kalıcılaştırılır.
  async function restoreBackup(d) {
    if (!user) return { success: false, error: "Önce giriş yapmalısın." };
    try {
      if (Array.isArray(d.programs)) setPrograms(normalizeList(d.programs));
      if (d.activeId !== undefined) setActiveId(d.activeId || null);
      if (d.schedule) setSchedule(normalizeSchedule(d.schedule));

      if (Array.isArray(d.history)) {
        const hist = compactHistory(d.history);
        setHistory(hist);
        lsSetHist(hist);
        push("workouts", hist);
        if (cloudReady.current) lbPublish(computeLbStats(hist));
      }
      if (d.progress && typeof d.progress === "object") {
        saveProgress({
          weights: Array.isArray(d.progress.weights) ? d.progress.weights : [],
          measures: Array.isArray(d.progress.measures) ? d.progress.measures : [],
          goalKg: (typeof d.progress.goalKg === "number" && d.progress.goalKg > 0) ? d.progress.goalKg : null,
        });
      }
      if (Array.isArray(d.favorites)) {
        setFavorites(d.favorites);
        lsSetFavs(d.favorites);
        push("favorites", d.favorites);
      }
      if (d.profile && typeof d.profile === "object") saveProfile(d.profile);
      if (d.avatar !== undefined) saveAvatar(d.avatar || null);

      return { success: true };
    } catch (e) {
      return { success: false, error: "Geri yükleme sırasında hata oluştu." };
    }
  }

  // --- Bağlantı geri geldiğinde bekleyenleri gönder ---
  // Eskiden hiçbir online/offline dinleyicisi yoktu: uygulama çevrimiçi açılıp
  // sonra bağlantı koparsa cloudReady sonsuza dek true kalıyor, her yazma
  // sessizce düşüyor ve bir daha asla senkron olmuyordu.
  useEffect(() => {
    if (!user) return;
    let attempt = 0;
    let timer = null;
    let dead = false;

    async function probeAndFlush() {
      if (dead || surelyOffline()) return;
      // navigator.onLine "erişilebilir" demek değil (otel portalı, Firebase
      // kesintisi) — kararı gerçek okuma sonucu verir.
      const r = await dbGetR("programs", 1);
      if (dead) return;
      if (!r.ok) {
        cloudReady.current = false;
        attempt++;
        clearTimeout(timer);
        timer = setTimeout(probeAndFlush, Math.min(1500 * attempt, 8000));
        return;
      }
      attempt = 0;
      cloudReady.current = true;
      flushOutbox(() => snapshotRef.current);
    }

    const off = onReconnect(probeAndFlush);
    const onOffline = () => { cloudReady.current = false; };
    window.addEventListener("offline", onOffline);
    return () => {
      dead = true;
      clearTimeout(timer);
      off();
      window.removeEventListener("offline", onOffline);
    };
  }, [user]);

  // --- Otomatik güncelleme: yeni sürüm yayınlandıysa algıla, bildir, yenile ---
  useEffect(() => {
    let triggered = false;
    async function check() {
      if (triggered) return;
      // Antrenman veya "devam et?" penceresi açıkken ASLA yenileme —
      // güncelleme antrenman bitene kadar ertelenir (90 sn'de bir tekrar denenir).
      if (workoutBusyRef.current) return;
      try {
        const r = await fetch("/version.json?ts=" + Date.now(), { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (j && j.v && typeof __BUILD_ID__ !== "undefined" && j.v !== __BUILD_ID__) {
          if (workoutBusyRef.current) return; // fetch sırasında antrenman başladıysa iptal
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

  // --- Okunmamış DM rozeti: sohbet metalarını tara (60 sn'de bir) ---
  useEffect(() => {
    if (!user) { setDmCount(0); return; }
    let stopped = false;
    async function scanDm() {
      const m = await dmMetaGet();
      if (stopped) return;
      const seen = dmSeenGet(user.uid);
      let n = 0;
      Object.keys(m || {}).forEach((other) => {
        const e = m[other] || {};
        if (e.from && e.from !== user.uid && (e.t || 0) > (seen[other] || 0)) n++;
      });
      setDmCount(n);
    }
    scanDm();
    const iv = setInterval(scanDm, 60000);
    return () => { stopped = true; clearInterval(iv); };
  }, [user, dmBump]);

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

  // Programdaki bir hareketi kalıcı olarak başkasıyla değiştir. Sıra korunur;
  // eski hareketin set/tekrar ayarı ve süperset bağları yeni harekete taşınır.
  function swapExercise(programId, index, newExId) {
    setPrograms((prev) => prev.map((p) => {
      if (p.id !== programId) return p;
      const oldId = p.exercises[index];
      if (!oldId || !newExId || oldId === newExId) return p;
      if (p.exercises.includes(newExId)) return p; // aynı hareket iki kez olmasın
      const exercises = p.exercises.slice();
      exercises[index] = newExId;

      // set/tekrar override'larını taşı
      const sets = { ...(p.sets || {}) };
      if (sets[oldId] != null) { sets[newExId] = sets[oldId]; delete sets[oldId]; }
      const reps = { ...(p.reps || {}) };
      if (reps[oldId] != null) { reps[newExId] = reps[oldId]; delete reps[oldId]; }

      // süperset bağlarında eski id'yi yenisiyle değiştir
      const ssLinks = (Array.isArray(p.ssLinks) ? p.ssLinks : [])
        .map((l) => [l[0] === oldId ? newExId : l[0], l[1] === oldId ? newExId : l[1]]);

      return { ...p, exercises, sets, reps, ssLinks };
    }));
  }

  // Süperset: bir hareketi bir SONRAKİYLE bağla/çöz. ssLinks = [aId, bId] çiftleri.
  // Antrenman modunda bağlı ardışık hareketler dinlenmesiz arka arkaya yapılır.
  function toggleSuperset(programId, index) {
    setPrograms((prev) => prev.map((p) => {
      if (p.id !== programId) return p;
      const a = p.exercises[index], b = p.exercises[index + 1];
      if (!a || !b) return p;
      const links = Array.isArray(p.ssLinks) ? p.ssLinks.slice() : [];
      const at = links.findIndex((l) => l[0] === a && l[1] === b);
      if (at >= 0) links.splice(at, 1); else links.push([a, b]);
      return { ...p, ssLinks: links };
    }));
  }

  // Bir programdaki hareketin set sayısını değiştir (varsayılanı ezen override;
  // hareket id'sine göre saklanır, 1-12 arası). Antrenman bunu kullanır.
  function setExerciseSets(programId, exId, count) {
    const n = Math.max(1, Math.min(12, count | 0));
    setPrograms((prev) => prev.map((p) => {
      if (p.id !== programId) return p;
      return { ...p, sets: { ...(p.sets || {}), [exId]: n } };
    }));
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
  // Gün sayısına göre önerilen haftalık dağılım (0=Pzt … 6=Paz).
  // Antrenman günleri arasına dinlenme serpiştirilir; ardışık ağır günler
  // toparlanmayı zorlar. 6 günde PPL×2 mantığıyla tek gün tam dinlenme kalır.
  const SUGGESTED_DAYS = {
    1: [0],
    2: [0, 3],             // Pzt, Per
    3: [0, 2, 4],          // Pzt, Çar, Cum
    4: [0, 1, 3, 4],       // Pzt, Sal, Per, Cum
    5: [0, 1, 2, 4, 5],    // Pzt, Sal, Çar, Cum, Cmt
    6: [0, 1, 2, 3, 4, 5], // Pzt-Cmt
    7: [0, 1, 2, 3, 4, 5, 6],
  };

  function copyReady(rp) {
    const days = rp.days
      .map((d, idx) => idx)
      .filter((idx) => (rp.days[idx].exercises || []).some((id) => getExercise(id)));
    if (days.length === 0) { flash("Bu programda eklenebilir hareket yok"); return; }
    // Günleri ÖNCEDEN ata: kullanıcı elle atamayı atlarsa haftalık hacim
    // eksik hesaplanıyor ve program "yetersiz" görünüyordu.
    const plan = SUGGESTED_DAYS[days.length] || [];
    const sel = {};
    days.forEach((di, k) => { if (plan[k] != null) sel[di] = plan[k]; });
    setCopyPick({ rp, days, sel });
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
      const exs = (d.exercises || []).filter((x) => getExercise(x));
      // Programın kendi set/tekrar reçetesi varsa (ör. 3×5, 5×5) programa taşı
      const pick = (src) => {
        if (!src) return undefined;
        const out = {}; let any = false;
        exs.forEach((id) => { if (src[id] != null) { out[id] = src[id]; any = true; } });
        return any ? out : undefined;
      };
      const p = { id: uid(), name: rp.name + " — " + d.name, note: d.note || null, exercises: exs };
      const s = pick(d.sets); if (s) p.sets = s;
      const r = pick(d.reps); if (r) p.reps = r;
      return { weekday: (sel[di] != null) ? sel[di] : null, p };
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
      {workout && <WorkoutMode program={workout} resume={resumeState}
        onExit={() => { setWorkout(null); setResumeState(null); lsClearActiveWorkout(); }}
        onFinish={(s) => { saveWorkout(s); setResumeState(null); lsClearActiveWorkout(); }}
        onPersist={(snap) => { if (snap === null) lsClearActiveWorkout(); else lsSetActiveWorkout({ program: workout, ...snap, savedAt: Date.now() }); }}
        lastLog={lastLog} bestE1RM={bestE1RM} />}
      <div className="topbar">
        <div>
          <div className="brand">GYM<span>O</span></div>
          <div className="brand-tag">Gym Obsession</div>
        </div>
        <button className="btn-ghost" onClick={() => setTab("profile")} style={{ padding: avatar ? 4 : undefined }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            : "👤"}
        </button>
      </div>

      {/* Bugünkü antrenman şeridi — hangi sekmede olursan ol görünür */}
      {user && !workout && (
        <ReminderBar schedule={schedule} programs={programs} history={history}
          onStart={(p) => { setResumeState(null); lsClearActiveWorkout(); setWorkout(p); }} />
      )}

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
          onSetCount={setExerciseSets}
          onSwapExercise={swapExercise}
          onToggleSuperset={toggleSuperset}
          onStart={(p) => { setResumeState(null); lsClearActiveWorkout(); setWorkout(p); }}
        />
      )}
      {tab === "nutrition" && <Nutrition />}
      {tab === "progress" && <Progress data={progress} history={history} onSave={saveProgress} />}
      {tab === "feed" && <Social onDmSeen={() => setDmBump((b) => b + 1)} />}
      {tab === "profile" && <Profile profile={profile} email={user && user.email} onSave={saveProfile} avatar={avatar} onSaveAvatar={saveAvatar} history={history} snapshot={snapshot} onRestore={restoreBackup} />}

      {resumeAsk && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 70,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ fontSize: 40, textAlign: "center" }}>⏸️</div>
            <div style={{ fontWeight: 800, fontSize: 18, textAlign: "center", marginTop: 4 }}>Yarım kalan antrenman</div>
            <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", marginTop: 6 }}>
              <b style={{ color: "var(--text)" }}>{resumeAsk.program.name}</b><br />
              {((resumeAsk.i || 0) + 1)}. hareket
              {(resumeAsk.log && resumeAsk.log.length) ? " · " + resumeAsk.log.length + " set yapıldı" : ""}.
              Kaldığın yerden devam edilsin mi?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <button className="btn-primary" onClick={() => {
                setResumeState({ i: resumeAsk.i || 0, setNo: resumeAsk.setNo || 1, warmup: !!resumeAsk.warmup, log: resumeAsk.log || [] });
                setWorkout(resumeAsk.program);
                setResumeAsk(null);
              }}>▶ Devam et</button>
              <button className="btn-ghost" style={{ padding: 12 }} onClick={() => {
                setResumeState(null); lsClearActiveWorkout();
                setWorkout(resumeAsk.program);
                setResumeAsk(null);
              }}>🔄 Baştan başlat</button>
              <button className="btn-ghost" style={{ padding: 12, color: "var(--danger)" }} onClick={() => {
                lsClearActiveWorkout(); setResumeAsk(null);
              }}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}

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
              Her gün ayrı bir program olarak eklenecek. Günler <b>önerilen dağılıma göre seçili geldi</b>
              (arada dinlenme kalacak şekilde) — istersen değiştir.
            </div>
            {copyPick.days.length > 1 && Object.values(copyPick.sel).filter((v) => v != null).length < copyPick.days.length && (
              <div style={{ color: "#fbbf24", fontSize: 11.5, marginBottom: 10, lineHeight: 1.5 }}>
                ⚠️ Güne atanmayan programlar <b>haftalık toplam hacme dahil edilmez</b> ve program olduğundan
                düşük hacimli görünür. Tüm günleri atamanı öneririz.
              </div>
            )}
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
            {t.id === "feed" && (mentionCount + dmCount) > 0 && (
              <span style={{
                position: "absolute", top: 0, right: "50%", marginRight: -22,
                background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 800,
                minWidth: 15, height: 15, borderRadius: 999, padding: "0 4px",
                display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>{(mentionCount + dmCount) > 9 ? "9+" : mentionCount + dmCount}</span>
            )}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
