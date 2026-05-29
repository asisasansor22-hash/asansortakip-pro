"use client";

import { useEffect, useRef, useState } from "react";

// Self-contained, photo-free animated elevator used in the homepage hero.
// A JS timing state-machine drives the whole cycle so it reads like a real
// cabin: it travels to a floor (duration scales with the rated speed), the
// floor number updates exactly as it arrives — right BEFORE the doors open —
// then the doors open, hold, and close before the next trip.
// To use a real photo later, drop it into `.hx-photo` and hide `.hx-stage`.
const CALL_FLOORS = [7, 6, 5, 4, 3, 2, 1];
const STOPS = [1, 4, 7, 3, 6, 2, 5]; // ziyaret edilen kat rotası

// Gerçekçi asansör konfigürasyonları — kapasite ve hız kademe kademe artar.
// Kişi sayıları TS EN 81-20/50'ye göre: yolcu sayısı = beyan yükü / 75
// (aşağı yuvarlanır). Hız, kabinin kata geliş süresini belirler.
const CONFIGS = [
  { kapasite: "320 kg · 4 kişi", hiz: "1.0 m/s", v: 1.0 },
  { kapasite: "450 kg · 6 kişi", hiz: "1.0 m/s", v: 1.0 },
  { kapasite: "630 kg · 8 kişi", hiz: "1.6 m/s", v: 1.6 },
  { kapasite: "800 kg · 10 kişi", hiz: "1.6 m/s", v: 1.6 },
  { kapasite: "1000 kg · 13 kişi", hiz: "2.0 m/s", v: 2.0 },
  { kapasite: "1275 kg · 17 kişi", hiz: "2.5 m/s", v: 2.5 },
  { kapasite: "1600 kg · 21 kişi", hiz: "2.5 m/s", v: 2.5 },
  { kapasite: "2000 kg · 26 kişi", hiz: "3.0 m/s", v: 3.0 }
];

const DOOR_MS = 700; // kapı açılma/kapanma süresi (CSS geçişiyle aynı)
const HOLD_MS = 1500; // kapı açık bekleme

export default function HeroElevator() {
  const [floor, setFloor] = useState(STOPS[0]);
  const [goingUp, setGoingUp] = useState(true);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [cfg, setCfg] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDoorsOpen(true);
      return;
    }

    let cancelled = false;
    let stopIdx = 0;
    let current = STOPS[0];
    let cfgIdx = 0;

    const wait = (fn, ms) => {
      timer.current = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const startTrip = () => {
      const from = current;
      stopIdx = (stopIdx + 1) % STOPS.length;
      const target = STOPS[stopIdx];
      const dir = target >= from ? 1 : -1;
      const steps = Math.abs(target - from);

      // Bu yolculuğun hızı (kademeli döner); kata geliş süresini belirler.
      cfgIdx = (cfgIdx + 1) % CONFIGS.length;
      setCfg(cfgIdx);
      const speed = CONFIGS[cfgIdx].v;
      const perFloor = 1000 / speed; // 3 m/s → ~333ms/kat, 1 m/s → 1000ms/kat

      setGoingUp(dir > 0);

      let s = 0;
      const tick = () => {
        s += 1;
        current = from + dir * s; // kabin bir kat ilerledi, rakam değişti
        setFloor(current);
        if (s < steps) {
          wait(tick, perFloor); // sonraki kata ilerle
        } else {
          // Kata gelindi; rakam zaten hedefe ayarlandı. Kısa bir an sonra,
          // kapı AÇILMADAN hemen önce rakam görünür şekilde oturmuş olur.
          wait(openDoors, 260);
        }
      };
      wait(tick, perFloor);
    };

    const openDoors = () => {
      setDoorsOpen(true);
      wait(closeDoors, DOOR_MS + HOLD_MS);
    };

    const closeDoors = () => {
      setDoorsOpen(false);
      wait(startTrip, DOOR_MS + 300); // kapı tam kapansın, sonra yola çık
    };

    wait(startTrip, 900);

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, []);

  const config = CONFIGS[cfg];
  const SPECS = [
    { label: "Kapasite", value: config.kapasite },
    { label: "Hız", value: config.hiz },
    { label: "Standart", value: "TS EN 81-20/50" }
  ];

  return (
    <div className="hx" aria-hidden="true">
      <div className="hx-glow" />
      <div className="hx-stage">
        {/* 7/24 aktif servis — kabinin üstünde, animasyonsuz şerit */}
        <div className="hx-badge">
          <i className="hx-badge-dot" />
          7/24 Aktif Servis
        </div>

        {/* Üst gösterge */}
        <div className="hx-indicator">
          <span className={`hx-arrow ${goingUp ? "is-up" : "is-down"}`}>
            {goingUp ? "▲" : "▼"}
          </span>
          <span className="hx-floor" key={floor}>{floor}</span>
          <span className="hx-status">
            <i className="hx-led" /> ASIS
          </span>
        </div>

        <div className="hx-body">
          {/* Kabin / kapı */}
          <div className={`hx-cabin${doorsOpen ? " is-open" : ""}`}>
            <div className="hx-interior">
              <div className="hx-ceiling-light" />
              <div className="hx-handrail" />
              <div className="hx-mirror" />
              <div className="hx-spots" />
            </div>
            <div className="hx-door hx-door-l">
              <span className="hx-door-line" />
            </div>
            <div className="hx-door hx-door-r">
              <span className="hx-door-line" />
            </div>
            <div className="hx-sheen" />
          </div>

          {/* Kat çağrı paneli — bulunulan kat yanar */}
          <div className="hx-calls">
            {CALL_FLOORS.map((f) => (
              <span
                key={f}
                className={`hx-call${f === floor ? " is-on" : ""}`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Teknik özellikler */}
        <div className="hx-specs">
          {SPECS.map((s) => (
            <div key={s.label} className="hx-spec">
              <span className="hx-spec-label">{s.label}</span>
              <span className="hx-spec-value">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Zemin yansıması */}
        <div className="hx-base">
          <div className="hx-reflection" />
        </div>
      </div>
    </div>
  );
}
