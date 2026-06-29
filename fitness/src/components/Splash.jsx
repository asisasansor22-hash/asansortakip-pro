import React from "react";

// Uygulama açılış (splash) ekranı — Fitbe markası.
export default function Splash({ hiding }) {
  return (
    <div className={"splash" + (hiding ? " hide" : "")}>
      <svg width="92" height="58" viewBox="0 0 100 60" fill="var(--accent)" aria-hidden="true">
        <rect x="40" y="26" width="20" height="8" rx="3" />
        <rect x="30" y="16" width="11" height="28" rx="4" />
        <rect x="59" y="16" width="11" height="28" rx="4" />
        <rect x="20" y="21" width="9" height="18" rx="3" />
        <rect x="71" y="21" width="9" height="18" rx="3" />
      </svg>
      <div className="splash-word">Fit<span>be</span></div>
      <div className="splash-sub">Antrenman & Beslenme</div>
    </div>
  );
}
