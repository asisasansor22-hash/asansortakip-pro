import React from "react";
import Lottie from "lottie-react";
import { getLottie } from "../data/lottieMap";

// Egzersiz animasyonu.
// 1) Eğer bu hareket tipi için lottieMap.js'te profesyonel bir Lottie tanımlıysa
//    onu oynatır (birebir kalite).
// 2) Yoksa, aşağıdaki kaslı (bodybuilder) stilize SVG karakterine düşer —
//    "Atlas Prime" tarzı; eklem yapısı index.css'teki ".fig-<type>" keyframe'leriyle canlanır.
//
// Eklemler (viewBox 0 0 200 230):
//   omuz (100,78) · dirsek (100,104) · el (100,132)
//   kalça (100,130) · diz (100,168) · ayak bileği (100,205)

const LYING = { benchpress: true, crunch: true };
const ON_FLOOR = { pushup: true, plank: true };

const SKIN = "#b9c2cb";     // gri ten
const SHORTS = "#262b36";   // koyu şort
const LINE = "rgba(33,42,54,.40)"; // kas çizgisi / gölge

export default function ExerciseAnimation({ type = "idle", size = 180, color = SKIN }) {
  const t = type || "idle";

  // 1) Profesyonel Lottie varsa onu kullan
  const lottie = getLottie(t);
  if (lottie) {
    return <Lottie animationData={lottie} loop autoplay style={{ width: size, height: size }} />;
  }

  // 2) Yedek: kaslı SVG karakter
  const lying = LYING[t];
  const floor = ON_FLOOR[t];
  const dx = -7; // arka uzuv ötelemesi (derinlik)

  return (
    <svg
      className={"exfig fig-" + t}
      viewBox="0 0 200 230"
      width={size}
      height={size}
      role="img"
      aria-label={"Egzersiz animasyonu: " + t}
    >
      {!lying && !floor && <line className="ground" x1="55" y1="208" x2="145" y2="208" />}
      {floor && <line className="ground" x1="30" y1="208" x2="170" y2="208" />}
      {lying && <rect className="bench" x="45" y="150" width="110" height="10" rx="3" />}

      <g className="figure" fill={color}>
        {/* ===== BACAK (kalçadan döner) ===== */}
        <g className="leg">
          {/* arka bacak */}
          <path className="part far" d={`M${85 + dx} 130 Q${80 + dx} 150 ${88 + dx} 170 L${110 + dx} 170 Q${116 + dx} 150 ${111 + dx} 130 Z`} />
          {/* ön uyluk (kaslı) */}
          <path className="part" d="M89 130 Q83 150 90 170 L110 170 Q117 150 111 130 Z" />
          <path d="M100 138 Q104 152 100 168" fill="none" stroke={LINE} strokeWidth="1.6" />
          {/* şort flabı */}
          <path className="part" fill={SHORTS} d="M88 128 L112 128 L110 142 Q100 146 90 142 Z" />
          <g className="shin">
            <rect className="part far" x={92 + dx} y="166" width="15" height="42" rx="7" />
            <path className="part" d="M93 166 L107 166 Q110 182 104 206 L96 206 Q90 182 93 166 Z" />
            <ellipse cx="95" cy="182" rx="4" ry="9" fill={LINE} opacity="0.5" />
            {/* ayak */}
            <rect className="part" x="96" y="201" width="27" height="9" rx="4" />
          </g>
        </g>

        {/* ===== ÜST GÖVDE (kalçadan döner: gövde + baş + kol) ===== */}
        <g className="upperbody">
          {/* gövde: V-taper kaslı siluet */}
          <path className="part" d="M80 86 Q100 72 120 86 L110 132 Q100 137 90 132 Z" />
          {/* göğüs (pecs) */}
          <path d="M91 96 Q100 104 109 96" fill="none" stroke={LINE} strokeWidth="1.8" />
          <path d="M100 90 L100 100" fill="none" stroke={LINE} strokeWidth="1.4" />
          {/* karın (abs) */}
          <path d="M100 104 L100 128" fill="none" stroke={LINE} strokeWidth="1.4" />
          <path d="M93 110 H107 M93 118 H107" fill="none" stroke={LINE} strokeWidth="1.2" />
          {/* şort (pelvis) */}
          <path className="part" fill={SHORTS} d="M88 126 Q100 132 112 126 L112 138 Q100 143 88 138 Z" />

          {/* boyun + baş */}
          <rect className="part" x="95" y="64" width="10" height="14" rx="4" />
          <circle className="part head" cx="100" cy="52" r="15" />
          {/* alındaki "A" + gözler */}
          <text x="100" y="50" fontSize="9" fontWeight="800" fill={LINE} textAnchor="middle">A</text>
          <path d="M94 56 l4 1 M106 56 l-4 1" stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* kol (omuzdan döner) */}
          <g className="arm">
            {/* deltoid */}
            <circle className="part" cx="100" cy="82" r="11" />
            {/* arka üst kol */}
            <rect className="part far" x={93 + dx} y="80" width="15" height="28" rx="7" />
            {/* ön üst kol (biceps) */}
            <path className="part" d="M92 80 Q88 94 93 108 L107 108 Q112 94 108 80 Z" />
            <path d="M100 86 Q103 94 100 104" fill="none" stroke={LINE} strokeWidth="1.4" />
            <g className="forearm">
              <rect className="part far" x={94 + dx} y="104" width="13" height="30" rx="6" />
              <path className="part" d="M93 104 L107 104 Q108 120 104 134 L96 134 Q92 120 93 104 Z" />
              <circle className="part hand" cx="100" cy="134" r="7" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
