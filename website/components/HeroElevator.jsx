"use client";

import { useEffect, useState } from "react";

// Self-contained, photo-free animated elevator used in the homepage hero.
// Pure CSS keyframes drive the ambient motion (door cycle, light sweep,
// status LED); React only advances the floor read-out so it feels alive.
// To use a real photo later, drop it into `.hx-photo` and hide `.hx-stage`.
const FLOOR_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2];

export default function HeroElevator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % FLOOR_SEQUENCE.length), 2400);
    return () => clearInterval(id);
  }, []);

  const floor = FLOOR_SEQUENCE[step];
  const prev = FLOOR_SEQUENCE[(step - 1 + FLOOR_SEQUENCE.length) % FLOOR_SEQUENCE.length];
  const goingUp = floor >= prev;

  return (
    <div className="hx" aria-hidden="true">
      <div className="hx-glow" />
      <div className="hx-stage">
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

        {/* Kabin / kapı */}
        <div className="hx-cabin">
          <div className="hx-interior">
            <div className="hx-handrail" />
            <div className="hx-mirror" />
            <div className="hx-ceiling-light" />
          </div>
          <div className="hx-door hx-door-l">
            <span className="hx-door-line" />
          </div>
          <div className="hx-door hx-door-r">
            <span className="hx-door-line" />
          </div>
          <div className="hx-sheen" />
        </div>

        {/* Zemin yansıması */}
        <div className="hx-base">
          <div className="hx-reflection" />
        </div>
      </div>

      <div className="hx-badge">
        <i className="hx-badge-dot" />
        7/24 Aktif Servis
      </div>
    </div>
  );
}
